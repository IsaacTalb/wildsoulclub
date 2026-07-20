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

export async function GET(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId);
    let query = supabaseAdmin
      .from("products")
      .select("*, product_images(*), product_variants(*), categories(id, name, slug), collections(id, name, slug)")
      .eq("is_active", true);
    query = isUuid ? query.eq("id", productId) : query.eq("slug", productId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: normalizeProduct(data as ProductRow) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch product" }, { status: 500 });
  }
}
