-- Keep payment review and order payment status synchronized even when an admin
-- has already moved fulfillment beyond pending. Approval preserves progressed
-- fulfillment; rejection is blocked once an order has been dispatched.
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

  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Payment not found', NULL::JSONB;
    RETURN;
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = v_payment.order_id FOR UPDATE;
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

  IF v_order.status = 'cancelled' THEN
    RETURN QUERY SELECT false, 'A cancelled order cannot accept a payment review', NULL::JSONB;
    RETURN;
  END IF;

  IF p_status IN ('rejected', 'expired') AND v_order.status IN ('shipped', 'delivered') THEN
    RETURN QUERY SELECT false, 'A dispatched order cannot have its payment rejected or expired', NULL::JSONB;
    RETURN;
  END IF;

  v_order_status := CASE
    WHEN p_status = 'approved' AND v_order.status = 'pending' THEN 'paid'
    WHEN p_status = 'approved' THEN v_order.status
    ELSE 'cancelled'
  END;

  IF v_order_status = 'cancelled' THEN
    PERFORM restock_order_inventory(v_order.id, p_reviewed_by);
  END IF;

  UPDATE payments
  SET status = p_status, admin_notes = p_admin_notes, reviewed_by = p_reviewed_by, updated_at = NOW()
  WHERE id = p_payment_id
  RETURNING * INTO v_payment;

  UPDATE orders
  SET payment_status = p_status, status = v_order_status, updated_at = NOW()
  WHERE id = v_payment.order_id;

  RETURN QUERY SELECT true, NULL::TEXT, to_jsonb(v_payment);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

REVOKE ALL ON FUNCTION review_payment(UUID, TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION review_payment(UUID, TEXT, TEXT, UUID) TO service_role;
