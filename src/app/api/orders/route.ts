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
  items: z.array(orderItemSchema).min(1),
});

function validationError(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
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
    const { data: order, error } = await supabaseAdmin.rpc("create_order", {
      p_user_id: user.id,
      p_customer: {
        full_name: orderInput.full_name,
        email: orderInput.email,
        phone: orderInput.phone,
        address: orderInput.address || "Store pickup",
        township: orderInput.township || "Store pickup",
        city: orderInput.city || "Store pickup",
        state: orderInput.state || "Store pickup",
        zip: orderInput.zip || null,
        notes: orderInput.notes || null,
      },
      p_items: orderInput.items,
    });

    if (error) {
      const expectedError = ["invalid", "inactive", "variant", "insufficient", "price", "stock"].some((term) =>
        error.message.toLowerCase().includes(term)
      );
      if (expectedError) return validationError(error.message);
      throw error;
    }

    let savedOrder = order;
    let referenceSaved = false;
    for (let attempt = 0; attempt < 5 && !referenceSaved; attempt += 1) {
      const paymentReference = createPaymentReference();
      const pickup = orderInput.fulfillment_method === "pickup";
      const { data: updatedOrder, error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          payment_reference: paymentReference,
          fulfillment_method: orderInput.fulfillment_method,
          ...(pickup ? { delivery_fee: 0, total: Number(order.subtotal) } : {}),
        })
        .eq("id", order.id)
        .select()
        .single();

      if (!updateError) {
        savedOrder = updatedOrder;
        referenceSaved = true;
      } else if (updateError.code !== "23505") {
        throw updateError;
      }
    }
    if (!referenceSaved) throw new Error("Unable to generate a unique payment reference");

    return NextResponse.json(
      { success: true, data: savedOrder },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
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
