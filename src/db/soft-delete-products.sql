-- Add product soft-delete support to an existing database.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_active_visible
  ON products(created_at DESC)
  WHERE is_active = true AND deleted_at IS NULL;

DROP INDEX IF EXISTS idx_products_featured;
CREATE INDEX idx_products_featured
  ON products(is_featured)
  WHERE is_featured = true AND deleted_at IS NULL;
