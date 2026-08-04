-- ==========================================
-- Wild Soul Club - Supabase Database Schema
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- USERS
-- ==========================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);


-- Mirror new Supabase Auth users into the public users table.
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1), 'User'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

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

CREATE UNIQUE INDEX idx_admins_user_id ON admins(user_id);

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
-- DROPS
-- ==========================================
CREATE TABLE drops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  release_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'archived')),
  banner_image_url TEXT,
  banner_object_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drops_slug ON drops(slug);
CREATE INDEX idx_drops_status ON drops(status);
CREATE INDEX idx_drops_release_date ON drops(release_date DESC);

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
  drop_id UUID REFERENCES drops(id) ON DELETE SET NULL,
  stock INT DEFAULT 0,
  sku TEXT,
  barcode TEXT,
  sizes JSONB DEFAULT '[]',
  colors JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  thumbnail_key TEXT,
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN NOT NULL DEFAULT false,
  best_seller_rank INT NOT NULL DEFAULT 0 CHECK (best_seller_rank >= 0 AND (is_best_seller OR best_seller_rank = 0)),
  is_new_drop BOOLEAN DEFAULT false,
  is_archive_sale BOOLEAN DEFAULT false,
  new_drop_start_date TIMESTAMPTZ,
  new_drop_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_collection ON products(collection_id);
CREATE INDEX idx_products_drop ON products(drop_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_active_visible ON products(created_at DESC) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true AND deleted_at IS NULL;
CREATE INDEX idx_products_best_sellers ON products(best_seller_rank, created_at DESC) WHERE is_best_seller = true AND is_active = true AND deleted_at IS NULL;

-- ==========================================
-- PRODUCT IMAGES
-- ==========================================
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  object_key TEXT NOT NULL,
  transparent_url TEXT,
  transparent_object_key TEXT,
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
  sale_price DECIMAL(10, 2),
  sku TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE UNIQUE INDEX idx_variants_product_sku_unique ON product_variants(product_id, lower(sku)) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX idx_variants_product_options_unique ON product_variants(product_id, lower(size), lower(color)) WHERE sku IS NULL AND (size IS NOT NULL OR color IS NOT NULL);


-- ==========================================
-- OPERATIONAL HISTORY
-- ==========================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity_delta INT NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_transactions_product ON inventory_transactions(product_id, created_at DESC);
CREATE INDEX idx_inventory_transactions_variant ON inventory_transactions(variant_id, created_at DESC) WHERE variant_id IS NOT NULL;
CREATE INDEX idx_inventory_transactions_reference ON inventory_transactions(reference_type, reference_id);

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
  payment_reference TEXT UNIQUE NOT NULL DEFAULT upper(substr(replace(uuid_generate_v4()::TEXT, '-', ''), 1, 6)),
  fulfillment_method TEXT NOT NULL DEFAULT 'delivery' CHECK (fulfillment_method IN ('delivery', 'pickup')),
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

-- Variant stock is the source of truth for products that have variants. Keep the
-- product aggregate derived so it cannot be edited independently.
CREATE OR REPLACE FUNCTION sync_product_variant_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID := COALESCE(NEW.product_id, OLD.product_id);
BEGIN
  UPDATE products
  SET stock = COALESCE((
    SELECT SUM(stock) FROM product_variants
    WHERE product_id = v_product_id AND is_active = true
  ), 0), updated_at = NOW()
  WHERE id = v_product_id;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_product_stock_after_variant_change
  AFTER INSERT OR UPDATE OF stock, is_active OR DELETE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION sync_product_variant_stock();

CREATE OR REPLACE FUNCTION derive_product_stock_when_variants_exist()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM product_variants WHERE product_id = NEW.id) THEN
    NEW.stock := COALESCE((
      SELECT SUM(stock) FROM product_variants
      WHERE product_id = NEW.id AND is_active = true
    ), 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER derive_product_stock_before_product_write
  BEFORE UPDATE OF stock ON products
  FOR EACH ROW EXECUTE FUNCTION derive_product_stock_when_variants_exist();

-- Create the complete order and consume inventory in the RPC's single database
-- transaction. Any raised exception rolls back the order, its items, stock, and
-- inventory ledger entries together.
CREATE OR REPLACE FUNCTION create_order(
  p_user_id UUID,
  p_customer JSONB,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_product products%ROWTYPE;
  v_variant product_variants%ROWTYPE;
  v_item RECORD;
  v_price NUMERIC(10, 2);
  v_subtotal NUMERIC(10, 2) := 0;
  v_delivery_fee NUMERIC(10, 2);
  v_has_variants BOOLEAN;
BEGIN
  IF p_user_id IS NULL OR p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Invalid order items';
  END IF;

  IF COALESCE(NULLIF(trim(p_customer->>'full_name'), ''), NULL) IS NULL
     OR COALESCE(NULLIF(trim(p_customer->>'email'), ''), NULL) IS NULL
     OR COALESCE(NULLIF(trim(p_customer->>'phone'), ''), NULL) IS NULL
     OR COALESCE(NULLIF(trim(p_customer->>'address'), ''), NULL) IS NULL
     OR COALESCE(NULLIF(trim(p_customer->>'township'), ''), NULL) IS NULL
     OR COALESCE(NULLIF(trim(p_customer->>'city'), ''), NULL) IS NULL
     OR COALESCE(NULLIF(trim(p_customer->>'state'), ''), NULL) IS NULL THEN
    RAISE EXCEPTION 'Invalid customer details';
  END IF;

  -- Aggregate duplicate selections before validating/locking so repeated lines
  -- cannot each pass against the same pre-decrement stock value.
  FOR v_item IN
    SELECT
      (entry->>'product_id')::UUID AS product_id,
      NULLIF(entry->>'variant_id', '')::UUID AS variant_id,
      SUM((entry->>'quantity')::INT)::INT AS quantity
    FROM jsonb_array_elements(p_items) entry
    GROUP BY (entry->>'product_id')::UUID, NULLIF(entry->>'variant_id', '')::UUID
    ORDER BY (entry->>'product_id')::UUID, NULLIF(entry->>'variant_id', '')::UUID NULLS FIRST
  LOOP
    IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN RAISE EXCEPTION 'Invalid item quantity'; END IF;

    SELECT * INTO v_product FROM products
    WHERE id = v_item.product_id AND deleted_at IS NULL
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Invalid product'; END IF;
    IF NOT COALESCE(v_product.is_active, false) THEN RAISE EXCEPTION 'Inactive product'; END IF;

    SELECT EXISTS (SELECT 1 FROM product_variants WHERE product_id = v_product.id)
      INTO v_has_variants;

    IF v_has_variants THEN
      IF v_item.variant_id IS NULL THEN RAISE EXCEPTION 'A variant is required for this product'; END IF;
      SELECT * INTO v_variant FROM product_variants
      WHERE id = v_item.variant_id AND product_id = v_product.id
      FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Invalid product variant'; END IF;
      IF NOT COALESCE(v_variant.is_active, false) THEN RAISE EXCEPTION 'Inactive product variant'; END IF;
      IF COALESCE(v_variant.stock, 0) < v_item.quantity THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
      v_price := COALESCE(v_variant.sale_price, v_variant.price, v_product.sale_price, v_product.price);
    ELSE
      IF v_item.variant_id IS NOT NULL THEN RAISE EXCEPTION 'Variant does not belong to product'; END IF;
      IF COALESCE(v_product.stock, 0) < v_item.quantity THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
      v_price := COALESCE(v_product.sale_price, v_product.price);
    END IF;
    IF v_price IS NULL OR v_price < 0 THEN RAISE EXCEPTION 'Invalid product price'; END IF;
    v_subtotal := v_subtotal + (v_price * v_item.quantity);
  END LOOP;

  v_delivery_fee := CASE WHEN v_subtotal >= 100000 THEN 0 ELSE 3000 END;
  INSERT INTO orders (
    order_number, user_id, full_name, email, phone, address, township, city,
    state, zip, notes, subtotal, delivery_fee, total, status, payment_status
  ) VALUES (
    'WSC-' || upper(substr(replace(uuid_generate_v4()::TEXT, '-', ''), 1, 16)),
    p_user_id, trim(p_customer->>'full_name'), trim(p_customer->>'email'),
    trim(p_customer->>'phone'), trim(p_customer->>'address'), trim(p_customer->>'township'),
    trim(p_customer->>'city'), trim(p_customer->>'state'), NULLIF(trim(p_customer->>'zip'), ''),
    NULLIF(trim(p_customer->>'notes'), ''), v_subtotal, v_delivery_fee,
    v_subtotal + v_delivery_fee, 'pending', 'pending'
  ) RETURNING * INTO v_order;

  FOR v_item IN
    SELECT
      (entry->>'product_id')::UUID AS product_id,
      NULLIF(entry->>'variant_id', '')::UUID AS variant_id,
      SUM((entry->>'quantity')::INT)::INT AS quantity
    FROM jsonb_array_elements(p_items) entry
    GROUP BY (entry->>'product_id')::UUID, NULLIF(entry->>'variant_id', '')::UUID
    ORDER BY (entry->>'product_id')::UUID, NULLIF(entry->>'variant_id', '')::UUID NULLS FIRST
  LOOP
    SELECT * INTO STRICT v_product FROM products WHERE id = v_item.product_id;
    IF v_item.variant_id IS NOT NULL THEN
      SELECT * INTO STRICT v_variant FROM product_variants WHERE id = v_item.variant_id;
      v_price := COALESCE(v_variant.sale_price, v_variant.price, v_product.sale_price, v_product.price);
      UPDATE product_variants SET stock = stock - v_item.quantity
      WHERE id = v_item.variant_id AND product_id = v_item.product_id AND is_active = true AND stock >= v_item.quantity;
      IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
    ELSE
      v_price := COALESCE(v_product.sale_price, v_product.price);
      UPDATE products SET stock = stock - v_item.quantity, updated_at = NOW()
      WHERE id = v_item.product_id AND stock >= v_item.quantity
        AND NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = v_item.product_id);
      IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
    END IF;

    INSERT INTO order_items (order_id, product_id, variant_id, quantity, size, color, price)
    VALUES (v_order.id, v_item.product_id, v_item.variant_id, v_item.quantity,
      CASE WHEN v_item.variant_id IS NULL THEN NULL ELSE v_variant.size END,
      CASE WHEN v_item.variant_id IS NULL THEN NULL ELSE v_variant.color END, v_price);
    INSERT INTO inventory_transactions
      (product_id, variant_id, quantity_delta, reason, reference_type, reference_id, actor_user_id)
    VALUES (v_item.product_id, v_item.variant_id, -v_item.quantity, 'order_created', 'order', v_order.id, p_user_id);
  END LOOP;

  RETURN to_jsonb(v_order);
EXCEPTION
  WHEN invalid_text_representation OR numeric_value_out_of_range THEN
    RAISE EXCEPTION 'Invalid order items';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Called only while the order row is locked and before it is marked cancelled.
CREATE OR REPLACE FUNCTION restock_order_inventory(p_order_id UUID, p_actor_user_id UUID)
RETURNS VOID AS $$
DECLARE v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT product_id, variant_id, SUM(quantity)::INT quantity
    FROM order_items WHERE order_id = p_order_id
    GROUP BY product_id, variant_id ORDER BY product_id, variant_id NULLS FIRST
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE product_variants SET stock = stock + v_item.quantity
      WHERE id = v_item.variant_id AND product_id = v_item.product_id;
    ELSE
      UPDATE products SET stock = stock + v_item.quantity, updated_at = NOW()
      WHERE id = v_item.product_id
        AND NOT EXISTS (SELECT 1 FROM product_variants WHERE product_id = v_item.product_id);
    END IF;
    IF NOT FOUND THEN RAISE EXCEPTION 'Unable to restock order item'; END IF;
    INSERT INTO inventory_transactions
      (product_id, variant_id, quantity_delta, reason, reference_type, reference_id, actor_user_id)
    VALUES (v_item.product_id, v_item.variant_id, v_item.quantity, 'order_cancelled', 'order', p_order_id, p_actor_user_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id UUID, p_status TEXT, p_courier TEXT DEFAULT NULL,
  p_tracking_number TEXT DEFAULT NULL, p_actor_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE v_order orders%ROWTYPE; v_before JSONB;
BEGIN
  IF p_status NOT IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid fulfillment status';
  END IF;
  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  v_before := to_jsonb(v_order);
  IF v_order.status = 'cancelled' AND p_status <> 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled orders cannot be reopened because their inventory was restored';
  END IF;
  IF v_order.status = 'delivered' AND p_status = 'pending' THEN
    RAISE EXCEPTION 'Delivered orders cannot be moved back to pending';
  END IF;
  IF p_status = 'cancelled' AND v_order.status <> 'cancelled' THEN
    PERFORM restock_order_inventory(p_order_id, p_actor_user_id);
  END IF;
  UPDATE orders SET status = p_status,
    courier = CASE WHEN p_status = 'shipped' THEN NULLIF(trim(p_courier), '') ELSE courier END,
    tracking_number = CASE WHEN p_status = 'shipped' THEN NULLIF(trim(p_tracking_number), '') ELSE tracking_number END,
    updated_at = NOW() WHERE id = p_order_id RETURNING * INTO v_order;
  INSERT INTO audit_logs(actor_user_id, entity_type, entity_id, action, before, after)
  VALUES (p_actor_user_id, 'order', p_order_id, 'update', v_before, to_jsonb(v_order));
  RETURN to_jsonb(v_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

-- Atomically review a payment and keep its order payment fields in sync.
CREATE OR REPLACE FUNCTION review_payment(
  p_payment_id UUID,
  p_status TEXT,
  p_admin_notes TEXT DEFAULT NULL,
  p_reviewed_by UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, error TEXT, payment JSONB) AS $$
DECLARE
  v_payment payments%ROWTYPE;
  v_order orders%ROWTYPE;
  v_order_status TEXT;
BEGIN
  IF p_status NOT IN ('approved', 'rejected', 'expired') THEN
    RETURN QUERY SELECT false, 'Status must be approved, rejected, or expired', NULL::JSONB;
    RETURN;
  END IF;

  SELECT * INTO v_payment
  FROM payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Payment not found', NULL::JSONB;
    RETURN;
  END IF;

  SELECT * INTO v_order
  FROM orders
  WHERE id = v_payment.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Order not found for payment', NULL::JSONB;
    RETURN;
  END IF;

  IF v_payment.status <> 'pending' THEN
    RETURN QUERY SELECT false, format('Payment is already %s and cannot be reviewed again', v_payment.status), NULL::JSONB;
    RETURN;
  END IF;

  IF v_order.payment_status <> 'pending' THEN
    RETURN QUERY SELECT false, format('Order payment status is already %s', v_order.payment_status), NULL::JSONB;
    RETURN;
  END IF;

  IF v_order.status <> 'pending' THEN
    RETURN QUERY SELECT false, format('Order status is %s and cannot accept a payment review', v_order.status), NULL::JSONB;
    RETURN;
  END IF;

  v_order_status := CASE WHEN p_status = 'approved' THEN 'paid' ELSE 'cancelled' END;

  IF v_order_status = 'cancelled' THEN
    PERFORM restock_order_inventory(v_order.id, p_reviewed_by);
  END IF;

  UPDATE payments
  SET
    status = p_status,
    admin_notes = p_admin_notes,
    reviewed_by = p_reviewed_by,
    updated_at = NOW()
  WHERE id = p_payment_id
  RETURNING * INTO v_payment;

  UPDATE orders
  SET
    payment_status = p_status,
    status = v_order_status,
    updated_at = NOW()
  WHERE id = v_payment.order_id;

  RETURN QUERY SELECT true, NULL::TEXT, to_jsonb(v_payment);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  -- Link to a product, collection, or new drop
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  new_drop_id UUID,
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
  -- Link to a product, collection, or new drop
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  new_drop_id UUID,
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
  description TEXT,
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
-- ADMIN SETTINGS
-- ==========================================
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  group_name TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_settings_key ON admin_settings(key);

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

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- SEED DATA
-- ==========================================
INSERT INTO admin_settings (key, value, group_name, description) VALUES
  ('site_name', 'Wild Soul Club', 'general', 'Website title'),
  ('site_description', 'Myanmar streetwear brand', 'general', 'Site meta description'),
  ('delivery_notice', 'Delivery within 3-5 business days', 'delivery', 'Delivery info notice'),
  ('payment_notice', 'Upload payment screenshot after transfer', 'payment', 'Payment instructions'),
  ('kpay_number', '09-123456789', 'payment', 'K Pay account number'),
  ('wave_number', '09-987654321', 'payment', 'Wave Pay account number'),
  ('ayapay_number', '09-456789123', 'payment', 'Ayapay account number'),
  ('cbpay_number', '09-789123456', 'payment', 'CB Pay account number'),
  ('contact_email', 'hello@wildsoulclub.com', 'contact', 'Contact email'),
  ('contact_phone', '09-123456789', 'contact', 'Contact phone'),
  ('facebook_url', '#', 'social', 'Facebook URL'),
  ('instagram_url', '#', 'social', 'Instagram URL'),
  ('tiktok_url', '#', 'social', 'TikTok URL'),
  ('telegram_url', '#', 'social', 'Telegram URL'),
  ('new_drop_frequency', 'monthly', 'settings', 'New drop release frequency'),
  ('archive_sale_duration', '30', 'settings', 'Archive sale duration in days'),
  ('free_delivery_threshold', '100000', 'settings', 'Free delivery threshold (MMK)'),
  ('default_delivery_fee', '3000', 'settings', 'Default delivery fee (MMK)');


-- These RPCs are server-only entry points. The API authenticates callers and uses
-- the service role; clients must not be able to choose user/actor identifiers.
REVOKE ALL ON FUNCTION create_order(UUID, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION restock_order_inventory(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION update_order_status(UUID, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_order(UUID, JSONB, JSONB) TO service_role;

-- Finalize checkout-specific order fields in the same transaction that creates
-- the order and consumes inventory.
CREATE OR REPLACE FUNCTION create_checkout_order(
  p_user_id UUID,
  p_customer JSONB,
  p_items JSONB,
  p_fulfillment_method TEXT,
  p_payment_reference TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order JSONB;
  v_order_id UUID;
  v_saved_order orders%ROWTYPE;
BEGIN
  IF p_fulfillment_method NOT IN ('delivery', 'pickup') THEN
    RAISE EXCEPTION 'Invalid fulfillment method';
  END IF;
  IF p_payment_reference IS NULL OR p_payment_reference !~ '^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{6}$' THEN
    RAISE EXCEPTION 'Invalid payment reference';
  END IF;

  v_order := create_order(p_user_id, p_customer, p_items);
  v_order_id := (v_order->>'id')::UUID;
  UPDATE orders
  SET payment_reference = p_payment_reference,
      fulfillment_method = p_fulfillment_method,
      delivery_fee = CASE WHEN p_fulfillment_method = 'pickup' THEN 0 ELSE delivery_fee END,
      total = CASE WHEN p_fulfillment_method = 'pickup' THEN subtotal ELSE total END,
      updated_at = NOW()
  WHERE id = v_order_id
  RETURNING * INTO v_saved_order;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order could not be finalized'; END IF;
  RETURN to_jsonb(v_saved_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION create_checkout_order(UUID, JSONB, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_checkout_order(UUID, JSONB, JSONB, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION restock_order_inventory(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_order_status(UUID, TEXT, TEXT, TEXT, UUID) TO service_role;
