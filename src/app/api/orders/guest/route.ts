import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hashGuestOrderToken, verifyGuestOrderHash } from "@/lib/server/order-access";

const guestLookupSchema = z.object({
  order_identifier: z.string().trim().min(1).max(128),
  capability: z.string().min(32).max(256),
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid lookup request" }, { status: 400 });
  }

  const parsed = guestLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Enter a valid order number and guest access code" }, { status: 400 });
  }

  const { order_identifier: identifier, capability } = parsed.data;
  const identifierColumn = UUID_PATTERN.test(identifier) ? "id" : "order_number";
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("order_number, user_id, guest_access_token_hash, subtotal, delivery_fee, discount_amount, total, status, payment_status, payment_reference, courier, tracking_number, created_at, updated_at, order_items(quantity, size, color, unit_price, products(name, thumbnail_url))")
    .eq(identifierColumn, identifier)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: "Unable to look up this order" }, { status: 500 });
  }

  const suppliedHash = await hashGuestOrderToken(capability);
  if (order?.user_id !== null || !verifyGuestOrderHash(suppliedHash, order?.guest_access_token_hash)) {
    // Deliberately use the same response for unknown orders and invalid credentials.
    return NextResponse.json({ success: false, error: "Order number or guest access code is incorrect" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      order_number: order.order_number,
      items: order.order_items,
      totals: {
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        discount_amount: order.discount_amount,
        total: order.total,
      },
      fulfillment_status: order.status,
      payment_status: order.payment_status,
      payment_reference: order.payment_reference,
      courier: order.courier,
      tracking_number: order.tracking_number,
      created_at: order.created_at,
      updated_at: order.updated_at,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
