-- =========================================================
-- SKEMA DATABASE SUPABASE: SEBARAJA (MICRO-SAAS RENTAL)
-- Jalankan skrip ini di SQL Editor pada Dashboard Supabase Anda
-- =========================================================

-- 1. Tabel Mitra Toko Rental (shops)
CREATE TABLE IF NOT EXISTS public.shops (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT DEFAULT '',
    category_type TEXT DEFAULT 'Umum',
    location TEXT NOT NULL,
    maps_url TEXT DEFAULT '',
    hours TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    owner_pin TEXT DEFAULT '1234',
    staff_pin TEXT DEFAULT '0000',
    is_verified BOOLEAN DEFAULT true,
    plan TEXT DEFAULT 'PRO',
    owner_id TEXT DEFAULT 'demo-owner',
    terms JSONB DEFAULT '[]'::jsonb,
    partner_shop JSONB,
    logo_url TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Unit Alat Sewa (rental_items)
CREATE TABLE IF NOT EXISTS public.rental_items (
    id TEXT PRIMARY KEY,
    shop_slug TEXT NOT NULL REFERENCES public.shops(slug) ON DELETE CASCADE,
    sku TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    icon_type TEXT NOT NULL DEFAULT 'tent',
    price_per_day NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
    stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
    available_at TEXT DEFAULT '',
    renter_note TEXT DEFAULT '',
    last_updated_by TEXT DEFAULT 'Owner',
    specs JSONB DEFAULT '[]'::jsonb,
    image_bg TEXT DEFAULT 'from-emerald-600 to-teal-800',
    image_url TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Log Audit Aktivitas Internal (activity_logs)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    shop_slug TEXT NOT NULL REFERENCES public.shops(slug) ON DELETE CASCADE,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indeks performa pencarian slug
CREATE INDEX IF NOT EXISTS idx_rental_items_shop_slug ON public.rental_items(shop_slug);
CREATE INDEX IF NOT EXISTS idx_activity_logs_shop_slug ON public.activity_logs(shop_slug);

-- =========================================================
-- AKTIFKAN FITUR REALTIME
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses: Publik dapat membaca (SELECT) katalog
CREATE POLICY "Public Read Access for Shops" ON public.shops
    FOR SELECT USING (true);

CREATE POLICY "Public Read Access for Rental Items" ON public.rental_items
    FOR SELECT USING (true);

CREATE POLICY "Public Read Access for Activity Logs" ON public.activity_logs
    FOR SELECT USING (true);

-- Kebijakan Manajemen: Diizinkan untuk aplikasi (anon & auth)
CREATE POLICY "Public Insert/Update Access for Shops" ON public.shops
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public Insert/Update Access for Rental Items" ON public.rental_items
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public Insert/Update Access for Activity Logs" ON public.activity_logs
    FOR ALL USING (true) WITH CHECK (true);

-- =========================================================
-- SEED DATA AWAL (DEMO TOKO & UNIT)
-- =========================================================
INSERT INTO public.shops (slug, name, tagline, category_type, location, maps_url, hours, whatsapp, owner_pin, staff_pin, is_verified, plan, owner_id, terms, partner_shop)
VALUES 
(
    'borneo-rental',
    'Borneo Outdoor & Teknik Rental',
    'Pusat Sewa Alat Camping & Proyek Terlengkap di Balikpapan',
    'Outdoor & Teknik',
    'Jl. MT Haryono, Balikpapan Selatan',
    'https://maps.google.com',
    '08.00 - 21.00 WITA',
    '6281234567890',
    '1234',
    '0000',
    true,
    'PRO',
    'demo-owner',
    '[
      "Wajib meninggalkan E-KTP asli domisili aktif sebagai jaminan.",
      "Pelunasan dilakukan saat pengambilan unit (Tersedia QRIS & Transfer Bank).",
      "Keterlambatan pengembalian dikenakan denda 10% per jam dari tarif harian.",
      "Segala bentuk kerusakan akibat kelalaian pemakaian menjadi tanggung jawab penyewa."
    ]'::jsonb,
    '{"name": "Kaltim Pro Kamera & Multimedia", "slug": "kaltim-kamera"}'::jsonb
),
(
    'kaltim-kamera',
    'Kaltim Pro Kamera & Multimedia',
    'Sewa Kamera Mirrorless, Lensa, Lighting & Gimbal Profesional',
    'Kamera & Multimedia',
    'Balikpapan Tengah, Kalimantan Timur',
    'https://maps.google.com',
    '09.00 - 22.00 WITA',
    '6281298765432',
    '1234',
    '0000',
    true,
    'PRO',
    'demo-owner-2',
    '[
      "Wajib menunjukkan minimal 2 identitas aktif yang sesuai (E-KTP + SIM/NPWP/ID Kerja).",
      "Booking jadwal tanggal wajib DP minimal 30% melalui QRIS resmi toko."
    ]'::jsonb,
    '{"name": "Borneo Outdoor & Teknik Rental", "slug": "borneo-rental"}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.rental_items (id, shop_slug, sku, name, category, icon_type, price_per_day, status, stock, available_at, renter_note, last_updated_by, specs, image_bg)
VALUES
(
    'item-1',
    'borneo-rental',
    'BRN-TND-01',
    'Tenda Eiger Kapasitas 4-5 Orang',
    'Camping',
    'tent',
    55000,
    'available',
    4,
    '',
    '',
    'Owner',
    '["Double layer waterproof tahan badai", "Frame alloy ringan + pasak lengkap", "Dimensi 210 x 240 cm + Vestibule"]'::jsonb,
    'from-emerald-600 to-teal-800'
),
(
    'item-2',
    'borneo-rental',
    'BRN-GNS-02',
    'Genset Silent Inverter 2200W',
    'Alat Teknik/Proyek',
    'zap',
    175000,
    'rented',
    0,
    'Minggu, 1 Nov (14:00)',
    'Pak Budi - Proyek Ruko MT Haryono',
    'Staf Gudang',
    '["Tipe Silent (Suara sangat halus)", "BBM Bensin Murni (Hemat konsumsi)", "Output stabil aman untuk alat elektronik"]'::jsonb,
    'from-amber-600 to-orange-800'
),
(
    'item-3',
    'borneo-rental',
    'BRN-JCK-03',
    'Jackhammer / Mesin Bobok Beton PH65',
    'Alat Teknik/Proyek',
    'hammer',
    120000,
    'available',
    2,
    '',
    '',
    'Owner',
    '["Daya 1240W impact tinggi", "Termasuk 2 mata pahat baja (lancip & pipih)", "Koper besi + kabel ekstensi 10 meter"]'::jsonb,
    'from-slate-700 to-slate-900'
),
(
    'item-4',
    'borneo-rental',
    'BRN-CAM-04',
    'Kamera Mirrorless Sony A6400 + Kit',
    'Kamera & Audio',
    'camera',
    150000,
    'available',
    1,
    '',
    '',
    'Owner',
    '["Sensor 24MP & Perekaman 4K HDR", "Include 2 Baterai + SD Card 64GB Extreme", "Tas pelindung + Charger dual slot"]'::jsonb,
    'from-indigo-600 to-purple-800'
),
(
    'item-5',
    'borneo-rental',
    'BRN-HT-05',
    'Paket 4 Unit HT (Handy Talky) Event',
    'Kamera & Audio',
    'radio',
    80000,
    'available',
    3,
    '',
    '',
    'Owner',
    '["1 Paket berisi 4 unit HT + Earpiece", "Jangkauan 2-3 KM area terbuka", "Baterai awet hingga 18 jam operasional"]'::jsonb,
    'from-blue-600 to-cyan-800'
),
(
    'item-6',
    'borneo-rental',
    'BRN-KMP-06',
    'Kompor Portable Windproof + Gas',
    'Camping',
    'tent',
    30000,
    'maintenance',
    0,
    'Pengecekan katup pengaman',
    'Inspeksi rutin bulanan di gudang',
    'Staf Gudang',
    '["Kelopak pelindung angin terintegrasi", "Sudah termasuk 1 kaleng gas baru", "Box koper plastik keras"]'::jsonb,
    'from-rose-600 to-red-800'
),
(
    'item-7',
    'kaltim-kamera',
    'KLT-SNY-01',
    'Sony A7III Fullframe + Tamron 28-75mm',
    'Kamera & Audio',
    'camera',
    275000,
    'available',
    2,
    '',
    '',
    'Owner',
    '["Full Frame Sensor 24MP Lowlight", "Lensa bukaan konstan f/2.8 tajam", "2 Baterai FZ100 + SD Card 128GB"]'::jsonb,
    'from-indigo-600 to-violet-900'
),
(
    'item-8',
    'kaltim-kamera',
    'KLT-DJI-02',
    'Stabilizer Gimbal DJI RS3 Mini',
    'Kamera & Audio',
    'zap',
    110000,
    'available',
    1,
    '',
    '',
    'Owner',
    '["Native Vertical & Horizontal Shooting", "Beban maksimal 2 Kg", "Baterai tahan 10 jam"]'::jsonb,
    'from-cyan-600 to-blue-900'
)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 5. KONFIGURASI SUPABASE STORAGE (Opsional untuk Foto Unit)
-- =========================================================
-- Buat bucket penyimpanan foto publik 'item-images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Kebijakan Akses Storage: Publik dapat melihat foto
CREATE POLICY "Public Access for Item Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images');

-- Kebijakan Akses Storage: Izinkan upload foto unit
CREATE POLICY "Public Upload Access for Item Images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'item-images');


