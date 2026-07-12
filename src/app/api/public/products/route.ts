import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ProductImageRow = { image_url?: string | null; object_key?: string | null };
type ProductRow = { product_images?: ProductImageRow[] | null };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const collection = searchParams.get("collection");
    const sort = searchParams.get("sort");
    const search = searchParams.get("search");

    let query = supabaseAdmin
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .eq("is_active", true);

    if (category) query = query.eq("category_id", category);
    if (collection) query = query.eq("collection_id", collection);
    if (search) query = query.ilike("name", `%${search}%`);

    if (sort === "price-asc" || sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price-desc" || sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
    const products = ((data ?? []) as ProductRow[]).map((product) => ({
      ...product,
      product_images: product.product_images?.map((image) => ({
        ...image,
        url: image.image_url ?? (publicBaseUrl && image.object_key ? `${publicBaseUrl}/${image.object_key}` : image.object_key),
      })),
    }));

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
