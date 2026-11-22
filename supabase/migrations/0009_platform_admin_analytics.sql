-- =========================================================
-- MIGRASI 0009: ANALISA PLATFORM & MANAJEMEN MITRA SUPER ADMIN
-- =========================================================

-- 1. RPC Analitik Menyeluruh Platform Sebaraja (Khusus Super Admin di public.platform_admins)
CREATE OR REPLACE FUNCTION public.get_platform_analytics()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_summary JSONB;
  v_shops JSONB;
  v_recent_bookings JSONB;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Akses Ditolak: Halaman ini khusus untuk Super Admin Sebaraja.';
  END IF;

  SELECT jsonb_build_object(
    'total_shops', (SELECT count(*) FROM public.shops),
    'pro_shops', (
      SELECT count(*) FROM public.shops
      WHERE plan = 'PRO' AND (pro_expires_at IS NULL OR pro_expires_at > timezone('utc'::text, now()))
    ),
    'free_shops', (
      SELECT count(*) FROM public.shops
      WHERE plan <> 'PRO' OR (pro_expires_at IS NOT NULL AND pro_expires_at <= timezone('utc'::text, now()))
    ),
    'verified_shops', (SELECT count(*) FROM public.shops WHERE is_verified = true),
    'qris_adopted_shops', (SELECT count(*) FROM public.shops WHERE COALESCE(trim(qris_url), '') <> ''),
    'telegram_adopted_shops', (SELECT count(*) FROM public.shops WHERE COALESCE(trim(notify_telegram_chat_id), '') <> ''),
    'total_items', (SELECT count(*) FROM public.rental_items),
    'total_bookings', (SELECT count(*) FROM public.bookings),
    'walkin_bookings', (SELECT count(*) FROM public.bookings WHERE source = 'walkin'),
    'confirmed_bookings', (SELECT count(*) FROM public.bookings WHERE status IN ('confirmed', 'picked_up', 'returned')),
    'total_gmv', COALESCE((SELECT sum(total_amount) FROM public.bookings WHERE status IN ('confirmed', 'picked_up', 'returned')), 0),
    'pending_gmv', COALESCE((SELECT sum(total_amount) FROM public.bookings WHERE status = 'pending'), 0),
    'total_members', (SELECT count(*) FROM public.shop_members)
  ) INTO v_summary;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO v_shops
  FROM (
    SELECT
      s.slug,
      s.name,
      s.location,
      s.whatsapp,
      s.plan,
      s.is_verified,
      s.pro_expires_at,
      s.billing_cycle,
      s.created_at,
      (COALESCE(trim(s.qris_url), '') <> '') AS has_qris,
      (COALESCE(trim(s.notify_telegram_chat_id), '') <> '') AS has_telegram,
      (SELECT count(*) FROM public.rental_items i WHERE i.shop_slug = s.slug) AS item_count,
      (SELECT count(*) FROM public.bookings b WHERE b.shop_slug = s.slug) AS booking_count,
      COALESCE((
        SELECT sum(b.total_amount) FROM public.bookings b
        WHERE b.shop_slug = s.slug AND b.status IN ('confirmed', 'picked_up', 'returned')
      ), 0) AS gmv,
      (SELECT count(*) FROM public.shop_members m WHERE m.shop_slug = s.slug) AS member_count
    FROM public.shops s
    ORDER BY gmv DESC, s.created_at DESC
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(rb)), '[]'::jsonb)
  INTO v_recent_bookings
  FROM (
    SELECT
      b.id,
      b.shop_slug,
      s.name AS shop_name,
      b.code,
      b.customer_name,
      b.total_amount,
      b.status,
      b.source,
      b.payment_status,
      b.created_at
    FROM public.bookings b
    JOIN public.shops s ON s.slug = b.shop_slug
    ORDER BY b.created_at DESC
    LIMIT 15
  ) rb;

  RETURN jsonb_build_object(
    'summary', v_summary,
    'shops', v_shops,
    'recent_bookings', v_recent_bookings
  );
END;
$$;

-- 2. RPC Manajemen Paket PRO & Verified Partner oleh Super Admin
CREATE OR REPLACE FUNCTION public.admin_update_shop_plan(
  p_shop_slug TEXT,
  p_plan TEXT,
  p_is_verified BOOLEAN DEFAULT NULL,
  p_billing_cycle TEXT DEFAULT NULL,
  p_duration_days INTEGER DEFAULT 30
)
RETURNS public.shops
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_shop public.shops;
  v_expires TIMESTAMPTZ;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Akses Ditolak: Hanya Super Admin Sebaraja yang dapat mengubah paket toko.';
  END IF;

  IF p_plan NOT IN ('FREE', 'PRO') THEN
    RAISE EXCEPTION 'Paket tidak valid (gunakan FREE atau PRO).';
  END IF;

  IF p_plan = 'PRO' THEN
    v_expires := CASE
      WHEN p_duration_days IS NULL OR p_duration_days <= 0 THEN NULL
      ELSE timezone('utc'::text, now()) + make_interval(days => p_duration_days)
    END;
  ELSE
    v_expires := NULL;
  END IF;

  UPDATE public.shops
  SET
    plan = p_plan,
    is_verified = COALESCE(p_is_verified, is_verified),
    billing_cycle = CASE WHEN p_plan = 'PRO' THEN COALESCE(p_billing_cycle, 'monthly') ELSE NULL END,
    pro_expires_at = v_expires
  WHERE slug = p_shop_slug
  RETURNING * INTO v_shop;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Toko "%" tidak ditemukan.', p_shop_slug;
  END IF;

  RETURN v_shop;
END;
$$;
