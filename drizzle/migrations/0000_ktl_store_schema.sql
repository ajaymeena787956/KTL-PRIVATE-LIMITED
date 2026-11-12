-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- First confirmed account becomes the store administrator (only while no admin exists)
CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.email_confirmed_at IS NULL)
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_confirmed_assign_admin
  AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_first_admin();

-- ===== Helpers =====
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ===== Categories =====
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text CHECK (description IS NULL OR char_length(description) <= 500),
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update categories" ON public.categories
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete categories" ON public.categories
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== Products =====
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 160),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text CHECK (short_description IS NULL OR char_length(short_description) <= 300),
  description text CHECK (description IS NULL OR char_length(description) <= 8000),
  specifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  brand text, model text, quality text, warranty text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  mrp numeric(12,2) CHECK (mrp IS NULL OR mrp >= 0),
  booking_amount numeric(12,2) CHECK (booking_amount IS NULL OR booking_amount >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  images text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products (category_id);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.products
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products" ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== Store settings (single row) =====
CREATE TABLE public.store_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'KTL PRIVATE LIMITED',
  tagline text,
  announcement text,
  whatsapp_number text CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^[0-9]{10,15}$'),
  support_phone text,
  support_email text,
  address text,
  business_hours text,
  qr_image_url text,
  qr_promo_message text,
  upi_id text,
  default_booking_amount numeric(12,2) NOT NULL DEFAULT 500 CHECK (default_booking_amount >= 0),
  qr_payments_enabled boolean NOT NULL DEFAULT true,
  online_payments_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view store settings" ON public.store_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update store settings" ON public.store_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER store_settings_updated_at BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== Offers =====
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  description text CHECK (description IS NULL OR char_length(description) <= 400),
  badge text CHECK (badge IS NULL OR char_length(badge) <= 30),
  link_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active offers" ON public.offers
  FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert offers" ON public.offers
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update offers" ON public.offers
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete offers" ON public.offers
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== Orders / bookings =====
CREATE TYPE public.payment_method AS ENUM ('qr', 'razorpay');
CREATE TYPE public.payment_status AS ENUM ('pending', 'awaiting_verification', 'paid', 'failed', 'refunded');
CREATE TYPE public.order_status AS ENUM ('new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref text NOT NULL UNIQUE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_price numeric(12,2) NOT NULL,
  booking_amount numeric(12,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 50),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  customer_address text,
  notes text,
  payment_method public.payment_method NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  order_status public.order_status NOT NULL DEFAULT 'new',
  qr_transaction_ref text,
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text,
  paid_amount numeric(12,2),
  paid_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_created_idx ON public.orders (created_at DESC);
CREATE INDEX orders_phone_idx ON public.orders (customer_phone);
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete orders" ON public.orders
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Normalise Indian mobile numbers to 10 digits
CREATE OR REPLACE FUNCTION public.normalize_in_mobile(_phone text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE d text;
BEGIN
  d := regexp_replace(coalesce(_phone, ''), '[^0-9]', '', 'g');
  IF d ~ '^91[6-9][0-9]{9}$' THEN d := substr(d, 3); END IF;
  IF d ~ '^0[6-9][0-9]{9}$' THEN d := substr(d, 2); END IF;
  RETURN d;
END;
$$;

-- Public booking creation: amounts always come from the database, never from the browser
CREATE OR REPLACE FUNCTION public.create_booking(
  _product_id uuid,
  _customer_name text,
  _customer_phone text,
  _payment_method public.payment_method,
  _customer_email text DEFAULT NULL,
  _customer_address text DEFAULT NULL,
  _notes text DEFAULT NULL,
  _qr_transaction_ref text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.products%ROWTYPE;
  s public.store_settings%ROWTYPE;
  v_name text := btrim(coalesce(_customer_name, ''));
  v_phone text := public.normalize_in_mobile(_customer_phone);
  v_email text := nullif(btrim(coalesce(_customer_email, '')), '');
  v_addr text := nullif(btrim(coalesce(_customer_address, '')), '');
  v_notes text := nullif(btrim(coalesce(_notes, '')), '');
  v_utr text := nullif(upper(regexp_replace(coalesce(_qr_transaction_ref, ''), '\s', '', 'g')), '');
  v_amount numeric(12,2);
  v_ref text;
  v_recent integer;
BEGIN
  IF char_length(v_name) < 2 OR char_length(v_name) > 100 THEN
    RAISE EXCEPTION 'Please enter your full name (2-100 characters).';
  END IF;
  IF v_phone !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'Please enter a valid 10-digit Indian mobile number.';
  END IF;
  IF v_email IS NOT NULL AND (char_length(v_email) > 255 OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN
    RAISE EXCEPTION 'Please enter a valid email address.';
  END IF;
  IF v_addr IS NOT NULL AND char_length(v_addr) > 500 THEN
    RAISE EXCEPTION 'Address is too long (max 500 characters).';
  END IF;
  IF v_notes IS NOT NULL AND char_length(v_notes) > 1000 THEN
    RAISE EXCEPTION 'Notes are too long (max 1000 characters).';
  END IF;
  IF v_utr IS NOT NULL AND v_utr !~ '^[A-Z0-9]{6,30}$' THEN
    RAISE EXCEPTION 'Transaction / UTR reference should be 6-30 letters or digits.';
  END IF;

  SELECT * INTO p FROM public.products WHERE id = _product_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'This product is not available for booking.'; END IF;
  IF p.stock_quantity <= 0 THEN RAISE EXCEPTION 'This product is currently out of stock.'; END IF;

  SELECT * INTO s FROM public.store_settings WHERE id = 1;
  IF _payment_method = 'qr' AND NOT coalesce(s.qr_payments_enabled, true) THEN
    RAISE EXCEPTION 'QR payments are currently disabled.';
  END IF;
  IF _payment_method = 'razorpay' AND NOT coalesce(s.online_payments_enabled, true) THEN
    RAISE EXCEPTION 'Online payments are currently disabled.';
  END IF;

  SELECT count(*) INTO v_recent FROM public.orders
   WHERE customer_phone = v_phone AND created_at > now() - interval '1 hour';
  IF v_recent >= 5 THEN
    RAISE EXCEPTION 'Too many bookings from this number. Please try again later or contact support.';
  END IF;

  v_amount := least(coalesce(p.booking_amount, s.default_booking_amount, 0), p.price);
  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'Booking amount is not configured for this product. Please contact support.';
  END IF;

  v_ref := 'KTL-' || to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYMMDD') || '-' ||
           upper(substr(md5(gen_random_uuid()::text), 1, 6));

  INSERT INTO public.orders (order_ref, product_id, product_name, product_price, booking_amount,
    customer_name, customer_phone, customer_email, customer_address, notes,
    payment_method, payment_status, qr_transaction_ref)
  VALUES (v_ref, p.id, p.name, p.price, v_amount, v_name, v_phone, v_email, v_addr, v_notes,
    _payment_method,
    CASE WHEN _payment_method = 'qr' AND v_utr IS NOT NULL THEN 'awaiting_verification'::public.payment_status
         ELSE 'pending'::public.payment_status END,
    CASE WHEN _payment_method = 'qr' THEN v_utr ELSE NULL END);

  RETURN jsonb_build_object('order_ref', v_ref, 'booking_amount', v_amount,
    'product_name', p.name, 'product_price', p.price, 'payment_method', _payment_method);
END;
$$;
REVOKE ALL ON FUNCTION public.create_booking(uuid, text, text, public.payment_method, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, text, text, public.payment_method, text, text, text, text) TO anon, authenticated;

-- Customer booking lookup: requires both the reference and the mobile number, returns no personal data
CREATE OR REPLACE FUNCTION public.get_booking_status(_order_ref text, _phone text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'order_ref', o.order_ref, 'product_name', o.product_name, 'product_price', o.product_price,
    'booking_amount', o.booking_amount, 'payment_method', o.payment_method,
    'payment_status', o.payment_status, 'order_status', o.order_status, 'created_at', o.created_at)
  FROM public.orders o
  WHERE o.order_ref = upper(btrim(_order_ref))
    AND o.customer_phone = public.normalize_in_mobile(_phone)
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_booking_status(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_status(text, text) TO anon, authenticated;

-- ===== Customer enquiries =====
CREATE TYPE public.enquiry_status AS ENUM ('new', 'in_progress', 'resolved');
CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (phone ~ '^[0-9+ -]{10,16}$'),
  email text CHECK (email IS NULL OR char_length(email) <= 255),
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 5 AND 2000),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text CHECK (product_name IS NULL OR char_length(product_name) <= 160),
  order_ref text CHECK (order_ref IS NULL OR char_length(order_ref) <= 40),
  status public.enquiry_status NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.enquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit an enquiry" ON public.enquiries
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'new' AND admin_notes IS NULL);
CREATE POLICY "Admins view enquiries" ON public.enquiries
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update enquiries" ON public.enquiries
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete enquiries" ON public.enquiries
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER enquiries_updated_at BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== Seed data =====
INSERT INTO public.store_settings (id, store_name, tagline, announcement, business_hours, qr_promo_message, default_booking_amount)
VALUES (1, 'KTL PRIVATE LIMITED', 'Electronics, appliances, furniture & office equipment you can trust',
  'Book any product with a small booking amount — pay the balance on delivery.',
  'Mon–Sat, 10:00 AM – 7:00 PM',
  'Scan with any UPI app to pay the booking amount. Keep your transaction reference handy.',
  500);

INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Electronics', 'electronics', 'Mobiles, laptops, computers, TVs, cameras, speakers and accessories.', 1),
  ('Home Appliances', 'home-appliances', 'Refrigerators, washing machines, ACs, coolers and kitchen appliances.', 2),
  ('Furniture', 'furniture', 'Beds, sofas, tables, chairs, wardrobes and office furniture.', 3),
  ('Office Equipment', 'office-equipment', 'Printers, photocopiers, biometric machines, shredders and office devices.', 4);

INSERT INTO public.categories (name, slug, parent_id, sort_order)
SELECT v.name, v.slug, c.id, v.ord FROM (VALUES
  ('Mobiles', 'mobiles', 'electronics', 1), ('Laptops', 'laptops', 'electronics', 2),
  ('Computers', 'computers', 'electronics', 3), ('TVs', 'tvs', 'electronics', 4),
  ('Cameras', 'cameras', 'electronics', 5), ('Speakers', 'speakers', 'electronics', 6),
  ('Accessories', 'accessories', 'electronics', 7),
  ('Refrigerators', 'refrigerators', 'home-appliances', 1), ('Washing Machines', 'washing-machines', 'home-appliances', 2),
  ('Air Conditioners', 'air-conditioners', 'home-appliances', 3), ('Coolers', 'coolers', 'home-appliances', 4),
  ('Kitchen Appliances', 'kitchen-appliances', 'home-appliances', 5),
  ('Beds', 'beds', 'furniture', 1), ('Sofas', 'sofas', 'furniture', 2), ('Tables', 'tables', 'furniture', 3),
  ('Chairs', 'chairs', 'furniture', 4), ('Wardrobes', 'wardrobes', 'furniture', 5),
  ('Office Furniture', 'office-furniture', 'furniture', 6),
  ('Printers', 'printers', 'office-equipment', 1), ('Photocopiers', 'photocopiers', 'office-equipment', 2),
  ('Biometric Machines', 'biometric-machines', 'office-equipment', 3), ('Shredders', 'shredders', 'office-equipment', 4),
  ('Office Devices', 'office-devices', 'office-equipment', 5)
) AS v(name, slug, parent_slug, ord)
JOIN public.categories c ON c.slug = v.parent_slug;

INSERT INTO public.offers (title, description, badge, sort_order) VALUES
  ('Book now, pay later', 'Reserve any product with a small booking amount and pay the balance on delivery.', 'Booking', 1),
  ('Office bulk orders', 'Special pricing for offices ordering printers, furniture or biometric devices in bulk.', 'B2B', 2),
  ('Festive appliance deals', 'Extra savings on refrigerators, washing machines and ACs this season.', 'Limited', 3);

INSERT INTO public.products (category_id, name, slug, short_description, description, specifications, brand, model, quality, warranty, price, mrp, booking_amount, stock_quantity, images, is_featured)
SELECT c.id, v.name, v.slug, v.short_d, v.descr, v.specs::jsonb, v.brand, v.model, v.quality, v.warranty, v.price, v.mrp, v.booking, v.stock, ARRAY[v.img], true
FROM (VALUES
  ('mobiles', 'KTL Sample Smartphone 5G 128GB', 'sample-smartphone-5g-128gb', '6.7" AMOLED display, 5G, 50MP camera, 5000mAh battery.',
   'A sample listing to show how products appear on the store. Replace with your real product details from the admin dashboard.',
   '[{"label":"Display","value":"6.7 inch AMOLED"},{"label":"Storage","value":"128 GB"},{"label":"RAM","value":"8 GB"},{"label":"Battery","value":"5000 mAh"}]',
   'Sample Brand', 'SB-5G-128', 'Brand new, sealed box', '1 year manufacturer warranty', 18999, 22999, 1000, 25, '/images/products/smartphone.jpg'),
  ('laptops', 'KTL Sample Business Laptop 14"', 'sample-business-laptop-14', '14" Full HD, 16GB RAM, 512GB SSD — built for work.',
   'A sample listing to show how products appear on the store. Replace with your real product details from the admin dashboard.',
   '[{"label":"Display","value":"14 inch Full HD"},{"label":"Memory","value":"16 GB"},{"label":"Storage","value":"512 GB SSD"}]',
   'Sample Brand', 'SB-BL14', 'Brand new', '1 year warranty', 54990, 62990, 2000, 12, '/images/products/laptop.jpg'),
  ('tvs', 'KTL Sample 55" 4K Smart TV', 'sample-55-4k-smart-tv', '55" 4K UHD, HDR, built-in apps and voice remote.',
   'A sample listing to show how products appear on the store. Replace with your real product details from the admin dashboard.',
   '[{"label":"Screen","value":"55 inch 4K UHD"},{"label":"Smart","value":"Yes"},{"label":"Ports","value":"3 HDMI, 2 USB"}]',
   'Sample Brand', 'SB-55UHD', 'Brand new', '2 years warranty', 39990, 49990, 2000, 8, '/images/products/tv.jpg'),
  ('refrigerators', 'KTL Sample Double Door Refrigerator 340L', 'sample-double-door-refrigerator-340l', 'Frost-free, inverter compressor, 3-star energy rating.',
   'A sample listing to show how products appear on the store. Replace with your real product details from the admin dashboard.',
   '[{"label":"Capacity","value":"340 L"},{"label":"Type","value":"Double door, frost-free"},{"label":"Energy","value":"3 star"}]',
   'Sample Brand', 'SB-DD340', 'Brand new', '1 year product, 10 years compressor', 32490, 38990, 1500, 10, '/images/products/refrigerator.jpg'),
  ('washing-machines', 'KTL Sample Front Load Washer 8kg', 'sample-front-load-washer-8kg', '8kg front load, inverter motor, steam wash.',
   'A sample listing to show how products appear on the store. Replace with your real product details from the admin dashboard.',
   '[{"label":"Capacity","value":"8 kg"},{"label":"Type","value":"Front load"},{"label":"Spin","value":"1400 RPM"}]',
   'Sample Brand', 'SB-FL8', 'Brand new', '2 years warranty', 29990, 35990, 1500, 9, '/images/products/washing-machine.jpg'),
  ('sofas', 'KTL Sample 3-Seater Fabric Sofa', 'sample-3-seater-fabric-sofa', 'Solid wood frame, high-density foam, premium fabric.',
   'A sample listing to show how products appear on the store. Replace with your real product details from the admin dashboard.',
   '[{"label":"Seating","value":"3 seater"},{"label":"Frame","value":"Solid wood"},{"label":"Upholstery","value":"Fabric"}]',
   'Sample Brand', 'SB-SOFA3', 'Premium', '1 year warranty', 24999, 31999, 1000, 6, '/images/products/sofa.jpg'),
  ('office-furniture', 'KTL Sample Ergonomic Office Chair', 'sample-ergonomic-office-chair', 'Mesh back, lumbar support, adjustable armrests.',
   'A sample listing to show how products appear on the store. Replace with your real product details from the admin dashboard.',
   '[{"label":"Back","value":"Breathable mesh"},{"label":"Adjustments","value":"Height, tilt, armrests"},{"label":"Max load","value":"120 kg"}]',
   'Sample Brand', 'SB-ERGO', 'Premium', '1 year warranty', 8999, 12999, 500, 30, '/images/products/office-chair.jpg'),
  ('printers', 'KTL Sample Laser Printer All-in-One', 'sample-laser-printer-all-in-one', 'Print, scan, copy — Wi-Fi, duplex, 30 ppm.',
   'A sample listing to show how products appear on the store. Replace with your real product details from the admin dashboard.',
   '[{"label":"Functions","value":"Print, scan, copy"},{"label":"Speed","value":"30 pages/min"},{"label":"Connectivity","value":"Wi-Fi, USB"}]',
   'Sample Brand', 'SB-LJ30', 'Brand new', '1 year warranty', 21490, 25990, 1000, 15, '/images/products/printer.jpg')
) AS v(cat, name, slug, short_d, descr, specs, brand, model, quality, warranty, price, mrp, booking, stock, img)
JOIN public.categories c ON c.slug = v.cat;
