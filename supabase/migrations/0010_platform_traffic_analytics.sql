-- =========================================================
-- MIGRASI 0010: ANALISA TRAFIK PENGUNJUNG & FUNNEL PLATFORM
-- =========================================================

-- 1. Tabel Event Trafik & Funnel First-Party (ringan, tanpa IP mentah)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'page_view',
      'catalog_view',
      'item_detail_view',
      'add_to_cart',
      'wa_checkout_click',
      'booking_created',
      'shop_signup_started',
      'shop_created'
    )
  ),
  path TEXT NOT NULL CHECK (char_length(path) BETWEEN 1 AND 200),
  shop_slug TEXT DEFAULT NULL,
  visitor_id TEXT NOT NULL CHECK (char_length(visitor_id) BETWEEN 6 AND 80),
  session_id TEXT NOT NULL DEFAULT '' CHECK (char_length(session_id) <= 80),
  referrer_host TEXT NOT NULL DEFAULT 'Direct' CHECK (char_length(referrer_host) <= 120),
  utm_source TEXT NOT NULL DEFAULT '' CHECK (char_length(utm_source) <= 80),
  utm_medium TEXT NOT NULL DEFAULT '' CHECK (char_length(utm_medium) <= 80),
  utm_campaign TEXT NOT NULL DEFAULT '' CHECK (char_length(utm_campaign) <= 100),
  device_type TEXT NOT NULL DEFAULT 'desktop' CHECK (device_type IN ('mobile', 'tablet', 'desktop'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created
  ON public.analytics_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_shop_created
  ON public.analytics_events (shop_slug, created_at DESC)
  WHERE shop_slug IS NOT NULL;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_events_admin_select" ON public.analytics_events;
CREATE POLICY "analytics_events_admin_select" ON public.analytics_events
  FOR SELECT USING (public.is_platform_admin());

-- 2. RPC Publik Aman untuk Mencatat Event Trafik (Tanpa ekspos SELECT ke publik)
CREATE OR REPLACE FUNCTION public.log_analytics_event(
  p_event_type TEXT,
  p_path TEXT,
  p_visitor_id TEXT,
  p_shop_slug TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT '',
  p_referrer_host TEXT DEFAULT 'Direct',
  p_utm_source TEXT DEFAULT '',
  p_utm_medium TEXT DEFAULT '',
  p_utm_campaign TEXT DEFAULT '',
  p_device_type TEXT DEFAULT 'desktop'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event_type TEXT;
  v_path TEXT;
  v_visitor_id TEXT;
  v_device TEXT;
  v_shop_slug TEXT;
BEGIN
  v_event_type := trim(COALESCE(p_event_type, ''));
  IF v_event_type NOT IN (
    'page_view',
    'catalog_view',
    'item_detail_view',
    'add_to_cart',
    'wa_checkout_click',
    'booking_created',
    'shop_signup_started',
    'shop_created'
  ) THEN
    RETURN;
  END IF;

  v_path := left(trim(COALESCE(p_path, '/')), 200);
  IF v_path = '' OR v_path LIKE '/admin%' THEN
    RETURN;
  END IF;

  v_visitor_id := left(trim(COALESCE(p_visitor_id, '')), 80);
  IF char_length(v_visitor_id) < 6 THEN
    RETURN;
  END IF;

  v_device := CASE
    WHEN p_device_type IN ('mobile', 'tablet', 'desktop') THEN p_device_type
    ELSE 'desktop'
  END;

  v_shop_slug := NULLIF(left(trim(COALESCE(p_shop_slug, '')), 60), '');

  INSERT INTO public.analytics_events (
    event_type,
    path,
    shop_slug,
    visitor_id,
    session_id,
    referrer_host,
    utm_source,
    utm_medium,
    utm_campaign,
    device_type
  )
  VALUES (
    v_event_type,
    v_path,
    v_shop_slug,
    v_visitor_id,
    left(trim(COALESCE(p_session_id, '')), 80),
    COALESCE(NULLIF(left(trim(COALESCE(p_referrer_host, '')), 120), ''), 'Direct'),
    left(trim(COALESCE(p_utm_source, '')), 80),
    left(trim(COALESCE(p_utm_medium, '')), 80),
    left(trim(COALESCE(p_utm_campaign, '')), 100),
    v_device
  );
END;
$$;

-- 3. Perbarui RPC Analitik Platform untuk Menyertakan Trafik, Funnel, Referrer & Performa per Toko
DROP FUNCTION IF EXISTS public.get_platform_analytics();
DROP FUNCTION IF EXISTS public.get_platform_analytics(INTEGER);

CREATE OR REPLACE FUNCTION public.get_platform_analytics(
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_days INTEGER;
  v_since TIMESTAMPTZ;
  v_today_start TIMESTAMPTZ;
  v_today_local DATE;
  v_summary JSONB;
  v_shops JSONB;
  v_recent_bookings JSONB;
  v_traffic JSONB;
  v_daily_series JSONB;
  v_top_referrers JSONB;
  v_device_breakdown JSONB;
  v_top_pages JSONB;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Akses Ditolak: Halaman ini khusus untuk Super Admin Sebaraja.';
  END IF;

  v_days := LEAST(GREATEST(COALESCE(p_days, 30), 1), 90);
  v_today_local := (timezone('Asia/Makassar', now()))::date;
  v_today_start := (v_today_local::timestamp AT TIME ZONE 'Asia/Makassar');
  v_since := CASE
    WHEN v_days = 1 THEN v_today_start
    ELSE timezone('utc'::text, now()) - make_interval(days => v_days)
  END;

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
      (SELECT count(*) FROM public.shop_members m WHERE m.shop_slug = s.slug) AS member_count,
      (
        SELECT count(*) FROM public.analytics_events ae
        WHERE ae.shop_slug = s.slug
          AND ae.event_type = 'catalog_view'
          AND ae.created_at >= v_since
      ) AS views_period,
      (
        SELECT count(*) FROM public.analytics_events ae
        WHERE ae.shop_slug = s.slug
          AND ae.event_type = 'wa_checkout_click'
          AND ae.created_at >= v_since
      ) AS wa_clicks_period
    FROM public.shops s
    ORDER BY gmv DESC, views_period DESC, s.created_at DESC
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

  -- Deret harian kunjungan (maksimal 30 hari terakhir dalam zona WITA)
  SELECT COALESCE(jsonb_agg(row_to_json(ds) ORDER BY ds.date), '[]'::jsonb)
  INTO v_daily_series
  FROM (
    SELECT
      to_char(d.day, 'YYYY-MM-DD') AS date,
      to_char(d.day, 'DD/MM') AS label,
      COALESCE(count(*) FILTER (WHERE ae.event_type IN ('page_view', 'catalog_view')), 0) AS views,
      COALESCE(count(DISTINCT ae.visitor_id) FILTER (WHERE ae.event_type IN ('page_view', 'catalog_view')), 0) AS unique_visitors,
      COALESCE(count(*) FILTER (WHERE ae.event_type = 'catalog_view'), 0) AS catalog_views,
      COALESCE(count(*) FILTER (WHERE ae.event_type = 'wa_checkout_click'), 0) AS wa_clicks
    FROM generate_series(
      v_today_local - (LEAST(v_days, 30) - 1),
      v_today_local,
      interval '1 day'
    ) AS d(day)
    LEFT JOIN public.analytics_events ae
      ON (timezone('Asia/Makassar', ae.created_at))::date = d.day::date
    GROUP BY d.day
  ) ds;

  -- Top sumber trafik (UTM Source atau Referrer Host)
  SELECT COALESCE(jsonb_agg(row_to_json(tr)), '[]'::jsonb)
  INTO v_top_referrers
  FROM (
    SELECT
      COALESCE(NULLIF(ae.utm_source, ''), NULLIF(ae.referrer_host, ''), 'Direct') AS source,
      count(*) AS views,
      count(DISTINCT ae.visitor_id) AS unique_visitors
    FROM public.analytics_events ae
    WHERE ae.created_at >= v_since
      AND ae.event_type IN ('page_view', 'catalog_view')
    GROUP BY 1
    ORDER BY views DESC
    LIMIT 8
  ) tr;

  -- Breakdown perangkat
  SELECT COALESCE(jsonb_agg(row_to_json(db)), '[]'::jsonb)
  INTO v_device_breakdown
  FROM (
    SELECT
      ae.device_type AS device,
      count(*) AS views,
      count(DISTINCT ae.visitor_id) AS unique_visitors
    FROM public.analytics_events ae
    WHERE ae.created_at >= v_since
      AND ae.event_type IN ('page_view', 'catalog_view')
    GROUP BY ae.device_type
    ORDER BY views DESC
  ) db;

  -- Top halaman & katalog paling ramai
  SELECT COALESCE(jsonb_agg(row_to_json(tp)), '[]'::jsonb)
  INTO v_top_pages
  FROM (
    SELECT
      ae.path,
      MAX(ae.shop_slug) AS shop_slug,
      count(*) AS views,
      count(DISTINCT ae.visitor_id) AS unique_visitors
    FROM public.analytics_events ae
    WHERE ae.created_at >= v_since
      AND ae.event_type IN ('page_view', 'catalog_view')
    GROUP BY ae.path
    ORDER BY views DESC
    LIMIT 8
  ) tp;

  SELECT jsonb_build_object(
    'period_days', v_days,
    'total_page_views', (
      SELECT count(*) FROM public.analytics_events
      WHERE created_at >= v_since AND event_type IN ('page_view', 'catalog_view')
    ),
    'unique_visitors', (
      SELECT count(DISTINCT visitor_id) FROM public.analytics_events
      WHERE created_at >= v_since AND event_type IN ('page_view', 'catalog_view')
    ),
    'today_views', (
      SELECT count(*) FROM public.analytics_events
      WHERE created_at >= v_today_start AND event_type IN ('page_view', 'catalog_view')
    ),
    'today_unique_visitors', (
      SELECT count(DISTINCT visitor_id) FROM public.analytics_events
      WHERE created_at >= v_today_start AND event_type IN ('page_view', 'catalog_view')
    ),
    'landing_views', (
      SELECT count(*) FROM public.analytics_events
      WHERE created_at >= v_since AND event_type = 'page_view' AND path = '/'
    ),
    'catalog_views', (
      SELECT count(*) FROM public.analytics_events
      WHERE created_at >= v_since AND event_type = 'catalog_view'
    ),
    'item_detail_views', (
      SELECT count(*) FROM public.analytics_events
      WHERE created_at >= v_since AND event_type = 'item_detail_view'
    ),
    'add_to_carts', (
      SELECT count(*) FROM public.analytics_events
      WHERE created_at >= v_since AND event_type = 'add_to_cart'
    ),
    'wa_checkout_clicks', (
      SELECT count(*) FROM public.analytics_events
      WHERE created_at >= v_since AND event_type = 'wa_checkout_click'
    ),
    'booking_created_events', (
      SELECT count(*) FROM public.analytics_events
      WHERE created_at >= v_since AND event_type = 'booking_created'
    ),
    'shop_signup_started', (
      SELECT count(*) FROM public.analytics_events
      WHERE created_at >= v_since AND event_type = 'shop_signup_started'
    ),
    'shop_created_events', (
      SELECT count(*) FROM public.analytics_events
      WHERE created_at >= v_since AND event_type = 'shop_created'
    ),
    'daily_series', v_daily_series,
    'top_referrers', v_top_referrers,
    'device_breakdown', v_device_breakdown,
    'top_pages', v_top_pages
  ) INTO v_traffic;

  RETURN jsonb_build_object(
    'summary', v_summary,
    'shops', v_shops,
    'recent_bookings', v_recent_bookings,
    'traffic', v_traffic
  );
END;
$$;
