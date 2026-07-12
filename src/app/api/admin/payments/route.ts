import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { paymentId, status } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { success: false, error: "Payment ID and status are required" },
        { status: 400 }
      );
    }

    if (!["verified", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status must be 'verified' or 'rejected'" },
        { status: 400 }
      );
    }

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .update({ status, verified_at: status === "verified" ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
      .eq("id", paymentId)
      .select()
      .single();

    if (paymentError) throw paymentError;

    // If verified, update order status
    if (status === "verified") {
      const { error: orderError } = await supabaseAdmin
        .from("orders")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", payment.order_id);

      if (orderError) throw orderError;
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
