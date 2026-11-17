-- Add configurable product photo limit.
-- Existing products keep all current images and receive a default limit of 6.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS photo_limit integer NOT NULL DEFAULT 6;

ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_photo_limit_check;

ALTER TABLE public.products
ADD CONSTRAINT products_photo_limit_check
CHECK (photo_limit IN (1, 4, 5, 6));
