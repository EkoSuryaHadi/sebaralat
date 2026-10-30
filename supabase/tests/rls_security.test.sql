-- =========================================================
-- PENGUJIAN OTOMATIS KEAMANAN RLS & BOOKING (pgTAP / SQL Test)
-- Jalankan dengan `supabase test db` atau langsung di SQL Editor dalam blok transaksi
-- =========================================================

BEGIN;
SELECT plan(10);

-- 1. Pastikan RLS aktif di semua tabel publik utama
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.shops'::regclass),
  'RLS wajib aktif pada tabel public.shops'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.rental_items'::regclass),
  'RLS wajib aktif pada tabel public.rental_items'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.shop_members'::regclass),
  'RLS wajib aktif pada tabel public.shop_members'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.activity_logs'::regclass),
  'RLS wajib aktif pada tabel public.activity_logs'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.bookings'::regclass),
  'RLS wajib aktif pada tabel public.bookings'
);

-- 2. Pastikan kolom owner_pin dan staff_pin sudah dihapus dari tabel shops
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'shops'
      AND column_name IN ('owner_pin', 'staff_pin')
  ),
  'Kolom owner_pin dan staff_pin tidak boleh ada di tabel shops'
);

-- 3. Simulasi role anon: tidak boleh menghapus atau menambah unit rental
SET LOCAL ROLE anon;

SELECT throws_ok(
  $$INSERT INTO public.rental_items (shop_slug, sku, name, category, price_per_day, stock)
    VALUES ('borneo-rental', 'HACK-01', 'Unit Ilegal', 'Camping', 50000, 1)$$,
  NULL,
  'Anon dilarang melakukan INSERT ke rental_items'
);

-- 4. Simulasi role anon: tidak boleh menyisipkan log audit palsu
SELECT throws_ok(
  $$INSERT INTO public.activity_logs (shop_slug, actor_role, action)
    VALUES ('borneo-rental', 'Owner Toko', 'Log Palsu')$$,
  NULL,
  'Anon dilarang melakukan INSERT ke activity_logs'
);

-- 5. Simulasi role anon: tidak boleh membaca activity_logs internal
SELECT is(
  (SELECT count(*)::int FROM public.activity_logs),
  0,
  'Anon tidak boleh membaca baris activity_logs internal'
);

-- 6. Simulasi role anon: tidak boleh membuat booking untuk tanggal di masa lalu
SELECT throws_ok(
  $$SELECT public.create_booking(
      'borneo-rental',
      'Pelanggan Uji',
      '6281234567890',
      CURRENT_DATE - 2,
      2,
      2,
      '[{"item_id": "00000000-0000-4000-8000-000000000001", "qty": 1}]'::jsonb
    )$$,
  'Tanggal mulai sewa tidak boleh di masa lalu.',
  'Booking tanggal masa lalu wajib ditolak'
);

SELECT * FROM finish();
ROLLBACK;

