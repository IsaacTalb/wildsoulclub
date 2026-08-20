import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authorizeOrderAccess } from "@/lib/server/order-access";
import { getR2PublicUrl } from "@/lib/server/public-image-url";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, method, payment_object_key, guest_access_token } = body;

    if (typeof order_id !== "string" || !method || typeof payment_object_key !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (!["kpay", "wave", "ayapay", "cbpay"].includes(method)) {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 });
    }

    const order = await authorizeOrderAccess(order_id, guest_access_token);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!payment_object_key.startsWith(`payments/${order.id}/`)) {
      return NextResponse.json({ success: false, error: "Invalid payment upload" }, { status: 400 });
    }

    const { data: existingPayment } = await supabaseAdmin.from("payments").select("id").eq("order_id", order_id).maybeSingle();
    if (existingPayment) return NextResponse.json({ success: false, error: "Payment proof already exists for this order" }, { status: 409 });

    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id,
        method,
        transaction_id: order.payment_reference,
        payment_image: getR2PublicUrl(payment_object_key),
        payment_object_key,
        amount: order.total,
        status: "pending",
      })
      .select("id, order_id, method, transaction_id, payment_image, payment_object_key, amount, status, created_at, updated_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json(
        { success: false, error: "Payment proof already exists for this order" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
