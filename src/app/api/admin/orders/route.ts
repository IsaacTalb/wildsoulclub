import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/auth";

const allowedStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof allowedStatuses)[number];

function isAllowedStatus(status: unknown): status is OrderStatus {
  return typeof status === "string" && allowedStatuses.includes(status as OrderStatus);
}

function isInvalidTransition(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  return currentStatus === "delivered" && nextStatus === "pending";
}

export async function GET() {
  try {
    await requireAdmin();

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*, products(name)), payments(*)")
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

export async function PATCH(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { orderId, status, courier, tracking_number } = body;

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

    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (fetchError) throw fetchError;

    const currentStatus = existingOrder?.status;
    if (!isAllowedStatus(currentStatus)) {
      return NextResponse.json(
        { success: false, error: "Order has an invalid current fulfillment status" },
        { status: 400 }
      );
    }

    if (isInvalidTransition(currentStatus, status)) {
      return NextResponse.json(
        { success: false, error: "Delivered orders cannot be moved back to pending" },
        { status: 400 }
      );
    }

    const updates: Record<string, string | null> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "shipped") {
      updates.courier = typeof courier === "string" ? courier.trim() || null : null;
      updates.tracking_number = typeof tracking_number === "string" ? tracking_number.trim() || null : null;
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}
