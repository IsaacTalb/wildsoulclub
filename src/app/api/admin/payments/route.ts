import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth";

type ReviewPaymentResult = {
  success: boolean;
  error: string | null;
  payment: unknown;
};

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
    const adminUserId = await requireAdmin();

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

    const { data: result, error: reviewError } = await supabaseAdmin
      .rpc("review_payment", {
        p_payment_id: paymentId,
        p_status: status,
        p_admin_notes: admin_notes ?? null,
        p_reviewed_by: adminUserId,
      })
      .single();

    if (reviewError) throw reviewError;

    const reviewResult = result as ReviewPaymentResult | null;

    if (!reviewResult?.success) {
      return NextResponse.json(
        { success: false, error: reviewResult?.error ?? "Unable to update payment" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, data: reviewResult.payment });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
