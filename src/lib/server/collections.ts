import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { publicImageUrl } from "@/lib/server/public-image-url";
import {
  normalizePublicProduct,
  PUBLIC_PRODUCT_SELECT,
  type PublicProductRow,
} from "@/lib/server/public-product";

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
