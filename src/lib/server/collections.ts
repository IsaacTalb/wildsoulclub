import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  normalizePublicProduct,
  PUBLIC_PRODUCT_SELECT,
  type PublicProductRow,
} from "@/lib/server/public-product";

function publicImageUrl(imageUrl?: string | null, objectKey?: string | null) {
  if (imageUrl?.startsWith("http") || imageUrl?.startsWith("/")) return imageUrl;
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base && objectKey ? `${base}/${objectKey}` : imageUrl || objectKey || null;
}

export async function getPublicCollectionBySlug(slug: string) {
  const { data: collection, error: collectionError } = await supabaseAdmin
    .from("collections")
    .select("id, name, slug, description, image_url, object_key, start_date, end_date")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (collectionError) throw collectionError;
  if (!collection) return null;

  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select(PUBLIC_PRODUCT_SELECT)
    .eq("collection_id", collection.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (productsError) throw productsError;

  return {
    ...collection,
    image_url: publicImageUrl(collection.image_url, collection.object_key),
    products: (products ?? []).map((product) =>
      normalizePublicProduct(product as PublicProductRow),
    ),
  };
}
