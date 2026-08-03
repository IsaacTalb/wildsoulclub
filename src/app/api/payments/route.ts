import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { order_id, method, payment_image, payment_object_key } = body;

    if (!order_id || !method || !payment_image || !payment_object_key) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (!["kpay", "wave", "ayapay", "cbpay"].includes(method)) {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, total, payment_reference")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const { data: existingPayment } = await supabaseAdmin.from("payments").select("id").eq("order_id", order_id).maybeSingle();
    if (existingPayment) return NextResponse.json({ success: false, error: "Payment proof already exists for this order" }, { status: 409 });

    const { data, error } = await supabaseAdmin
      .from("payments")
      .insert({
        order_id,
        method,
        transaction_id: order.payment_reference,
        payment_image,
        payment_object_key,
        amount: order.total,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
