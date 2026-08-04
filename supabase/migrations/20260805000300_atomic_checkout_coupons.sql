ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0;

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
BEGIN
  IF p_fulfillment_method NOT IN ('delivery', 'pickup') THEN RAISE EXCEPTION 'Invalid fulfillment method'; END IF;
  IF p_payment_reference IS NULL OR length(p_payment_reference) <> 6
     OR p_payment_reference !~ '^[A-Z0-9]+$' OR p_payment_reference !~ '[A-Z]' OR p_payment_reference !~ '[0-9]' THEN
    RAISE EXCEPTION 'Invalid payment reference';
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

  UPDATE orders SET
    payment_reference = p_payment_reference,
    fulfillment_method = p_fulfillment_method,
    delivery_fee = 0,
    coupon_code = CASE WHEN v_coupon.id IS NULL THEN NULL ELSE upper(v_coupon.code) END,
    discount_amount = v_discount,
    total = subtotal - v_discount,
    updated_at = now()
  WHERE id = v_order_id
  RETURNING * INTO v_saved_order;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order could not be finalized'; END IF;
  RETURN to_jsonb(v_saved_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION create_checkout_order(UUID, JSONB, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_checkout_order(UUID, JSONB, JSONB, TEXT, TEXT, TEXT) TO service_role;
