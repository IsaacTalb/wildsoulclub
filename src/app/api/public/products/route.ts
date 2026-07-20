import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ProductImageRow = { image_url?: string | null; object_key?: string | null; is_thumbnail?: boolean | null; sort_order?: number | null };
type ProductRow = { thumbnail_url?: string | null; thumbnail_key?: string | null; product_images?: ProductImageRow[] | null };

function publicImageUrl(imageUrl?: string | null, objectKey?: string | null) {
  if (imageUrl?.startsWith("http") || imageUrl?.startsWith("/")) return imageUrl;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (publicBaseUrl && objectKey) return `${publicBaseUrl}/${objectKey}`;
  return imageUrl || objectKey || null;
}

function normalizeProduct(product: ProductRow) {
  const sortedImages = [...(product.product_images ?? [])].sort((a, b) => Number(b.is_thumbnail) - Number(a.is_thumbnail) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const productImages = sortedImages.map((image) => ({ ...image, url: publicImageUrl(image.image_url, image.object_key) }));
  return { ...product, thumbnail_url: publicImageUrl(product.thumbnail_url, product.thumbnail_key) ?? productImages[0]?.url ?? null, product_images: productImages };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const collection = searchParams.get("collection");
    const sort = searchParams.get("sort");
    const search = searchParams.get("search");

    let query = supabaseAdmin
      .from("products")
      .select("*, product_images(*), product_variants(*), categories(id, name, slug), collections(id, name, slug)")
      .eq("is_active", true);

    if (category) query = query.eq("category_id", category);
    if (collection) query = query.eq("collection_id", collection);
    if (search) query = query.ilike("name", `%${search}%`);

    if (sort === "price-asc" || sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price-desc" || sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: (data ?? []).map((product) => normalizeProduct(product as ProductRow)) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}
