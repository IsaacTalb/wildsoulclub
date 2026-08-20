-- Guest checkout capabilities are high-entropy bearer secrets. Only their
-- SHA-256 hashes are persisted; signed-in orders do not need a capability.
ALTER TABLE orders
  ADD COLUMN guest_access_token_hash TEXT;

ALTER TABLE orders
  ADD CONSTRAINT orders_guest_access_token_hash_format
  CHECK (guest_access_token_hash IS NULL OR guest_access_token_hash ~ '^[0-9a-f]{64}$');

-- Enforce one payment proof per order even under concurrent requests.
CREATE UNIQUE INDEX payments_one_per_order ON payments(order_id);

-- Do not copy the capability hash into operational history or return it from
-- the admin status-update RPC.
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
  v_before := to_jsonb(v_order) - 'guest_access_token_hash';
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
  VALUES (p_actor_user_id, 'order', p_order_id, 'update', v_before, to_jsonb(v_order) - 'guest_access_token_hash');
  RETURN to_jsonb(v_order) - 'guest_access_token_hash';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
