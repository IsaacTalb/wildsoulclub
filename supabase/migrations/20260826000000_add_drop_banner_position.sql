ALTER TABLE public.drops
  ADD COLUMN IF NOT EXISTS banner_position_x NUMERIC(5, 2) NOT NULL DEFAULT 50
    CHECK (banner_position_x BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS banner_position_y NUMERIC(5, 2) NOT NULL DEFAULT 50
    CHECK (banner_position_y BETWEEN 0 AND 100);
