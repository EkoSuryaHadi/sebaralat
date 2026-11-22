-- =========================================================
-- MIGRASI 0006: FASE 1 IMPROVEMENTS (TIER DISKON OWNER & VIEW SHOPS)
-- =========================================================

-- 1. Tambahkan kolom discount_tiers JSONB pada public.shops
-- Default: tier 3 hari (10%) & 7 hari (25%) yang dapat diubah atau dihapus (0%) oleh Owner
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS discount_tiers JSONB NOT NULL DEFAULT '[{"minDays": 3, "discountPercent": 10}, {"minDays": 7, "discountPercent": 25}]'::jsonb;

COMMENT ON COLUMN public.shops.discount_tiers IS 'Daftar tier diskon durasi milik toko: [{"minDays": 3, "discountPercent": 10}]. Kosong [] berarti tanpa diskon durasi.';

-- Perbarui view publik shops_public agar menyertakan discount_tiers, pro_expires_at, billing_cycle
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
  pro_expires_at,
  billing_cycle,
  terms,
  discount_tiers,
  partner_shop,
  logo_url,
  created_at
FROM public.shops;

-- 2. Fungsi multiplier durasi berbasis konfigurasi discount_tiers milik toko
CREATE OR REPLACE FUNCTION public.shop_duration_multiplier(
  p_shop_slug TEXT,
  p_duration_days INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tiers JSONB;
  v_elem JSONB;
  v_min_days INTEGER;
  v_disc NUMERIC;
  v_best_min_days INTEGER := 0;
  v_best_discount NUMERIC := 0;
BEGIN
  IF p_duration_days IS NULL OR p_duration_days <= 1 THEN
    RETURN 1::numeric;
  END IF;

  SELECT discount_tiers INTO v_tiers
  FROM public.shops
  WHERE slug = p_shop_slug;

  IF v_tiers IS NULL OR jsonb_typeof(v_tiers) <> 'array' OR jsonb_array_length(v_tiers) = 0 THEN
    RETURN p_duration_days::numeric;
  END IF;

  FOR v_elem IN SELECT * FROM jsonb_array_elements(v_tiers)
  LOOP
    v_min_days := COALESCE((v_elem->>'minDays')::INTEGER, 0);
    v_disc := COALESCE((v_elem->>'discountPercent')::NUMERIC, 0);

    IF v_min_days >= 2
       AND v_min_days <= p_duration_days
       AND v_disc > 0
       AND v_disc <= 90
       AND v_min_days >= v_best_min_days THEN
      v_best_min_days := v_min_days;
      v_best_discount := v_disc;
    END IF;
  END LOOP;

  IF v_best_discount > 0 THEN
    RETURN round((p_duration_days * (1 - (v_best_discount / 100.0)))::numeric, 2);
  END IF;

  RETURN p_duration_days::numeric;
END;
$$;

-- 3. Perbarui RPC create_booking agar menggunakan public.shop_duration_multiplier(p_shop_slug, p_duration_days)
CREATE OR REPLACE FUNCTION public.create_booking(
  p_shop_slug TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_start_date DATE,
  p_duration_days INTEGER,
  p_multiplier NUMERIC,
  p_lines JSONB,
  p_notes TEXT DEFAULT ''
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_end_date DATE;
  v_code TEXT;
  v_total NUMERIC := 0;
  v_booking public.bookings;
  v_line JSONB;
  v_item public.rental_items;
  v_qty INTEGER;
  v_avail INTEGER;
  v_effective_multiplier NUMERIC;
  v_subtotal NUMERIC;
BEGIN
  IF p_start_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Tanggal mulai sewa tidak boleh di masa lalu.';
  END IF;

  IF p_duration_days < 1 OR p_duration_days > 60 THEN
    RAISE EXCEPTION 'Durasi sewa harus antara 1 hingga 60 hari.';
  END IF;

  IF jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'Keranjang sewa tidak boleh kosong.';
  END IF;

  v_end_date := p_start_date + (p_duration_days - 1);
  -- Gunakan aturan diskon durasi yang diatur oleh Owner toko di database
  v_effective_multiplier := public.shop_duration_multiplier(p_shop_slug, p_duration_days);

  v_code := 'SBR-' || to_char(CURRENT_DATE, 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

  INSERT INTO public.bookings (
    shop_slug, code, customer_name, customer_phone, start_date, end_date, duration_days, status, total_amount, notes
  ) VALUES (
    p_shop_slug,
    v_code,
    trim(p_customer_name),
    regexp_replace(trim(p_customer_phone), '[^0-9+]', '', 'g'),
    p_start_date,
    v_end_date,
    p_duration_days,
    'pending',
    0,
    COALESCE(trim(p_notes), '')
  )
  RETURNING * INTO v_booking;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_qty := (v_line->>'qty')::INTEGER;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Jumlah unit harus lebih dari 0.';
    END IF;

    SELECT * INTO v_item
    FROM public.rental_items
    WHERE id = (v_line->>'item_id')::UUID
      AND shop_slug = p_shop_slug
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unit tidak ditemukan pada katalog toko ini.';
    END IF;

    v_avail := public.available_item_qty(v_item.id, p_start_date, v_end_date);
    IF v_avail < v_qty THEN
      RAISE EXCEPTION 'Stok unit "%" tidak mencukupi untuk tanggal % s/d % (tersisa % unit).',
        v_item.name, p_start_date, v_end_date, v_avail;
    END IF;

    v_subtotal := round(v_item.price_per_day * v_effective_multiplier * v_qty);
    v_total := v_total + v_subtotal;

    INSERT INTO public.booking_lines (
      booking_id, item_id, item_name, qty, unit_price_per_day, subtotal
    ) VALUES (
      v_booking.id, v_item.id, v_item.name, v_qty, v_item.price_per_day, v_subtotal
    );
  END LOOP;

  UPDATE public.bookings
  SET total_amount = v_total
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  INSERT INTO public.activity_logs (shop_slug, actor_id, actor_role, action)
  VALUES (
    p_shop_slug,
    auth.uid(),
    'Pelanggan',
    format('Pengajuan booking %s (%s) untuk %s s/d %s senilai Rp%s', v_code, trim(p_customer_name), p_start_date, v_end_date, v_total)
  );

  RETURN v_booking;
END;
$$;
