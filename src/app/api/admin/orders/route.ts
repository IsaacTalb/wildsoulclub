import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*, products(name)), payments(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
