export interface ProductImage {
  id: string;
  object_key: string;
  image_url?: string;
  url: string;
  is_thumbnail?: boolean;
  sort_order?: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price?: number;
  category_id: string;
  category?: string;
  categories?: { id: string; name: string; slug?: string };
  collections?: { id: string; name: string; slug?: string };
  drops?: { id: string; name: string; slug?: string; release_date?: string; status?: string };
  is_active: boolean;
  is_new: boolean;
  is_new_drop?: boolean;
  is_archive_sale: boolean;
  new_drop_start_date?: string;
  new_drop_end_date?: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  product_images: ProductImage[];
}

export interface ArchiveSaleProduct extends Product {
  sale_price: number;
  discount?: number;
}

export interface Drop {
  id: string;
  collection_id?: string;
  name: string;
  slug: string;
  description?: string;
  release_date?: string;
  status: "draft" | "scheduled" | "active" | "archived";
  banner_image_url?: string;
  banner_object_key?: string;
  products?: Product[];
  created_at: string;
  updated_at: string;
}
