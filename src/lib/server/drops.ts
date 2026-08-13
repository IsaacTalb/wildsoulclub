import "server-only";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { publicImageUrl } from "@/lib/server/public-image-url";
import type { Drop } from "@/types/product";

const PRODUCT_SELECT =
  "id, name, slug, description, price, sale_price, thumbnail_url, thumbnail_key, is_active, is_new_drop, product_images(id, image_url, object_key, transparent_url, transparent_object_key, is_thumbnail, sort_order), categories(id, name, slug)";
const DROP_SELECT = `id, collection_id, name, slug, description, season, release_date, status, banner_image_url, banner_object_key, created_at, updated_at, collections(id, name, slug), products(${PRODUCT_SELECT})`;
const PUBLIC_DROP_STATUSES = ["scheduled", "active"];

type ImageRow = {
  image_url?: string | null;
  object_key?: string | null;
  transparent_url?: string | null;
  transparent_object_key?: string | null;
  is_thumbnail?: boolean | null;
  sort_order?: number | null;
};
type ProductRow = {
  thumbnail_url?: string | null;
  thumbnail_key?: string | null;
  product_images?: ImageRow[] | null;
  is_active?: boolean | null;
  [key: string]: unknown;
};
type DropRow = {
  banner_image_url?: string | null;
  banner_object_key?: string | null;
  products?: ProductRow[] | null;
  [key: string]: unknown;
};

function normalizeProduct(product: ProductRow) {
  const images = [...(product.product_images ?? [])]
    .sort(
      (a, b) =>
        Number(b.is_thumbnail) - Number(a.is_thumbnail) ||
        (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )
    .map((image) => ({
      ...image,
      url: publicImageUrl(image.image_url, image.object_key),
      transparent_url: publicImageUrl(image.transparent_url, image.transparent_object_key),
    }));

  return {
    ...product,
    thumbnail_url:
      publicImageUrl(product.thumbnail_url, product.thumbnail_key) ?? images[0]?.url ?? null,
    product_images: images,
  };
}

function normalizeDrop(drop: DropRow): Drop {
  return {
    ...drop,
    banner_image_url: publicImageUrl(drop.banner_image_url, drop.banner_object_key),
    products: (drop.products ?? [])
      .filter((product) => product.is_active !== false)
      .map(normalizeProduct),
  } as unknown as Drop;
}

export async function getPublicDrops(): Promise<Drop[]> {
  const { data, error } = await supabaseAdmin
    .from("drops")
    .select(DROP_SELECT)
    .in("status", PUBLIC_DROP_STATUSES)
    .order("release_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((drop) => normalizeDrop(drop as DropRow));
}

export async function getPublicDropBySlug(slug: string): Promise<Drop | null> {
  const { data, error } = await supabaseAdmin
    .from("drops")
    .select(DROP_SELECT)
    .eq("slug", slug)
    .in("status", PUBLIC_DROP_STATUSES)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeDrop(data as DropRow) : null;
}
