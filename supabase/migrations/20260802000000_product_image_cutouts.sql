ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS transparent_url TEXT,
  ADD COLUMN IF NOT EXISTS transparent_object_key TEXT;

COMMENT ON COLUMN product_images.transparent_url IS
  'Public URL of an administrator-supplied transparent PNG or WebP cutout.';
