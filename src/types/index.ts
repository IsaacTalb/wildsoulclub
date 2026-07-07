// ==========================================
// Database Types
// ==========================================

export interface User {
  id: string;
  clerk_id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  user_id: string;
  role: "super_admin" | "admin" | "manager";
  permissions: string[];
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price?: number;
  discount_percent?: number;
  category_id: string;
  category?: Category;
  collection_id?: string;
  collection?: Collection;
  stock: number;
  sku: string;
  barcode?: string;
  sizes: string[];
  colors: string[];
  variants?: ProductVariant[];
  images?: ProductImage[];
  thumbnail_url: string;
  is_active: boolean;
  is_archived: boolean;
  is_featured: boolean;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  object_key: string;
  file_size: number;
  mime_type: string;
  is_thumbnail: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock: number;
  price?: number;
  sku: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  product?: Product;
  variant_id?: string;
  variant?: ProductVariant;
  quantity: number;
  size: string;
  color: string;
  price: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  user?: User;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  township: string;
  city: string;
  state: string;
  zip?: string;
  notes?: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment?: Payment;
  items?: OrderItem[];
  courier?: string;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  variant_id?: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  order?: Order;
  method: PaymentMethod;
  transaction_id?: string;
  payment_image: string;
  payment_object_key: string;
  amount: number;
  status: PaymentStatus;
  admin_notes?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  township: string;
  city: string;
  state: string;
  zip?: string;
  is_default: boolean;
  created_at: string;
}

export interface DeliveryRegion {
  id: string;
  township: string;
  city: string;
  state: string;
  delivery_fee: number;
  min_order_free_delivery?: number;
  is_active: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount?: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface HeroSlider {
  id: string;
  title: string;
  subtitle?: string;
  button_text?: string;
  button_url?: string;
  image_url: string;
  object_key: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  object_key: string;
  link_url?: string;
  is_active: boolean;
  position: "top" | "middle" | "bottom";
  created_at: string;
}

export interface SiteSettings {
  id: string;
  key: string;
  value: string;
  group: string;
  updated_at: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "order" | "payment" | "system" | "promotion";
  is_read: boolean;
  created_at: string;
}

// ==========================================
// Enum Types
// ==========================================

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "approved" | "rejected" | "expired";

export type PaymentMethod = "kpay" | "wave" | "ayapay" | "cbpay";

// ==========================================
// API Response Types
// ==========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==========================================
// Dashboard Types
// ==========================================

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingPayments: number;
  todaySales: number;
  monthlySales: { month: string; revenue: number }[];
  topProducts: { name: string; sales: number }[];
  topCustomers: { name: string; orders: number; total: number }[];
}
