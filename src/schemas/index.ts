import { z } from "zod";

// ==========================================
// Auth Schemas
// ==========================================

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

// ==========================================
// Product Schemas
// ==========================================

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().positive("Price must be positive"),
  sale_price: z.coerce.number().positive().optional().nullable(),
  discount_percent: z.coerce.number().min(0).max(100).optional().nullable(),
  category_id: z.string().min(1, "Category is required"),
  collection_id: z.string().optional().nullable(),
  stock: z.coerce.number().int().min(0, "Stock must be 0 or more"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ==========================================
// Category Schemas
// ==========================================

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// ==========================================
// Collection Schemas
// ==========================================

export const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export type CollectionFormData = z.infer<typeof collectionSchema>;

// ==========================================
// Checkout Schemas
// ==========================================

export const checkoutSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(7, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  township: z.string().min(1, "Township is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().optional(),
  notes: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// ==========================================
// Payment Schemas
// ==========================================

export const paymentSchema = z.object({
  order_id: z.string().min(1),
  method: z.enum(["kpay", "wave", "ayapay", "cbpay"]),
  transaction_id: z.string().optional(),
});

export const paymentUploadSchema = z.object({
  order_id: z.string().min(1),
  method: z.enum(["kpay", "wave", "ayapay", "cbpay"]),
  transaction_id: z.string().optional(),
  payment_image: z.any(),
});

// ==========================================
// Hero Slider Schemas
// ==========================================

export const heroSliderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  button_text: z.string().optional(),
  button_url: z.string().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export type HeroSliderFormData = z.infer<typeof heroSliderSchema>;

// ==========================================
// Banner Schemas
// ==========================================

export const bannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  link_url: z.string().optional(),
  is_active: z.boolean().default(true),
  position: z.enum(["top", "middle", "bottom"]),
});

export type BannerFormData = z.infer<typeof bannerSchema>;

// ==========================================
// Delivery Region Schema
// ==========================================

export const deliveryRegionSchema = z.object({
  township: z.string().min(1, "Township is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  delivery_fee: z.coerce.number().positive("Delivery fee must be positive"),
  min_order_free_delivery: z.coerce.number().positive().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type DeliveryRegionFormData = z.infer<typeof deliveryRegionSchema>;

// ==========================================
// Coupon Schema
// ==========================================

export const couponSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters"),
  description: z.string().optional(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().positive("Discount value must be positive"),
  min_order_amount: z.coerce.number().positive().optional().nullable(),
  max_discount: z.coerce.number().positive().optional().nullable(),
  usage_limit: z.coerce.number().int().positive().optional().nullable(),
  is_active: z.boolean().default(true),
  expires_at: z.string().optional().nullable(),
});

export type CouponFormData = z.infer<typeof couponSchema>;

// ==========================================
// Page Schema
// ==========================================

export const pageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  is_published: z.boolean().default(false),
});

export type PageFormData = z.infer<typeof pageSchema>;

// ==========================================
// Profile Schema
// ==========================================

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// ==========================================
// Site Settings Schema
// ==========================================

export const siteSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  group: z.string().min(1),
});

export type SiteSettingFormData = z.infer<typeof siteSettingSchema>;

// ==========================================
// Admin Schema
// ==========================================

export const adminSchema = z.object({
  email: z.string().email(),
  role: z.enum(["super_admin", "admin", "manager"]),
  permissions: z.array(z.string()).default([]),
});

export type AdminFormData = z.infer<typeof adminSchema>;
