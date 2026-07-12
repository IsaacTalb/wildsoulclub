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
    const { items, shipping_address, payment_method, notes } = body;

    if (!items?.length || !shipping_address || !payment_method) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = items.map((item: any) => {
      const total = item.price * item.quantity;
      subtotal += total;
      return { product_id: item.product_id, variant_id: item.variant_id, quantity: item.quantity, price: item.price, total };
    });

    const delivery_fee = subtotal >= 100000 ? 0 : 5000;
    const total = subtotal + delivery_fee;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        subtotal,
        delivery_fee,
        total,
        shipping_address,
        payment_method,
        notes,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems.map((item: any) => ({ ...item, order_id: order.id })));

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
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
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
