# Sebaraja ⚡

Platform Micro-SaaS katalog persewaan alat & perlengkapan instan untuk WhatsApp dan media sosial (Instagram, TikTok).

## ✨ Fitur Utama

- **Katalog Publik Real-Time**: Status unit sewa (🟢 Ready, 🔴 Disewa, 🟡 Perawatan) terpampang jelas dan tersinkronisasi realtime via Supabase.
- **Kalkulator Durasi Otomatis**: Menghitung paket sewa (1 hari, 2 hari, 3 hari, 1 minggu) beserta estimasi diskon.
- **Checkout WhatsApp Terstruktur**: Format pengajuan sewa otomatis dan rapi dikirimkan langsung ke nomor WhatsApp admin toko tanpa potongan komisi.
- **Multi-Role Access Control (RBAC)**:
  - **Pelanggan (Publik)**: Akses katalog tanpa perlu login atau install aplikasi.
  - **Staf Gudang (PIN Khusus)**: Mode operasional cepat (1-tap status switch Ready/Disewa & atur stok keluar/masuk).
  - **Owner Toko (Full Akses)**: Manajemen inventaris, atur harga, kelola profil WhatsApp toko, dan cetak stiker QR fisik.
- **Dynamic Store Routing (`/[slug]`)**: Setiap mitra toko memiliki tautan resmi sendiri (contoh: `sebaraja.com/borneo-rental`) dengan metadata SEO otomatis.
- **Generator Label QR Fisik**: Stiker QR siap cetak yang dapat ditempel di bodi unit fisik untuk memudahkan penyewa cek ketersediaan kembali.

---

## 🛠️ Stack Teknologi

- **Framework**: [Next.js](https://nextjs.org/) (App Router dengan Turbopack)
- **UI & Styling**: React 19, [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Database & Realtime**: [Supabase](https://supabase.com/) (PostgreSQL + Realtime WebSocket) dengan fallback otomatis ke Local State Mode jika tanpa kredensial
- **Language**: TypeScript (`strict: true`)

---

## 🚀 Memulai Pengembangan

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Database Supabase (Opsional)
1. Buat project baru di [Supabase](https://supabase.com/).
2. Buka **SQL Editor** di dashboard Supabase, lalu salin dan jalankan seluruh isi file:
   👉 [`supabase/schema.sql`](./supabase/schema.sql)
3. Salin file `.env.example` ke `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Masukkan URL & Anon Key dari Supabase ke `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
*(Catatan: Aplikasi tetap berjalan 100% normal dalam Demo/Local Mode jika kredensial belum diisi)*

### 3. Jalankan Server Dev
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### 4. Build Produksi & Typecheck
```bash
npm run build
npm run lint
```

---

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── [slug]/page.tsx      # Dynamic Route toko rental dengan SEO Metadata & Suspense
│   ├── globals.css          # Tailwind CSS v4 setup & theme variables
│   ├── layout.tsx           # Root layout dengan font Geist & metadata Indonesia
│   └── page.tsx             # Halaman utama (App Orchestrator)
├── components/
│   ├── AddItemModal.tsx     # Modal tambah unit inventaris baru
│   ├── AuthModal.tsx        # Modal autentikasi PIN Staf & Owner
│   ├── CatalogView.tsx      # Tampilan katalog pelanggan & keranjang WhatsApp
│   ├── LandingPage.tsx      # Landing page komersial SaaS, harga & onboarding
│   ├── QrModal.tsx          # Modal cetak stiker QR fisik unit
│   ├── RoleBar.tsx          # Top bar navigasi role internal
│   ├── WaPreviewModal.tsx   # Modal preview pesan WhatsApp sebelum kirim
│   └── WorkspaceView.tsx    # Dashboard operasional staf gudang & owner
├── data/
│   └── mockData.ts          # Seed data default toko, unit sewa & opsi durasi
├── lib/
│   └── supabase.ts          # Inisialisasi Supabase Client, DbRow types & mappers
└── types/
    └── index.ts             # Definisi tipe data TypeScript lengkap
supabase/
└── schema.sql               # Skrip DDL PostgreSQL + RLS + Realtime Publication
```
