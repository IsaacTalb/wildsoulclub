import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const PRODUCT_SELECT = "id, name, slug, description, price, sale_price, thumbnail_url, thumbnail_key, is_active, is_new_drop, product_images(id, image_url, object_key, is_thumbnail, sort_order), categories(id, name, slug)";
const DROP_SELECT = `id, collection_id, name, slug, description, release_date, status, banner_image_url, banner_object_key, created_at, updated_at, collections(id, name, slug), products(${PRODUCT_SELECT})`;

type ImageRow = { image_url?: string | null; object_key?: string | null; is_thumbnail?: boolean | null; sort_order?: number | null };
type ProductRow = { thumbnail_url?: string | null; thumbnail_key?: string | null; product_images?: ImageRow[] | null; [key: string]: unknown };
type DropRow = { banner_image_url?: string | null; banner_object_key?: string | null; products?: ProductRow[] | null; [key: string]: unknown };

export function publicImageUrl(imageUrl?: string | null, objectKey?: string | null) {
  if (imageUrl?.startsWith("http") || imageUrl?.startsWith("/")) return imageUrl;
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base && objectKey ? `${base}/${objectKey}` : imageUrl || objectKey || null;
}

export function normalizeProduct(product: ProductRow) {
  const images = [...(product.product_images ?? [])]
    .sort((a, b) => Number(b.is_thumbnail) - Number(a.is_thumbnail) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((image) => ({ ...image, url: publicImageUrl(image.image_url, image.object_key) }));
  return { ...product, thumbnail_url: publicImageUrl(product.thumbnail_url, product.thumbnail_key) ?? images[0]?.url ?? null, product_images: images };
}

export function normalizeDrop(drop: DropRow) {
  return {
    ...drop,
    banner_image_url: publicImageUrl(drop.banner_image_url, drop.banner_object_key),
    products: (drop.products ?? []).filter((product) => product.is_active !== false).map(normalizeProduct),
  };
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("drops")
      .select(DROP_SELECT)
      .in("status", ["scheduled", "active"])
      .order("release_date", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data: (data ?? []).map((drop) => normalizeDrop(drop as DropRow)) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch drops" }, { status: 500 });
  }
}
