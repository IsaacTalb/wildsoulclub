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
