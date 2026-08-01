-- Keep this migration in sync with src/db/best-seller-products.sql.
-- Supabase CLI records this version in supabase_migrations.schema_migrations.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS best_seller_rank INT NOT NULL DEFAULT 0;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_best_seller_rank_check,
  ADD CONSTRAINT products_best_seller_rank_check
    CHECK (best_seller_rank >= 0 AND (is_best_seller OR best_seller_rank = 0));

CREATE INDEX IF NOT EXISTS idx_products_best_sellers
  ON products(best_seller_rank, created_at DESC)
  WHERE is_best_seller = true AND is_active = true AND deleted_at IS NULL;
