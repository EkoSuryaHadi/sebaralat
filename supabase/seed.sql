-- =========================================================
-- SEED DATA DEMO SEBARAJA (HANYA UNTUK PENGEMBANGAN / DEMO)
-- Jalankan setelah migrations/0001_init.sql s/d 0004_bookings.sql
-- =========================================================

INSERT INTO public.shops (slug, name, tagline, category_type, location, maps_url, hours, whatsapp, is_verified, plan, terms, partner_shop)
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
  true,
  'PRO',
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
  true,
  'PRO',
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
  '00000000-0000-4000-8000-000000000001',
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
  '00000000-0000-4000-8000-000000000002',
  'borneo-rental',
  'BRN-GNS-02',
  'Genset Silent Inverter 2200W',
  'Alat Teknik/Proyek',
  'zap',
  175000,
  'rented',
  1,
  'Besok, 14:00 WITA',
  'Pak Budi - Proyek Ruko MT Haryono',
  'Staf Gudang',
  '["Tipe Silent (Suara sangat halus)", "BBM Bensin Murni (Hemat konsumsi)", "Output stabil aman untuk alat elektronik"]'::jsonb,
  'from-amber-600 to-orange-800'
),
(
  '00000000-0000-4000-8000-000000000003',
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
  '00000000-0000-4000-8000-000000000004',
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
  '00000000-0000-4000-8000-000000000005',
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
  '00000000-0000-4000-8000-000000000006',
  'borneo-rental',
  'BRN-KMP-06',
  'Kompor Portable Windproof + Gas',
  'Camping',
  'tent',
  30000,
  'maintenance',
  1,
  'Pengecekan katup pengaman',
  'Inspeksi rutin bulanan di gudang',
  'Staf Gudang',
  '["Kelopak pelindung angin terintegrasi", "Sudah termasuk 1 kaleng gas baru", "Box koper plastik keras"]'::jsonb,
  'from-rose-600 to-red-800'
),
(
  '00000000-0000-4000-8000-000000000007',
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
  '00000000-0000-4000-8000-000000000008',
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

-- Catatan Klaim Toko Demo untuk Akun Anda:
-- Setelah Anda login via Magic Link / OTP di aplikasi, jalankan perintah ini di SQL Editor
-- dengan mengganti 'email-anda@domain.com' untuk menjadikan akun Anda sebagai Owner toko demo:
--
-- INSERT INTO public.shop_members (shop_slug, user_id, email, role)
-- SELECT 'borneo-rental', id, email, 'owner' FROM auth.users WHERE email = 'email-anda@domain.com'
-- ON CONFLICT (shop_slug, user_id) DO UPDATE SET role = 'owner';

