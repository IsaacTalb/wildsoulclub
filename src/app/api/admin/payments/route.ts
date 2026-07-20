import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from("payments")
      .select("*, orders(order_number, full_name, status)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { paymentId, status, admin_notes } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { success: false, error: "Payment ID and status are required" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected", "expired"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status must be 'approved', 'rejected', or 'expired'" },
        { status: 400 }
      );
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .update({ status, admin_notes: admin_notes ?? null, updated_at: new Date().toISOString() })
      .eq("id", paymentId)
      .select()
      .single();

    if (paymentError) throw paymentError;

    const nextOrderValues = status === "approved"
      ? { status: "paid", payment_status: "approved", updated_at: new Date().toISOString() }
      : { payment_status: status, updated_at: new Date().toISOString() };

    const { error: orderError } = await supabaseAdmin
      .from("orders")
      .update(nextOrderValues)
      .eq("id", payment.order_id);

    if (orderError) throw orderError;

    return NextResponse.json({ success: true, data: payment });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
