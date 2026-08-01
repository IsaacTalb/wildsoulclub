import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthUser } from "@/lib/auth";

const orderItemSchema = z.object({
  product_id: z.uuid(),
  variant_id: z.uuid().nullable().optional(),
  quantity: z.number().int().positive(),
  size: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
});

const createOrderSchema = z.object({
  full_name: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  township: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
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
    const { data: order, error } = await supabaseAdmin.rpc("create_order", {
      p_user_id: user.id,
      p_customer: {
        full_name: orderInput.full_name,
        email: orderInput.email,
        phone: orderInput.phone,
        address: orderInput.address,
        township: orderInput.township,
        city: orderInput.city,
        state: orderInput.state,
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

    return NextResponse.json(
      { success: true, data: order },
      { status: 201 }
    );
  } catch (error) {
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
      .select("*, order_items(*)")
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
