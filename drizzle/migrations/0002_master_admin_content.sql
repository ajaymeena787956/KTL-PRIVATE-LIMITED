ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS hero_title text,
  ADD COLUMN IF NOT EXISTS hero_subtitle text,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_message text,
  ADD COLUMN IF NOT EXISTS payment_instructions text,
  ADD COLUMN IF NOT EXISTS policy_privacy text,
  ADD COLUMN IF NOT EXISTS policy_terms text,
  ADD COLUMN IF NOT EXISTS policy_shipping text,
  ADD COLUMN IF NOT EXISTS policy_refund text;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS image_url text;