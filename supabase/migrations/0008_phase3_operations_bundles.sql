-- =========================================================
-- MIGRASI 0008: FASE 3 (LEAD ALERT, HANDOVER DP/JAMINAN, WALK-IN, QRIS & BUNDLING)
-- =========================================================

-- 1. Tambah kolom qris_url, bundles, dan notify_telegram_chat_id pada public.shops
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS qris_url TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS bundles JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notify_telegram_chat_id TEXT NOT NULL DEFAULT '';

-- Amankan agar notify_telegram_chat_id hanya terbaca oleh Owner/Super Admin (tidak di-expose ke anon/public)
-- Perbarui view shops_public agar mengekspos qris_url dan bundles (tanpa notify_telegram_chat_id)
DROP VIEW IF EXISTS public.shops_public;
CREATE VIEW public.shops_public AS
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
  created_at,
  pro_expires_at,
  billing_cycle,
  discount_tiers,
  qris_url,
  bundles
FROM public.shops;

-- 2. Tambah kolom operasional serah-terima & walk-in pada public.bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS pickup_time TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery_mode IN ('pickup', 'delivery')),
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'dp', 'paid')),
ADD COLUMN IF NOT EXISTS dp_amount NUMERIC NOT NULL DEFAULT 0 CHECK (dp_amount >= 0),
ADD COLUMN IF NOT EXISTS collateral TEXT NOT NULL DEFAULT '' CHECK (char_length(collateral) <= 120),
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'catalog' CHECK (source IN ('catalog', 'walkin'));

-- 3. Perbarui RPC create_booking agar mendukung pickup_time, delivery_mode, dan p_bundles
CREATE OR REPLACE FUNCTION public.create_booking(
  p_shop_slug TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_start_date DATE,
  p_duration_days INTEGER,
  p_multiplier NUMERIC,
  p_lines JSONB,
  p_notes TEXT DEFAULT '',
  p_pickup_time TEXT DEFAULT '09:00',
  p_delivery_mode TEXT DEFAULT 'pickup',
  p_bundles JSONB DEFAULT '[]'::jsonb
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
  v_bundle_req JSONB;
  v_shop_bundles JSONB;
  v_bundle_def JSONB;
  v_bundle_line JSONB;
  v_bundle_qty INTEGER;
  v_bundle_price NUMERIC;
  v_bundle_name TEXT;
  v_item public.rental_items;
  v_qty INTEGER;
  v_avail INTEGER;
  v_effective_multiplier NUMERIC;
  v_subtotal NUMERIC;
  v_delivery_mode TEXT;
  v_pickup_time TEXT;
BEGIN
  IF p_start_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Tanggal mulai sewa tidak boleh di masa lalu.';
  END IF;

  IF p_duration_days < 1 OR p_duration_days > 60 THEN
    RAISE EXCEPTION 'Durasi sewa harus antara 1 hingga 60 hari.';
  END IF;

  IF (jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0)
     AND (p_bundles IS NULL OR jsonb_typeof(p_bundles) <> 'array' OR jsonb_array_length(p_bundles) = 0) THEN
    RAISE EXCEPTION 'Keranjang sewa tidak boleh kosong.';
  END IF;

  v_delivery_mode := CASE WHEN p_delivery_mode = 'delivery' THEN 'delivery' ELSE 'pickup' END;
  v_pickup_time := COALESCE(NULLIF(trim(p_pickup_time), ''), '09:00');
  v_end_date := p_start_date + (p_duration_days - 1);
  v_effective_multiplier := public.shop_duration_multiplier(p_shop_slug, p_duration_days);
  v_code := 'SBR-' || to_char(CURRENT_DATE, 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

  INSERT INTO public.bookings (
    shop_slug, code, customer_name, customer_phone, start_date, end_date, duration_days,
    status, total_amount, notes, pickup_time, delivery_mode, payment_status, dp_amount, collateral, source
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
    COALESCE(trim(p_notes), ''),
    v_pickup_time,
    v_delivery_mode,
    'unpaid',
    0,
    '',
    'catalog'
  )
  RETURNING * INTO v_booking;

  -- A. Proses item satuan (p_lines)
  IF jsonb_typeof(p_lines) = 'array' AND jsonb_array_length(p_lines) > 0 THEN
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
  END IF;

  -- B. Proses Paket Bundling (p_bundles) dengan verifikasi harga & stok fisik komponen di server
  IF p_bundles IS NOT NULL AND jsonb_typeof(p_bundles) = 'array' AND jsonb_array_length(p_bundles) > 0 THEN
    SELECT bundles INTO v_shop_bundles FROM public.shops WHERE slug = p_shop_slug;

    FOR v_bundle_req IN SELECT * FROM jsonb_array_elements(p_bundles)
    LOOP
      v_bundle_qty := (v_bundle_req->>'qty')::INTEGER;
      IF v_bundle_qty IS NULL OR v_bundle_qty <= 0 THEN
        RAISE EXCEPTION 'Jumlah paket bundling harus lebih dari 0.';
      END IF;

      SELECT elem INTO v_bundle_def
      FROM jsonb_array_elements(COALESCE(v_shop_bundles, '[]'::jsonb)) elem
      WHERE elem->>'id' = (v_bundle_req->>'bundle_id')
      LIMIT 1;

      IF v_bundle_def IS NULL THEN
        RAISE EXCEPTION 'Paket bundling tidak ditemukan pada toko ini.';
      END IF;

      v_bundle_price := (v_bundle_def->>'pricePerDay')::NUMERIC;
      v_bundle_name := v_bundle_def->>'name';
      v_subtotal := round(v_bundle_price * v_effective_multiplier * v_bundle_qty);
      v_total := v_total + v_subtotal;

      -- Kunci dan kurangi kuota setiap unit penyusun paket bundling
      DECLARE
        v_line_idx INTEGER := 0;
        v_needed_qty INTEGER;
      BEGIN
        FOR v_bundle_line IN SELECT * FROM jsonb_array_elements(v_bundle_def->'lines')
        LOOP
          v_needed_qty := ((v_bundle_line->>'qty')::INTEGER) * v_bundle_qty;

          SELECT * INTO v_item
          FROM public.rental_items
          WHERE id = (v_bundle_line->>'itemId')::UUID
            AND shop_slug = p_shop_slug
          FOR UPDATE;

          IF NOT FOUND THEN
            RAISE EXCEPTION 'Komponen unit pada paket "%" tidak ditemukan.', v_bundle_name;
          END IF;

          v_avail := public.available_item_qty(v_item.id, p_start_date, v_end_date);
          IF v_avail < v_needed_qty THEN
            RAISE EXCEPTION 'Stok unit "%" pada paket "%" tidak mencukupi untuk tanggal tersebut.',
              v_item.name, v_bundle_name;
          END IF;

          -- Catat subtotal paket pada baris komponen pertama agar total revenue tetap akurat tanpa double-counting
          INSERT INTO public.booking_lines (
            booking_id, item_id, item_name, qty, unit_price_per_day, subtotal
          ) VALUES (
            v_booking.id,
            v_item.id,
            format('[Paket %s] %s', v_bundle_name, v_item.name),
            v_needed_qty,
            CASE WHEN v_line_idx = 0 THEN v_bundle_price ELSE 0 END,
            CASE WHEN v_line_idx = 0 THEN v_subtotal ELSE 0 END
          );
          v_line_idx := v_line_idx + 1;
        END LOOP;
      END;
    END LOOP;
  END IF;

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

-- 4. RPC Catat Sewa Walk-in Cepat oleh Owner / Staf Gudang (langsung berstatus picked_up)
CREATE OR REPLACE FUNCTION public.create_walkin_booking(
  p_shop_slug TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_duration_days INTEGER,
  p_lines JSONB,
  p_payment_status TEXT DEFAULT 'paid',
  p_dp_amount NUMERIC DEFAULT 0,
  p_collateral TEXT DEFAULT 'E-KTP Asli',
  p_notes TEXT DEFAULT ''
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_start_date DATE := CURRENT_DATE;
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
  v_pay_status TEXT;
  v_role TEXT;
BEGIN
  IF NOT public.is_shop_member(p_shop_slug, ARRAY['owner', 'staff']) THEN
    RAISE EXCEPTION 'Akses Ditolak: Hanya Owner atau Staf Gudang yang dapat mencatat sewa walk-in.';
  END IF;

  IF p_duration_days < 1 OR p_duration_days > 60 THEN
    RAISE EXCEPTION 'Durasi sewa harus antara 1 hingga 60 hari.';
  END IF;

  IF jsonb_typeof(p_lines) <> 'array' OR jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'Pilih minimal 1 unit alat untuk sewa walk-in.';
  END IF;

  v_pay_status := CASE WHEN p_payment_status IN ('unpaid', 'dp', 'paid') THEN p_payment_status ELSE 'paid' END;
  v_end_date := v_start_date + (p_duration_days - 1);
  v_effective_multiplier := public.shop_duration_multiplier(p_shop_slug, p_duration_days);
  v_code := 'SBR-' || to_char(CURRENT_DATE, 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

  INSERT INTO public.bookings (
    shop_slug, code, customer_name, customer_phone, start_date, end_date, duration_days,
    status, total_amount, notes, pickup_time, delivery_mode, payment_status, dp_amount, collateral, source
  ) VALUES (
    p_shop_slug,
    v_code,
    trim(p_customer_name),
    regexp_replace(trim(p_customer_phone), '[^0-9+]', '', 'g'),
    v_start_date,
    v_end_date,
    p_duration_days,
    'picked_up',
    0,
    COALESCE(trim(p_notes), ''),
    to_char(timezone('Asia/Makassar', now()), 'HH24:MI'),
    'pickup',
    v_pay_status,
    GREATEST(0, COALESCE(p_dp_amount, 0)),
    COALESCE(trim(p_collateral), ''),
    'walkin'
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
      RAISE EXCEPTION 'Unit tidak ditemukan.';
    END IF;

    v_avail := public.available_item_qty(v_item.id, v_start_date, v_end_date);
    IF v_avail < v_qty THEN
      RAISE EXCEPTION 'Stok unit "%" tidak mencukupi (tersisa % unit).', v_item.name, v_avail;
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
  SET total_amount = v_total,
      dp_amount = CASE WHEN v_pay_status = 'paid' THEN v_total ELSE GREATEST(0, COALESCE(p_dp_amount, 0)) END
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  v_role := public.current_actor_role(p_shop_slug);
  INSERT INTO public.activity_logs (shop_slug, actor_id, actor_role, action)
  VALUES (
    p_shop_slug,
    auth.uid(),
    v_role,
    format('Mencatat sewa walk-in %s (%s) senilai Rp%s', v_code, trim(p_customer_name), v_total)
  );

  RETURN v_booking;
END;
$$;

-- 5. RPC Update Status Pembayaran (DP/Lunas) & Jaminan (Serah Terima)
CREATE OR REPLACE FUNCTION public.update_booking_handover(
  p_booking_id UUID,
  p_payment_status TEXT,
  p_dp_amount NUMERIC DEFAULT 0,
  p_collateral TEXT DEFAULT ''
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking public.bookings;
  v_role TEXT;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data booking tidak ditemukan.';
  END IF;

  IF NOT public.is_shop_member(v_booking.shop_slug, ARRAY['owner', 'staff']) THEN
    RAISE EXCEPTION 'Akses Ditolak: Anda bukan pengelola toko ini.';
  END IF;

  IF p_payment_status NOT IN ('unpaid', 'dp', 'paid') THEN
    RAISE EXCEPTION 'Status pembayaran tidak valid.';
  END IF;

  UPDATE public.bookings
  SET payment_status = p_payment_status,
      dp_amount = CASE
        WHEN p_payment_status = 'paid' THEN v_booking.total_amount
        WHEN p_payment_status = 'unpaid' THEN 0
        ELSE GREATEST(0, LEAST(v_booking.total_amount, COALESCE(p_dp_amount, 0)))
      END,
      collateral = COALESCE(trim(p_collateral), '')
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  v_role := public.current_actor_role(v_booking.shop_slug);
  INSERT INTO public.activity_logs (shop_slug, actor_id, actor_role, action)
  VALUES (
    v_booking.shop_slug,
    auth.uid(),
    v_role,
    format('Memperbarui pembayaran (%s) & jaminan booking %s', upper(p_payment_status), v_booking.code)
  );

  RETURN v_booking;
END;
$$;

-- 6. RPC Ambil Payload Notifikasi Order Baru untuk Server (/api/notify) tanpa membuka RLS bookings/chat_id ke publik
CREATE OR REPLACE FUNCTION public.get_booking_notify_payload(
  p_shop_slug TEXT,
  p_booking_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_shop public.shops;
  v_booking public.bookings;
  v_lines JSONB;
BEGIN
  SELECT * INTO v_shop FROM public.shops WHERE slug = trim(p_shop_slug) LIMIT 1;
  IF NOT FOUND OR COALESCE(trim(v_shop.notify_telegram_chat_id), '') = '' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE shop_slug = trim(p_shop_slug)
    AND lower(code) = lower(trim(p_booking_code))
    AND created_at >= (timezone('utc'::text, now()) - interval '15 minutes')
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(
    jsonb_agg(jsonb_build_object('item_name', bl.item_name, 'qty', bl.qty, 'subtotal', bl.subtotal)),
    '[]'::jsonb
  ) INTO v_lines
  FROM public.booking_lines bl
  WHERE bl.booking_id = v_booking.id;

  RETURN jsonb_build_object(
    'chat_id', trim(v_shop.notify_telegram_chat_id),
    'shop_name', v_shop.name,
    'shop_slug', v_shop.slug,
    'code', v_booking.code,
    'customer_name', v_booking.customer_name,
    'customer_phone', v_booking.customer_phone,
    'start_date', v_booking.start_date,
    'end_date', v_booking.end_date,
    'duration_days', v_booking.duration_days,
    'pickup_time', v_booking.pickup_time,
    'delivery_mode', v_booking.delivery_mode,
    'total_amount', v_booking.total_amount,
    'notes', v_booking.notes,
    'lines', v_lines
  );
END;
$$;

-- 7. Perbarui get_public_booking_by_code agar menyertakan pickup_time, delivery_mode, payment_status, dp_amount, collateral
CREATE OR REPLACE FUNCTION public.get_public_booking_by_code(
  p_shop_slug TEXT,
  p_booking_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_booking public.bookings;
  v_masked_phone TEXT;
  v_len INT;
  v_lines JSONB;
BEGIN
  IF p_shop_slug IS NULL OR p_booking_code IS NULL OR char_length(trim(p_booking_code)) < 4 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE shop_slug = trim(p_shop_slug)
    AND lower(code) = lower(trim(p_booking_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_len := char_length(v_booking.customer_phone);
  IF v_len > 7 THEN
    v_masked_phone := substr(v_booking.customer_phone, 1, 5) || '****' || substr(v_booking.customer_phone, v_len - 2, 3);
  ELSIF v_len > 4 THEN
    v_masked_phone := substr(v_booking.customer_phone, 1, 2) || '****' || substr(v_booking.customer_phone, v_len - 1, 2);
  ELSE
    v_masked_phone := '****';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', bl.id,
        'booking_id', bl.booking_id,
        'item_id', bl.item_id,
        'item_name', bl.item_name,
        'qty', bl.qty,
        'unit_price_per_day', bl.unit_price_per_day,
        'subtotal', bl.subtotal
      )
    ),
    '[]'::jsonb
  ) INTO v_lines
  FROM public.booking_lines bl
  WHERE bl.booking_id = v_booking.id;

  RETURN jsonb_build_object(
    'id', v_booking.id,
    'shop_slug', v_booking.shop_slug,
    'code', v_booking.code,
    'customer_name', v_booking.customer_name,
    'customer_phone', v_masked_phone,
    'start_date', v_booking.start_date,
    'end_date', v_booking.end_date,
    'duration_days', v_booking.duration_days,
    'status', v_booking.status,
    'total_amount', v_booking.total_amount,
    'notes', v_booking.notes,
    'pickup_time', v_booking.pickup_time,
    'delivery_mode', v_booking.delivery_mode,
    'payment_status', v_booking.payment_status,
    'dp_amount', v_booking.dp_amount,
    'collateral', v_booking.collateral,
    'source', v_booking.source,
    'created_at', v_booking.created_at,
    'booking_lines', v_lines
  );
END;
$$;
