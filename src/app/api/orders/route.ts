import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthUser } from "@/lib/auth";

type OrderRequestItem = {
  product_id?: string;
  variant_id?: string | null;
  quantity?: number;
};

type PreparedOrderItem = {
  product_id: string;
  variant_id: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
  price: number;
};

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { items, full_name, email, phone, address, township, city, state, zip, notes } = body;

    if (!items?.length || !full_name || !email || !phone || !address || !township || !city || !state) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedItems = (items as OrderRequestItem[]).map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      quantity: Number(item.quantity),
    }));

    if (normalizedItems.some((item) => !item.product_id || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      return NextResponse.json(
        { success: false, error: "Invalid cart items" },
        { status: 400 }
      );
    }

    const productIds = [...new Set(normalizedItems.map((item) => item.product_id as string))];
    const variantIds = [...new Set(normalizedItems.map((item) => item.variant_id).filter(Boolean) as string[])];

    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, price, sale_price, is_active, stock")
      .in("id", productIds);

    if (productsError) throw productsError;

    const variants = variantIds.length
      ? await supabaseAdmin
          .from("product_variants")
          .select("id, product_id, price, size, color, stock")
          .in("id", variantIds)
      : { data: [], error: null };

    if (variants.error) throw variants.error;

    const productsById = new Map((products ?? []).map((product) => [product.id, product]));
    const variantsById = new Map((variants.data ?? []).map((variant) => [variant.id, variant]));

    // Calculate totals
    let subtotal = 0;
    const orderItems: PreparedOrderItem[] = [];

    for (const item of normalizedItems) {
      const productId = item.product_id as string;
      const product = productsById.get(productId);
      if (!product || !product.is_active) {
        return NextResponse.json({ success: false, error: "A cart item is no longer available" }, { status: 400 });
      }

      const variant = item.variant_id ? variantsById.get(item.variant_id) : null;
      if (item.variant_id && (!variant || variant.product_id !== productId)) {
        return NextResponse.json({ success: false, error: "A selected product variant is invalid" }, { status: 400 });
      }

      const stock = variant?.stock ?? product.stock;
      if (stock < item.quantity) {
        return NextResponse.json({ success: false, error: "A cart item does not have enough stock" }, { status: 400 });
      }

      const price = Number(variant?.price ?? product.sale_price ?? product.price);
      subtotal += price * item.quantity;
      orderItems.push({
        product_id: productId,
        variant_id: item.variant_id,
        quantity: item.quantity,
        size: variant?.size ?? null,
        color: variant?.color ?? null,
        price,
      });
    }

    const delivery_fee = subtotal >= 100000 ? 0 : 3000;
    const total = subtotal + delivery_fee;
    const order_number = `WSC-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number,
        user_id: user.id,
        full_name,
        email,
        phone,
        address,
        township,
        city,
        state,
        zip: zip || null,
        notes: notes || null,
        subtotal,
        delivery_fee,
        total,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET() {
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
