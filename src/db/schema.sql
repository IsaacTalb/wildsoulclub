-- ==========================================
-- Wild Soul Club - Supabase Database Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- USERS
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);

-- ==========================================
-- ADMINS
-- ==========================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager')),
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admins_user_id ON admins(user_id);

-- ==========================================
-- CATEGORIES
-- ==========================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  object_key TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);

-- ==========================================
-- COLLECTIONS
-- ==========================================
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  object_key TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_collections_slug ON collections(slug);

-- ==========================================
-- PRODUCTS
-- ==========================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  discount_percent INT DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  stock INT DEFAULT 0,
  sku TEXT,
  barcode TEXT,
  sizes JSONB DEFAULT '[]',
  colors JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  thumbnail_key TEXT,
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_collection ON products(collection_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;

-- ==========================================
-- PRODUCT IMAGES
-- ==========================================
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  object_key TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  is_thumbnail BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ==========================================
-- PRODUCT VARIANTS
-- ==========================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  stock INT DEFAULT 0,
  price DECIMAL(10, 2),
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);

-- ==========================================
-- ORDERS
-- ==========================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  township TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT,
  notes TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected', 'expired')),
  courier TEXT,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ==========================================
-- ORDER ITEMS
-- ==========================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  size TEXT,
  color TEXT,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ==========================================
-- PAYMENTS
-- ==========================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('kpay', 'wave', 'ayapay', 'cbpay')),
  transaction_id TEXT,
  payment_image TEXT NOT NULL,
  payment_object_key TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ==========================================
-- DELIVERY ADDRESSES
-- ==========================================
CREATE TABLE delivery_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  township TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON delivery_addresses(user_id);

-- ==========================================
-- DELIVERY REGIONS
-- ==========================================
CREATE TABLE delivery_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  township TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  delivery_fee DECIMAL(10, 2) NOT NULL,
  min_order_free_delivery DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_regions_township ON delivery_regions(township);

-- ==========================================
-- COUPONS
-- ==========================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2),
  max_discount DECIMAL(10, 2),
  usage_limit INT,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);

-- ==========================================
-- HERO SLIDERS
-- ==========================================
CREATE TABLE hero_sliders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  button_text TEXT,
  button_url TEXT,
  image_url TEXT NOT NULL,
  object_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- BANNERS
-- ==========================================
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  object_key TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  position TEXT NOT NULL CHECK (position IN ('top', 'middle', 'bottom')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SITE SETTINGS
-- ==========================================
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  group_name TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PAGES
-- ==========================================
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pages_slug ON pages(slug);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order', 'payment', 'system', 'promotion')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = false;

-- ==========================================
-- AUTO-UPDATE FUNCTIONS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- SEED DATA
-- ==========================================
INSERT INTO site_settings (key, value, group_name) VALUES
  ('site_name', 'Wild Soul Club', 'general'),
  ('site_description', 'Myanmar streetwear brand', 'general'),
  ('delivery_notice', 'Delivery within 3-5 business days', 'delivery'),
  ('payment_notice', 'Upload payment screenshot after transfer', 'payment'),
  ('kpay_number', '09-123456789', 'payment'),
  ('wave_number', '09-987654321', 'payment'),
  ('ayapay_number', '09-456789123', 'payment'),
  ('cbpay_number', '09-789123456', 'payment'),
  ('contact_email', 'hello@wildsoulclub.com', 'contact'),
  ('contact_phone', '09-123456789', 'contact'),
  ('facebook_url', '#', 'social'),
  ('instagram_url', '#', 'social'),
  ('tiktok_url', '#', 'social'),
  ('telegram_url', '#', 'social');
