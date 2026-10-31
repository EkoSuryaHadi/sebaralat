-- =========================================================
-- MIGRASI 0001: SKEMA INTI SEBARAJA (RESET & STANDARISASI)
-- =========================================================

-- Reset tabel lama (sesuai persetujuan bahwa DB masih berisi data demo)
DROP VIEW IF EXISTS public.shops_public CASCADE;
DROP TABLE IF EXISTS public.booking_lines CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.shop_invites CASCADE;
DROP TABLE IF EXISTS public.shop_members CASCADE;
DROP TABLE IF EXISTS public.platform_admins CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.rental_items CASCADE;
DROP TABLE IF EXISTS public.shops CASCADE;

-- Fungsi trigger otomatis untuk updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 1. Tabel Platform Admins (Super Admin via SQL)
CREATE TABLE public.platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Tabel Mitra Toko Rental (shops) - TANPA PIN PLAINTEXT
CREATE TABLE public.shops (
  slug TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 3 AND 60),
  name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  tagline TEXT NOT NULL DEFAULT '' CHECK (char_length(tagline) <= 240),
  category_type TEXT NOT NULL DEFAULT 'Umum' CHECK (char_length(category_type) <= 80),
  location TEXT NOT NULL CHECK (char_length(trim(location)) BETWEEN 2 AND 200),
  maps_url TEXT NOT NULL DEFAULT '',
  hours TEXT NOT NULL DEFAULT '08.00 - 21.00 WITA' CHECK (char_length(hours) <= 100),
  whatsapp TEXT NOT NULL CHECK (whatsapp ~ '^62[0-9]{8,13}$'),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO')),
  terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  partner_shop JSONB,
  logo_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_shops_updated_at
BEFORE UPDATE ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- View publik untuk pelanggan (hanya mengekspos kolom publik yang aman)
CREATE OR REPLACE VIEW public.shops_public AS
SELECT
  slug,
  name,
  tagline,
  category_type,
  location,
  maps_url,
  hours,
  whatsapp,
  is_verified,
  plan,
  terms,
  partner_shop,
  logo_url,
  created_at
FROM public.shops;

-- 3. Tabel Anggota Toko (shop_members) - Owner & Staf berbasis Supabase Auth
CREATE TABLE public.shop_members (
  shop_slug TEXT NOT NULL REFERENCES public.shops(slug) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (shop_slug, user_id)
);

CREATE INDEX idx_shop_members_user_id ON public.shop_members(user_id);

-- 4. Tabel Undangan Staf Gudang (shop_invites)
CREATE TABLE public.shop_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_slug TEXT NOT NULL REFERENCES public.shops(slug) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (position('@' in email) > 1),
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (shop_slug, email)
);

-- 5. Tabel Unit Alat Sewa (rental_items) - UUID & Constraint Ketat
CREATE TABLE public.rental_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_slug TEXT NOT NULL REFERENCES public.shops(slug) ON DELETE CASCADE,
  sku TEXT NOT NULL CHECK (char_length(trim(sku)) BETWEEN 1 AND 40),
  name TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 150),
  category TEXT NOT NULL CHECK (char_length(trim(category)) BETWEEN 2 AND 80),
  icon_type TEXT NOT NULL DEFAULT 'tent',
  price_per_day NUMERIC NOT NULL CHECK (price_per_day > 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
  stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
  available_at TEXT NOT NULL DEFAULT '' CHECK (char_length(available_at) <= 120),
  renter_note TEXT NOT NULL DEFAULT '' CHECK (char_length(renter_note) <= 300),
  last_updated_by TEXT NOT NULL DEFAULT 'Owner',
  specs JSONB NOT NULL DEFAULT '[]'::jsonb,
  image_bg TEXT NOT NULL DEFAULT 'from-emerald-600 to-teal-800',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (shop_slug, sku)
);

CREATE INDEX idx_rental_items_shop_slug ON public.rental_items(shop_slug);

CREATE TRIGGER trg_rental_items_updated_at
BEFORE UPDATE ON public.rental_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Tabel Log Audit Aktivitas Internal (activity_logs) - Server Timestamp
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_slug TEXT NOT NULL REFERENCES public.shops(slug) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_activity_logs_shop_slug_created ON public.activity_logs(shop_slug, created_at DESC);

