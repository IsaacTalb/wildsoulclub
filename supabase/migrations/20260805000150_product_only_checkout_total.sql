-- Checkout charges for products only. Delivery charges, when applicable, are
-- collected separately by the delivery person when the order arrives.
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

  IF p_payment_reference IS NULL
     OR length(p_payment_reference) <> 6
     OR p_payment_reference !~ '^[A-Z0-9]+$'
     OR p_payment_reference !~ '[A-Z]'
     OR p_payment_reference !~ '[0-9]' THEN
    RAISE EXCEPTION 'Invalid payment reference';
  END IF;

  v_order := create_order(p_user_id, p_customer, p_items);
  v_order_id := (v_order->>'id')::UUID;

  UPDATE orders
  SET payment_reference = p_payment_reference,
      fulfillment_method = p_fulfillment_method,
      delivery_fee = 0,
      total = subtotal,
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
