import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthUser } from "@/lib/auth";

const REFERENCE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const REFERENCE_NUMBERS = "23456789";

function createPaymentReference() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const characters = [
    ...Array.from(bytes.slice(0, 3), (byte) => REFERENCE_LETTERS[byte % REFERENCE_LETTERS.length]),
    ...Array.from(bytes.slice(3, 6), (byte) => REFERENCE_NUMBERS[byte % REFERENCE_NUMBERS.length]),
  ];
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = bytes[index + 5] % (index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
  return characters.join("");
}

const orderItemSchema = z.object({
  product_id: z.uuid(),
  variant_id: z.uuid().nullable().optional(),
  quantity: z.number().int().positive(),
  size: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
});

const createOrderSchema = z.object({
  fulfillment_method: z.enum(["delivery", "pickup"]),
  full_name: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().min(1),
  address: z.string().trim().optional().nullable(),
  township: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: z.string().trim().optional().nullable(),
  zip: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  coupon_code: z.string().trim().max(64).optional().nullable(),
  items: z.array(orderItemSchema).min(1),
});

function validationError(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

type DatabaseError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

function isMissingCheckoutRpc(error: DatabaseError) {
  return ["PGRST202", "42703", "42883", "42P01"].includes(error.code ?? "");
}

function databaseErrorResponse(error: DatabaseError) {
  console.error("Order database operation failed", {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  const message = error.message?.trim() ?? "";
  const normalized = message.toLowerCase();
  const customerSafeRpcError = error.code === "P0001" || [
    "invalid",
    "inactive",
    "variant",
    "insufficient",
    "price",
    "stock",
    "required",
  ].some((term) => normalized.includes(term));

  if (customerSafeRpcError && message) return validationError(message);

  if (error.code === "23503") {
    return validationError("A product or account record is no longer available. Refresh your cart and try again.");
  }
  if (error.code === "23505") {
    return NextResponse.json({ success: false, error: "An order reference conflict occurred. Please try again." }, { status: 409 });
  }
  if (error.code === "23514") {
    return validationError("The order contains a value that is no longer accepted. Refresh and try again.");
  }
  if (["PGRST202", "42703", "42883", "42P01"].includes(error.code ?? "")) {
    return NextResponse.json(
      { success: false, error: "Checkout database setup is out of date. Please contact store support." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { success: false, error: "Unable to create the order. Please try again." },
    { status: 500 },
  );
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return validationError("Invalid JSON body");
    }

    const parsed = createOrderSchema.safeParse(json);
    if (!parsed.success) {
      return validationError("Invalid order request");
    }

    const orderInput = parsed.data;
    if (orderInput.fulfillment_method === "delivery" &&
      (!orderInput.address || !orderInput.township || !orderInput.city || !orderInput.state)) {
      return validationError("Delivery address is required");
    }

    // Older Auth accounts can predate the auth.users -> public.users trigger.
    // Ensure the foreign-key target exists before create_order inserts the order.
    const { error: userSyncError } = await supabaseAdmin.from("users").upsert({
      id: user.id,
      email: user.email ?? orderInput.email,
      full_name: orderInput.full_name,
      phone: orderInput.phone,
    }, { onConflict: "id" });
    if (userSyncError) return databaseErrorResponse(userSyncError);

    const customer = {
      full_name: orderInput.full_name,
      email: orderInput.email,
      phone: orderInput.phone,
      address: orderInput.address || "Store pickup",
      township: orderInput.township || "Store pickup",
      city: orderInput.city || "Store pickup",
      state: orderInput.state || "Store pickup",
      zip: orderInput.zip || null,
      notes: orderInput.notes || null,
    };

    let savedOrder: Record<string, unknown> | null = null;
    let lastError: DatabaseError | null = null;
    for (let attempt = 0; attempt < 5 && !savedOrder; attempt += 1) {
      const paymentReference = createPaymentReference();
      const { data: order, error } = await supabaseAdmin.rpc("create_checkout_order", {
        p_user_id: user.id,
        p_customer: customer,
        p_items: orderInput.items,
        p_fulfillment_method: orderInput.fulfillment_method,
        p_payment_reference: paymentReference,
        p_coupon_code: orderInput.coupon_code || null,
      });

      if (!error && order?.id) savedOrder = order;
      else if (error?.code === "23505") lastError = error;
      else if (error && isMissingCheckoutRpc(error)) {
        if (orderInput.coupon_code) return databaseErrorResponse(error);
        // Fall back while the checkout RPC or its cached schema is still being deployed.
        const { data: legacyOrder, error: legacyError } = await supabaseAdmin.rpc("create_order", {
          p_user_id: user.id,
          p_customer: customer,
          p_items: orderInput.items,
        });
        if (legacyError) return databaseErrorResponse(legacyError);
        if (!legacyOrder?.id) {
          console.error("Legacy order RPC returned no order", { legacyOrder });
          return NextResponse.json({ success: false, error: "The order could not be created. Please try again." }, { status: 500 });
        }

        if (orderInput.fulfillment_method === "delivery" && legacyOrder.payment_reference && Number(legacyOrder.delivery_fee) === 0) {
          savedOrder = legacyOrder;
        } else {
          const { data: finalizedOrder, error: finalizeError } = await supabaseAdmin
            .from("orders")
            .update({
              payment_reference: paymentReference,
              fulfillment_method: orderInput.fulfillment_method,
              delivery_fee: 0,
              total: Number(legacyOrder.subtotal),
            })
            .eq("id", legacyOrder.id)
            .select()
            .single();
          if (finalizeError) return databaseErrorResponse(finalizeError);
          savedOrder = finalizedOrder;
        }
      } else if (error) {
        return databaseErrorResponse(error);
      } else {
        console.error("Order RPC returned no order", { order });
        return NextResponse.json({ success: false, error: "The order could not be created. Please try again." }, { status: 500 });
      }
    }
    if (!savedOrder) return databaseErrorResponse(lastError ?? { message: "Unable to generate a unique payment reference" });

    return NextResponse.json(
      { success: true, data: savedOrder },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected order creation failure", error);
    return NextResponse.json(
      { success: false, error: "Unable to create the order. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*, products(name, thumbnail_url)), payments(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
