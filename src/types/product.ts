export interface ProductImage {
  id: string;
  object_key: string;
  url: string;
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
  is_active: boolean;
  is_new: boolean;
  is_archive_sale: boolean;
  new_drop_start_date?: string;
  created_at: string;
  updated_at: string;
  product_images: ProductImage[];
}

export interface ArchiveSaleProduct extends Product {
  sale_price: number;
  discount?: number;
}