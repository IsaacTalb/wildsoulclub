
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


-- Replace payment review so rejection/expiry restores inventory in the same transaction.
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


-- These RPCs are server-only entry points. The API authenticates callers and uses
-- the service role; clients must not be able to choose user/actor identifiers.
REVOKE ALL ON FUNCTION create_order(UUID, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION restock_order_inventory(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION update_order_status(UUID, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_order(UUID, JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION restock_order_inventory(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION update_order_status(UUID, TEXT, TEXT, TEXT, UUID) TO service_role;
