import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ProductImageRow = {
  id?: string | null;
  image_url?: string | null;
  object_key?: string | null;
  is_thumbnail?: boolean | null;
  sort_order?: number | null;
};

type ProductVariantRow = {
  id?: string | null;
  size?: string | null;
  color?: string | null;
  stock?: number | null;
  price?: number | null;
  sale_price?: number | null;
  is_active?: boolean | null;
};

type ProductRow = {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  price?: number | null;
  sale_price?: number | null;
  discount_percent?: number | null;
  category_id?: string | null;
  collection_id?: string | null;
  stock?: number | null;
  sizes?: unknown;
  colors?: unknown;
  thumbnail_url?: string | null;
  thumbnail_key?: string | null;
  is_active?: boolean | null;
  is_archived?: boolean | null;
  is_featured?: boolean | null;
  is_new_drop?: boolean | null;
  is_archive_sale?: boolean | null;
  new_drop_start_date?: string | null;
  new_drop_end_date?: string | null;
  categories?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
  collections?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
  product_images?: ProductImageRow[] | null;
  product_variants?: ProductVariantRow[] | null;
};

const PUBLIC_PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  price,
  sale_price,
  discount_percent,
  category_id,
  collection_id,
  stock,
  sizes,
  colors,
  thumbnail_url,
  thumbnail_key,
  is_active,
  is_archived,
  is_featured,
  is_new_drop,
  is_archive_sale,
  new_drop_start_date,
  new_drop_end_date,
  product_images(id, image_url, object_key, is_thumbnail, sort_order),
  product_variants(id, size, color, stock, price, sale_price, is_active),
  categories(id, name, slug),
  collections(id, name, slug)
`;

function publicImageUrl(imageUrl?: string | null, objectKey?: string | null) {
  if (imageUrl?.startsWith("http") || imageUrl?.startsWith("/"))
    return imageUrl;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (publicBaseUrl && objectKey) return `${publicBaseUrl}/${objectKey}`;
  return null;
}

function normalizeProduct(product: ProductRow) {
  const sortedImages = [...(product.product_images ?? [])].sort(
    (a, b) =>
      Number(b.is_thumbnail) - Number(a.is_thumbnail) ||
      (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const productImages = sortedImages
    .map((image) => ({
      id: image.id,
      url: publicImageUrl(image.image_url, image.object_key),
      is_thumbnail: image.is_thumbnail ?? false,
      sort_order: image.sort_order ?? 0,
    }))
    .filter((image) => image.url);
  const variants = (product.product_variants ?? []).map((variant) => ({
    id: variant.id,
    size: variant.size,
    color: variant.color,
    stock: Number(variant.stock ?? 0) > 0 ? 1 : 0,
    price: variant.price,
    sale_price: variant.sale_price,
    is_active: variant.is_active ?? true,
  }));

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    sale_price: product.sale_price,
    discount_percent: product.discount_percent,
    category_id: product.category_id,
    collection_id: product.collection_id,
    stock: Number(product.stock ?? 0) > 0 ? 1 : 0,
    sizes: product.sizes,
    colors: product.colors,
    thumbnail_url:
      publicImageUrl(product.thumbnail_url, product.thumbnail_key) ??
      productImages[0]?.url ??
      null,
    is_active: product.is_active,
    is_archived: product.is_archived,
    is_featured: product.is_featured,
    is_new_drop: product.is_new_drop,
    is_archive_sale: product.is_archive_sale,
    new_drop_start_date: product.new_drop_start_date,
    new_drop_end_date: product.new_drop_end_date,
    categories: product.categories
      ? {
          id: product.categories.id,
          name: product.categories.name,
          slug: product.categories.slug,
        }
      : null,
    collections: product.collections
      ? {
          id: product.collections.id,
          name: product.collections.name,
          slug: product.collections.slug,
        }
      : null,
    product_images: productImages,
    product_variants: variants,
  };
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
      .select(PUBLIC_PRODUCT_SELECT)
      .eq("is_active", true)
      .is("deleted_at", null);

    if (category) query = query.eq("category_id", category);
    if (collection) query = query.eq("collection_id", collection);
    if (search) query = query.ilike("name", `%${search}%`);

    if (sort === "price-asc" || sort === "price_asc")
      query = query.order("price", { ascending: true });
    else if (sort === "price-desc" || sort === "price_desc")
      query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data ?? []).map((product) =>
        normalizeProduct(product as ProductRow),
      ),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}
