-- =========================================================
-- MIGRASI 0007: FASE 2 MONETISASI PRO (RPC CEK BOOKING PUBLIK AMAN)
-- =========================================================

-- RPC Pencarian Kode Booking Publik (Tanpa Membuka RLS SELECT Tabel Bookings ke Anon)
-- Menyamarkan nomor telepon penyewa untuk menjaga privasi PII pelanggan
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
    'created_at', v_booking.created_at,
    'booking_lines', v_lines
  );
END;
$$;
