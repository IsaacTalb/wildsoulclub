ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS fulfillment_method TEXT NOT NULL DEFAULT 'delivery';

UPDATE orders
SET payment_reference = upper(substr(replace(id::TEXT, '-', ''), 1, 6))
WHERE payment_reference IS NULL;

ALTER TABLE orders
  ALTER COLUMN payment_reference SET NOT NULL,
  ALTER COLUMN payment_reference SET DEFAULT upper(substr(replace(uuid_generate_v4()::TEXT, '-', ''), 1, 6));

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_reference
  ON orders(payment_reference);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_fulfillment_method_check'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_fulfillment_method_check
      CHECK (fulfillment_method IN ('delivery', 'pickup'));
  END IF;
END $$;
