import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth";

const allowedStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof allowedStatuses)[number];

function isAllowedStatus(status: unknown): status is OrderStatus {
  return typeof status === "string" && allowedStatuses.includes(status as OrderStatus);
}

export async function GET() {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, user_id, full_name, email, phone, address, township, city, state, zip, notes, payment_reference, fulfillment_method, subtotal, delivery_fee, coupon_code, discount_amount, total, status, payment_status, courier, tracking_number, created_at, updated_at, order_items(*, products(name)), payments(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const adminUserId = await requireAdmin();

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: "Order ID and fulfillment status are required" },
        { status: 400 }
      );
    }

    if (!isAllowedStatus(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid fulfillment status. Use one of: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc("update_order_status", {
      p_order_id: orderId,
      p_status: status,
      p_courier: null,
      p_tracking_number: null,
      p_actor_user_id: adminUserId,
    });

    if (error) {
      if (["invalid", "not found", "cannot"].some((term) => error.message.toLowerCase().includes(term))) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
