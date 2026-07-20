import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthUser } from "@/lib/auth";

const orderItemSchema = z.object({
  product_id: z.uuid(),
  variant_id: z.uuid().nullable().optional(),
  quantity: z.number().int().positive(),
  size: z.string().trim().optional().nullable(),
  color: z.string().trim().optional().nullable(),
});

const createOrderSchema = z.object({
  full_name: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  township: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  zip: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  items: z.array(orderItemSchema).min(1),
});

type ProductRow = {
  id: string;
  price: number | string;
  sale_price: number | string | null;
  stock: number | null;
  is_active: boolean | null;
};

type VariantRow = {
  id: string;
  product_id: string;
  price: number | string | null;
  stock: number | null;
  size: string | null;
  color: string | null;
};

function normalizeMoney(value: number | string | null | undefined) {
  if (value == null) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `WSC-${timestamp}-${random}`;
}

function validationError(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return validationError("Invalid JSON body");
    }

    const parsed = createOrderSchema.safeParse(json);
    if (!parsed.success) {
      return validationError("Invalid order request");
    }

    const orderInput = parsed.data;
    const productIds = [...new Set(orderInput.items.map((item) => item.product_id))];
    const variantIds = [...new Set(orderInput.items.map((item) => item.variant_id).filter((id): id is string => Boolean(id)))];

    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, price, sale_price, stock, is_active")
      .in("id", productIds);

    if (productsError) throw productsError;

    const productsById = new Map((products as ProductRow[] | null ?? []).map((product) => [product.id, product]));
    if (productsById.size !== productIds.length) {
      return validationError("One or more products are invalid");
    }

    let variantsById = new Map<string, VariantRow>();
    if (variantIds.length > 0) {
      const { data: variants, error: variantsError } = await supabaseAdmin
        .from("product_variants")
        .select("id, product_id, price, stock, size, color")
        .in("id", variantIds);

      if (variantsError) throw variantsError;
      variantsById = new Map((variants as VariantRow[] | null ?? []).map((variant) => [variant.id, variant]));
      if (variantsById.size !== variantIds.length) {
        return validationError("One or more product variants are invalid");
      }
    }

    let subtotal = 0;
    const orderItems = orderInput.items.map((item) => {
      const product = productsById.get(item.product_id)!;
      if (!product.is_active) {
        throw new Error("Inactive product");
      }

      const variant = item.variant_id ? variantsById.get(item.variant_id) : null;
      if (variant && variant.product_id !== item.product_id) {
        throw new Error("Variant does not belong to product");
      }

      const availableStock = variant ? variant.stock : product.stock;
      if (availableStock != null && availableStock < item.quantity) {
        throw new Error("Insufficient stock");
      }

      const price = normalizeMoney(variant?.price) ?? normalizeMoney(product.sale_price) ?? normalizeMoney(product.price);
      if (price == null) {
        throw new Error("Invalid product price");
      }

      subtotal += price * item.quantity;

      return {
        product_id: item.product_id,
        variant_id: item.variant_id ?? null,
        quantity: item.quantity,
        size: item.size ?? variant?.size ?? null,
        color: item.color ?? variant?.color ?? null,
        price,
      };
    });

    const delivery_fee = subtotal >= 100000 ? 0 : 3000;
    const total = subtotal + delivery_fee;
    let order;
    let lastOrderError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const order_number = generateOrderNumber();
      const { data, error } = await supabaseAdmin
        .from("orders")
        .insert({
          order_number,
          user_id: user.id,
          full_name: orderInput.full_name,
          email: orderInput.email,
          phone: orderInput.phone,
          address: orderInput.address,
          township: orderInput.township,
          city: orderInput.city,
          state: orderInput.state,
          zip: orderInput.zip || null,
          notes: orderInput.notes || null,
          subtotal,
          delivery_fee,
          total,
          status: "pending",
          payment_status: "pending",
        })
        .select()
        .single();

      if (!error) {
        order = data;
        break;
      }

      lastOrderError = error;
      if (error.code !== "23505") break;
    }

    if (!order) throw lastOrderError;

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw itemsError;
    }

    return NextResponse.json(
      { success: true, data: { ...order, id: order.id, order_number: order.order_number } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && ["Inactive product", "Variant does not belong to product", "Insufficient stock", "Invalid product price"].includes(error.message)) {
      return validationError(error.message);
    }

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
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
