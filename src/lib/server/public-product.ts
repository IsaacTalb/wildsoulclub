import "server-only";

import { publicImageUrl } from "@/lib/server/public-image-url";

export type PublicProductImageRow = {
  id?: string | null;
  image_url?: string | null;
  object_key?: string | null;
  transparent_url?: string | null;
  transparent_object_key?: string | null;
  is_thumbnail?: boolean | null;
  sort_order?: number | null;
};

export type PublicProductVariantRow = {
  id?: string | null;
  size?: string | null;
  color?: string | null;
  stock?: number | null;
  price?: number | null;
  sale_price?: number | null;
  is_active?: boolean | null;
};

export type PublicProductRow = {
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
  is_best_seller?: boolean | null;
  best_seller_rank?: number | null;
  is_new_drop?: boolean | null;
  is_archive_sale?: boolean | null;
  new_drop_start_date?: string | null;
  new_drop_end_date?: string | null;
  categories?: { id?: string | null; name?: string | null; slug?: string | null } | null;
  collections?: { id?: string | null; name?: string | null; slug?: string | null } | null;
  product_images?: PublicProductImageRow[] | null;
  product_variants?: PublicProductVariantRow[] | null;
};

export const PUBLIC_PRODUCT_SELECT = `
  id, name, slug, description, price, sale_price, discount_percent,
  category_id, collection_id, stock, sizes, colors, thumbnail_url,
  thumbnail_key, is_active, is_archived, is_featured, is_best_seller,
  best_seller_rank, is_new_drop,
  is_archive_sale, new_drop_start_date, new_drop_end_date,
  product_images(id, image_url, object_key, transparent_url, transparent_object_key, is_thumbnail, sort_order),
  product_variants(id, size, color, stock, price, sale_price, is_active),
  categories(id, name, slug), collections(id, name, slug)
`;


function stockQuantity(value?: number | null) {
  const quantity = Number(value ?? 0);
  return Number.isSafeInteger(quantity) && quantity >= 0 ? quantity : 0;
}

export function normalizePublicProduct(product: PublicProductRow) {
  const productImages = [...(product.product_images ?? [])]
    .sort(
      (a, b) =>
        Number(b.is_thumbnail) - Number(a.is_thumbnail) ||
        (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )
    .map((image) => ({
      id: image.id,
      url: publicImageUrl(image.image_url, image.object_key),
      transparent_url: publicImageUrl(image.transparent_url, image.transparent_object_key),
      is_thumbnail: image.is_thumbnail ?? false,
      sort_order: image.sort_order ?? 0,
    }))
    .filter((image) => image.url);

  const productVariants = (product.product_variants ?? [])
    .filter((variant) => variant.is_active ?? true)
    .map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      stock: stockQuantity(variant.stock),
      price: variant.price,
      sale_price: variant.sale_price,
      is_active: true as const,
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
    stock: stockQuantity(product.stock),
    sizes: product.sizes,
    colors: product.colors,
    thumbnail_url:
      publicImageUrl(product.thumbnail_url, product.thumbnail_key) ??
      productImages[0]?.url ??
      null,
    is_active: product.is_active,
    is_archived: product.is_archived,
    is_featured: product.is_featured,
    is_best_seller: product.is_best_seller ?? false,
    best_seller_rank: product.best_seller_rank ?? 0,
    is_new_drop: product.is_new_drop,
    is_archive_sale: product.is_archive_sale,
    new_drop_start_date: product.new_drop_start_date,
    new_drop_end_date: product.new_drop_end_date,
    categories: product.categories
      ? { id: product.categories.id, name: product.categories.name, slug: product.categories.slug }
      : null,
    collections: product.collections
      ? { id: product.collections.id, name: product.collections.name, slug: product.collections.slug }
      : null,
    product_images: productImages,
    product_variants: productVariants,
  };
}

export type PublicProductResponse = ReturnType<typeof normalizePublicProduct>;
