import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ProductImageRow = { image_url?: string | null; object_key?: string | null; is_thumbnail?: boolean | null; sort_order?: number | null };
type ProductRow = { thumbnail_url?: string | null; thumbnail_key?: string | null; product_images?: ProductImageRow[] | null };
function publicImageUrl(imageUrl?: string | null, objectKey?: string | null) { if (imageUrl?.startsWith("http") || imageUrl?.startsWith("/")) return imageUrl; const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, ""); return base && objectKey ? `${base}/${objectKey}` : imageUrl || objectKey || null; }
function normalizeProduct(product: ProductRow) { const imgs = [...(product.product_images ?? [])].sort((a, b) => Number(b.is_thumbnail) - Number(a.is_thumbnail) || (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((image) => ({ ...image, url: publicImageUrl(image.image_url, image.object_key) })); return { ...product, thumbnail_url: publicImageUrl(product.thumbnail_url, product.thumbnail_key) ?? imgs[0]?.url ?? null, product_images: imgs }; }

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, product_images(*), product_variants(*), categories(id, name, slug)")
      .eq("is_archive_sale", true)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data: (data ?? []).map((product) => normalizeProduct(product as ProductRow)) });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch archive sales" }, { status: 500 });
  }
}
