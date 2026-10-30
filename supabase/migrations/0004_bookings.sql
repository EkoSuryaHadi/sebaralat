-- =========================================================
-- MIGRASI 0004: SISTEM BOOKING & KETERSEDIAAN BERBASIS TANGGAL
-- =========================================================

-- 1. Tabel Bookings (Pesanan Pelanggan)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_slug TEXT NOT NULL REFERENCES public.shops(slug) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL CHECK (char_length(trim(customer_name)) BETWEEN 2 AND 120),
  customer_phone TEXT NOT NULL CHECK (customer_phone ~ '^[0-9+]{8,16}$'),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
  duration_days INTEGER NOT NULL CHECK (duration_days >= 1 AND duration_days <= 60),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'picked_up', 'returned', 'cancelled')),
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  notes TEXT NOT NULL DEFAULT '' CHECK (char_length(notes) <= 400),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_bookings_shop_dates ON public.bookings(shop_slug, start_date, end_date);
CREATE INDEX idx_bookings_status ON public.bookings(shop_slug, status);

CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Tabel Rincian Unit per Booking (booking_lines)
CREATE TABLE public.booking_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.rental_items(id) ON DELETE RESTRICT,
  item_name TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  unit_price_per_day NUMERIC NOT NULL CHECK (unit_price_per_day >= 0),
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX idx_booking_lines_booking_id ON public.booking_lines(booking_id);
CREATE INDEX idx_booking_lines_item_id ON public.booking_lines(item_id);

-- Aktifkan RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_lines ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS Bookings:
-- Hanya Owner & Staf toko yang bisa melihat dan mengubah status booking di tokonya.
-- Pelanggan publik membuat booking melalui RPC atomik `create_booking` (SECURITY DEFINER).
DROP POLICY IF EXISTS "bookings_member_select" ON public.bookings;
CREATE POLICY "bookings_member_select" ON public.bookings
  FOR SELECT USING (public.is_shop_member(shop_slug, ARRAY['owner', 'staff']));

DROP POLICY IF EXISTS "bookings_member_update" ON public.bookings;
CREATE POLICY "bookings_member_update" ON public.bookings
  FOR UPDATE
  USING (public.is_shop_member(shop_slug, ARRAY['owner', 'staff']))
  WITH CHECK (public.is_shop_member(shop_slug, ARRAY['owner', 'staff']));

DROP POLICY IF EXISTS "bookings_owner_delete" ON public.bookings;
CREATE POLICY "bookings_owner_delete" ON public.bookings
  FOR DELETE USING (public.is_shop_member(shop_slug, ARRAY['owner']));

DROP POLICY IF EXISTS "booking_lines_member_select" ON public.booking_lines;
CREATE POLICY "booking_lines_member_select" ON public.booking_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND public.is_shop_member(b.shop_slug, ARRAY['owner', 'staff'])
    )
  );

-- Publikasi Realtime untuk bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END;
$$;

-- =========================================================
-- FUNGSI KETERSEDIAAN & RPC BOOKING ATOMIK (ANTI OVERBOOKING)
-- =========================================================

-- Hitung stok tersedia untuk suatu unit pada rentang tanggal [p_start, p_end]
CREATE OR REPLACE FUNCTION public.available_item_qty(
  p_item_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN i.status = 'maintenance' THEN 0
    ELSE GREATEST(
      0,
      i.stock - COALESCE((
        SELECT SUM(bl.qty)::INTEGER
        FROM public.booking_lines bl
        JOIN public.bookings b ON b.id = bl.booking_id
        WHERE bl.item_id = i.id
          AND b.status IN ('confirmed', 'picked_up')
          AND b.start_date <= p_end_date
          AND b.end_date >= p_start_date
      ), 0)
    )
  END
  FROM public.rental_items i
  WHERE i.id = p_item_id;
$$;

-- Ambil daftar ketersediaan seluruh item suatu toko pada rentang tanggal tertentu (bisa dipanggil anon)
CREATE OR REPLACE FUNCTION public.get_shop_availability(
  p_shop_slug TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  item_id UUID,
  available_qty INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    i.id AS item_id,
    public.available_item_qty(i.id, p_start_date, p_end_date) AS available_qty
  FROM public.rental_items i
  WHERE i.shop_slug = p_shop_slug;
$$;

-- RPC Buat Booking Baru (dengan row lock FOR UPDATE untuk mencegah double-booking)
-- p_lines format: [{"item_id": "uuid", "qty": 2}]
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

  -- Generate kode booking unik: SBR-YYMMDD-XXXX
  v_code := 'SBR-' || to_char(CURRENT_DATE, 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

  -- Buat header booking terlebih dahulu
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

  -- Validasi & kunci setiap item secara berurutan
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

    v_subtotal := round(v_item.price_per_day * p_multiplier * v_qty);
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

-- RPC Ubah Status Booking oleh Owner/Staf
CREATE OR REPLACE FUNCTION public.update_booking_status(
  p_booking_id UUID,
  p_new_status TEXT
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
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data booking tidak ditemukan.';
  END IF;

  IF NOT public.is_shop_member(v_booking.shop_slug, ARRAY['owner', 'staff']) THEN
    RAISE EXCEPTION 'Akses Ditolak: Anda bukan pengelola toko ini.';
  END IF;

  IF p_new_status NOT IN ('pending', 'confirmed', 'picked_up', 'returned', 'cancelled') THEN
    RAISE EXCEPTION 'Status booking tidak valid.';
  END IF;

  UPDATE public.bookings
  SET status = p_new_status
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  v_role := public.current_actor_role(v_booking.shop_slug);
  INSERT INTO public.activity_logs (shop_slug, actor_id, actor_role, action)
  VALUES (
    v_booking.shop_slug,
    auth.uid(),
    v_role,
    format('Mengubah status booking %s (%s) menjadi %s', v_booking.code, v_booking.customer_name, upper(p_new_status))
  );

  RETURN v_booking;
END;
$$;

