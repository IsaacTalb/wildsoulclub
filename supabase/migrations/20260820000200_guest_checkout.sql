-- Permit guest checkout while retaining server-authoritative order creation.
-- The durable throttle is callable only by the service-role API.

-- Durable abuse throttling for the public, service-role-backed checkout API.
CREATE TABLE order_request_rate_limits (
  request_key TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0)
);

CREATE OR REPLACE FUNCTION check_order_request_rate_limit(p_request_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE v_count INTEGER;
BEGIN
  IF p_request_key IS NULL OR length(p_request_key) <> 64 THEN
    RETURN false;
  END IF;
  INSERT INTO order_request_rate_limits (request_key, window_started_at, request_count)
  VALUES (p_request_key, now(), 1)
  ON CONFLICT (request_key) DO UPDATE SET
    window_started_at = CASE
      WHEN order_request_rate_limits.window_started_at <= now() - interval '10 minutes' THEN now()
      ELSE order_request_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN order_request_rate_limits.window_started_at <= now() - interval '10 minutes' THEN 1
      ELSE order_request_rate_limits.request_count + 1
    END
  RETURNING request_count INTO v_count;
  RETURN v_count <= 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON TABLE order_request_rate_limits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION check_order_request_rate_limit(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION check_order_request_rate_limit(TEXT) TO service_role;

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
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
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
    'WSC-' || upper(substr(replace(extensions.uuid_generate_v4()::TEXT, '-', ''), 1, 16)),
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

REVOKE ALL ON FUNCTION create_order(UUID, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION create_order(UUID, JSONB, JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION create_order(UUID, JSONB, JSONB) TO service_role;

-- Finalize checkout-specific order fields in the same transaction that creates
-- the order and consumes inventory.
CREATE OR REPLACE FUNCTION create_checkout_order(
  p_user_id UUID,
  p_customer JSONB,
  p_items JSONB,
  p_fulfillment_method TEXT,
  p_payment_reference TEXT,
  p_coupon_code TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order JSONB;
  v_order_id UUID;
  v_saved_order orders%ROWTYPE;
  v_coupon coupons%ROWTYPE;
  v_discount NUMERIC(10,2) := 0;
  v_total NUMERIC(10,2);
  v_amount_prefix TEXT;
BEGIN
  IF p_fulfillment_method NOT IN ('delivery', 'pickup') THEN
    RAISE EXCEPTION 'Invalid fulfillment method';
  END IF;
  IF p_payment_reference IS NULL OR p_payment_reference !~ '^[1-9][0-9]{5}$' THEN
    RAISE EXCEPTION 'Invalid payment reference code';
  END IF;

  v_order := create_order(p_user_id, p_customer, p_items);
  v_order_id := (v_order->>'id')::UUID;

  IF NULLIF(upper(trim(p_coupon_code)), '') IS NOT NULL THEN
    SELECT * INTO v_coupon FROM coupons
    WHERE upper(code) = upper(trim(p_coupon_code))
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (usage_limit IS NULL OR used_count < usage_limit)
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Coupon is invalid, expired, or fully used'; END IF;
    IF v_coupon.min_order_amount IS NOT NULL AND (v_order->>'subtotal')::numeric < v_coupon.min_order_amount THEN
      RAISE EXCEPTION 'Coupon minimum order amount has not been reached';
    END IF;
    v_discount := CASE
      WHEN v_coupon.discount_type = 'percentage' THEN (v_order->>'subtotal')::numeric * v_coupon.discount_value / 100
      ELSE v_coupon.discount_value
    END;
    IF v_coupon.max_discount IS NOT NULL THEN v_discount := least(v_discount, v_coupon.max_discount); END IF;
    v_discount := greatest(0, least(v_discount, (v_order->>'subtotal')::numeric));
    UPDATE coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
  END IF;

  -- References encode whole thousands, truncating any sub-thousand remainder.
  -- This keeps the prefix free of decimal points (56,500 becomes `56K-`).
  v_total := (v_order->>'subtotal')::numeric - v_discount;
  v_amount_prefix := to_char(trunc(v_total / 1000), 'FM999,999,999,999,990');
  UPDATE orders
  SET payment_reference = v_amount_prefix || 'K-' || p_payment_reference,
      fulfillment_method = p_fulfillment_method,
      delivery_fee = 0,
      coupon_code = CASE WHEN v_coupon.id IS NULL THEN NULL ELSE upper(v_coupon.code) END,
      discount_amount = v_discount,
      total = v_total,
      updated_at = NOW()
  WHERE id = v_order_id
  RETURNING * INTO v_saved_order;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order could not be finalized'; END IF;
  RETURN to_jsonb(v_saved_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION create_checkout_order(UUID, JSONB, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION create_checkout_order(UUID, JSONB, JSONB, TEXT, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION create_checkout_order(UUID, JSONB, JSONB, TEXT, TEXT, TEXT) TO service_role;
