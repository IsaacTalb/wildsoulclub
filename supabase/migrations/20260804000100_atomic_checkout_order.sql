-- Keep order creation, inventory consumption, fulfillment pricing, and payment
-- reference assignment in one transaction. Calling create_order from this RPC
-- remains atomic because nested PostgreSQL functions share the caller's transaction.
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

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order could not be finalized';
  END IF;

  RETURN to_jsonb(v_saved_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION create_checkout_order(UUID, JSONB, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_checkout_order(UUID, JSONB, JSONB, TEXT, TEXT) TO service_role;
