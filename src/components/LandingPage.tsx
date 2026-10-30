'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Store,
  Eye,
  Tent,
  Zap,
  XCircle,
  CheckCircle2,
  Check,
  ShoppingBag,
  UserCheck,
  ShieldCheck,
  MapPin,
  BadgeCheck,
  ChevronDown
} from 'lucide-react';
import { Shop } from '../types';

export interface NewShopFormState {
  name: string;
  tagline: string;
  slug: string;
  whatsapp: string;
  location: string;
  hours: string;
  ownerPin: string;
  staffPin: string;
}

interface LandingPageProps {
  shops: Shop[];
  onSelectShop: (slug: string) => void;
  newShopForm: NewShopFormState;
  setNewShopForm: React.Dispatch<React.SetStateAction<NewShopFormState>>;
  onCreateNewShop: (e: React.FormEvent) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  shops,
  onSelectShop,
  newShopForm,
  setNewShopForm,
  onCreateNewShop,
}) => {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500 selection:text-slate-950">
      {/* NAVBAR LANDING PAGE */}
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center font-black text-base shadow-lg shadow-emerald-500/20">
              ⚡
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">
                Tebar<span className="text-emerald-400">Alat</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                Micro-SaaS Katalog Rental
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#masalah" className="hover:text-emerald-400 transition">Solusi</a>
            <a href="#fitur" className="hover:text-emerald-400 transition">Fitur & Role</a>
            <a href="#demo" className="hover:text-emerald-400 transition">Live Demo</a>
            <a href="#harga" className="hover:text-emerald-400 transition">Harga</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectShop('borneo-rental')}
              className="text-xs font-bold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Coba Demo Toko</span>
            </button>
            <a
              href="#daftar-toko"
              className="hidden sm:inline-flex text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition"
            >
              Buat Katalog Gratis
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:py-20 border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Platform Katalog Sewa #1 untuk WhatsApp & Instagram</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15] text-white">
              Ubah Pertanyaan{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-teal-300">
                &ldquo;Alat Ini Ready Kak?&rdquo;
              </span>{' '}
              Jadi Booking Otomatis di WhatsApp.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Berhenti mengirim PDF berat atau membalas chat satu per satu. Buat tautan katalog rental resmi lengkap dengan indikator status{' '}
              <strong className="text-emerald-400">🟢 Ready</strong>,{' '}
              <strong className="text-rose-400">🔴 Disewa</strong>, kalkulator durasi otomatis, dan sistem PIN khusus untuk staf gudang Anda.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#daftar-toko"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition"
              >
                <span>Buat Katalog Rental Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => onSelectShop('borneo-rental')}
                className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold text-xs sm:text-sm px-5 py-3.5 rounded-2xl flex items-center gap-2 transition"
              >
                <Store className="w-4 h-4 text-emerald-400" />
                <span>Lihat Contoh Katalog Live</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 max-w-lg">
              <div>
                <p className="text-lg sm:text-2xl font-black text-white">30 Detik</p>
                <p className="text-[11px] text-slate-400">Setup Toko Baru</p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-black text-emerald-400">3 Role</p>
                <p className="text-[11px] text-slate-400">Pelanggan, Staf & Owner</p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-black text-white">100% WA</p>
                <p className="text-[11px] text-slate-400">Checkout Tanpa Komisi</p>
              </div>
            </div>
          </div>

          {/* PREVIEW MOCKUP INTERAKTIF DI KANAN HERO */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[11px] font-mono text-slate-400 ml-2">
                    tebaralat.id/borneo-rental
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  Live Preview
                </span>
              </div>

              {/* Mockup Card Item */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase">
                      🟢 TERSEDIA HARI INI (4 UNIT)
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      Tenda Eiger Kapasitas 4-5 Orang
                    </h3>
                    <p className="text-xs text-slate-400">Rp55.000 / hari • Double Layer</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                    <Tent className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-900 rounded-xl p-2.5 border border-slate-800">
                  <div>
                    <span className="text-[10px] font-extrabold text-rose-400 uppercase">
                      🔴 SEDANG DISEWA
                    </span>
                    <h4 className="text-xs font-bold text-slate-200">
                      Genset Silent Inverter 2200W
                    </h4>
                    <p className="text-[11px] text-rose-300">
                      ⏰ Ready kembali: Minggu, 14:00 WITA
                    </p>
                  </div>
                  <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                </div>

                <button
                  onClick={() => onSelectShop('borneo-rental')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <span>Klik untuk Uji Katalog Interaktif</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERBANDINGAN CARA LAMA VS TEBARALAT */}
      <section id="masalah" className="py-16 bg-slate-900/60 border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
              Mengapa Pengusaha Rental Beralih?
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Tinggalkan Cara Manual yang Membuat Admin Kewalahan
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-950 border border-rose-500/25 rounded-3xl p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full">
                <XCircle className="w-4 h-4" />
                <span>Cara Lama (Manual via Chat & PDF)</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Pelanggan terus bertanya &ldquo;Barang X ready gak kak?&rdquo; di jam sibuk.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Kirim brosur PDF/Gambar ukuran besar yang malas dibuka pelanggan.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Staf gudang salah info stok karena catatan di grup WA tertumpuk.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Rawan salah hitung diskon sewa 3 hari atau mingguan.</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 space-y-4 shadow-lg shadow-emerald-500/5">
              <div className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cara Baru dengan TebarAlat</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Pelanggan langsung tahu unit mana yang Ready & kapan unit yang disewa kembali.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Staf gudang cukup tekan 1 tombol di HP saat barang keluar/masuk.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Kalkulator sewa otomatis menghitung total harga & mengirim rincian rapi ke WA.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Tersedia cetak stiker QR fisik untuk ditempel di bodi alat sebagai promosi gratis.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3 ROLE PROFESIONAL */}
      <section id="fitur" className="py-16 border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
              Arsitektur Kelas Bisnis
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Satu Aplikasi, 3 Hak Akses Berbeda (RBAC)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Aman didelegasikan ke karyawan atau penjaga toko tanpa takut harga atau inventaris Anda terhapus.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                1. Role Pelanggan (Publik)
              </span>
              <h3 className="text-base font-extrabold text-white">
                Katalog Bersih Tanpa Login
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pelanggan membuka link di bio IG atau grup WA, melihat stok real-time, memilih durasi sewa, dan langsung mengirim pesanan ke WhatsApp admin.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                2. Role Staf Gudang (PIN Khusus)
              </span>
              <h3 className="text-base font-extrabold text-white">
                Remote Kontrol Stok Keluar/Masuk
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Staf hanya bisa menekan tombol Ready/Disewa/Servis dan mencatat nama peminjam. Tidak bisa menghapus unit, menambah barang, atau mengubah nomor WA toko.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                3. Role Owner (Full Akses)
              </span>
              <h3 className="text-base font-extrabold text-white">
                Kendali Penuh & Audit Log
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Owner dapat menambah/menghapus unit, mengatur tarif sewa, mencetak label QR per unit, serta memantau riwayat perubahan status yang dilakukan staf gudang.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PAKET HARGA (PRICING) */}
      <section id="harga" className="py-16 bg-slate-900/50 border-b border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
              Investasi Super Ringan
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Harga Seharga Segelas Es Kopi per Bulan
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Mulai gratis selamanya, upgrade ke PRO kapan saja saat bisnis rental Anda berkembang.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400">Starter</span>
                  <h3 className="text-2xl font-black text-white mt-1">Rp 0</h3>
                  <p className="text-xs text-slate-400">Gratis selamanya untuk usaha rental rintisan</p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Maksimal 8 unit alat di katalog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Indikator Status 🟢 Ready / 🔴 Disewa Real-Time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Kalkulator Durasi & Checkout langsung ke WhatsApp</span>
                  </li>
                </ul>
              </div>

              <a
                href="#daftar-toko"
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-center text-xs font-extrabold transition"
              >
                Mulai Gratis Sekarang
              </a>
            </div>

            {/* PRO */}
            <div className="bg-linear-to-b from-slate-900 to-slate-950 border-2 border-emerald-500 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-emerald-500/10">
              <span className="absolute -top-3 right-6 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                Paling Laris
              </span>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase text-emerald-400">Bisnis PRO</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <h3 className="text-2xl sm:text-3xl font-black text-white">Rp 19.000</h3>
                    <span className="text-xs text-slate-400">/ bulan</span>
                  </div>
                  <p className="text-xs text-emerald-300/90">Atau hemat Rp 149.000 / tahun</p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Unlimited</strong> unit alat & kategori sewa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Akses Multi-Role:</strong> PIN Staf Gudang & PIN Owner terpisah</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Generator Label QR Fisik</strong> siap cetak untuk bodi unit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Audit Trail Log:</strong> Pantau jam berapa staf mengubah stok</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Lencana <strong>Official Partner</strong> & Bebas Watermark</span>
                  </li>
                </ul>
              </div>

              <a
                href="#daftar-toko"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-center text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition"
              >
                Buka Toko PRO (Uji Coba Gratis)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* REGISTRASI TOKO & DEMO MITRA LIVE */}
      <section id="daftar-toko" className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-10 items-start">
          {/* Form Buat Katalog */}
          <div className="lg:col-span-7 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
                Onboarding 30 Detik
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                Buka Katalog Usaha Rental Anda Sekarang
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Langsung aktif dan siap ditempel ke bio Instagram atau dibagikan ke WhatsApp.
              </p>
            </div>

            <form onSubmit={onCreateNewShop} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Usaha Rental *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Samarinda Kamera & Multimedia"
                  value={newShopForm.name}
                  onChange={(e) => {
                    const nameVal = e.target.value;
                    const autoSlug = nameVal
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, '-')
                      .replace(/-+/g, '-')
                      .replace(/^-|-$/g, '');
                    setNewShopForm({ ...newShopForm, name: nameVal, slug: autoSlug });
                  }}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tautan Katalog Resmi (Slug URL)
                </label>
                <div className="flex items-center bg-slate-100 border border-slate-300 rounded-xl overflow-hidden px-3.5 py-2.5">
                  <span className="text-xs text-slate-400 font-mono">tebaralat.id/</span>
                  <input
                    type="text"
                    required
                    placeholder="samarinda-kamera"
                    value={newShopForm.slug}
                    onChange={(e) => setNewShopForm({ ...newShopForm, slug: e.target.value })}
                    className="w-full text-xs font-bold font-mono bg-transparent text-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Admin *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="628123456789"
                    value={newShopForm.whatsapp}
                    onChange={(e) =>
                      setNewShopForm({ ...newShopForm, whatsapp: e.target.value })
                    }
                    className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kota / Alamat Singkat
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Balikpapan"
                    value={newShopForm.location}
                    onChange={(e) =>
                      setNewShopForm({ ...newShopForm, location: e.target.value })
                    }
                    className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Buat PIN Owner (Full Akses)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={newShopForm.ownerPin}
                    onChange={(e) =>
                      setNewShopForm({ ...newShopForm, ownerPin: e.target.value })
                    }
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Buat PIN Staf Gudang
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={newShopForm.staffPin}
                    onChange={(e) =>
                      setNewShopForm({ ...newShopForm, staffPin: e.target.value })
                    }
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Luncurkan Katalog & Masuk sebagai Owner</span>
              </button>
            </form>
          </div>

          {/* Direktori Demo Mitra & FAQ */}
          <div id="demo" className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    Live Showcase
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    Klik untuk Mencoba Katalog Mitra ({shops.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {shops.map((s) => (
                  <div
                    key={s.slug}
                    onClick={() => onSelectShop(s.slug)}
                    className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-emerald-500 cursor-pointer flex items-center justify-between transition group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                          {s.name}
                        </p>
                        <BadgeCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        <span>{s.location}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-400">/{s.slug}</span>
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                      Buka →
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini FAQ */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
              <h3 className="text-sm font-extrabold text-white">Pertanyaan Umum (FAQ)</h3>
              {[
                {
                  q: 'Apakah penyewa perlu download aplikasi atau login?',
                  a: 'Tidak sama sekali. Penyewa cukup klik link katalog di WhatsApp atau bio Instagram, pilih unit, dan langsung terhubung ke chat WhatsApp admin.'
                },
                {
                  q: 'Bagaimana cara membedakan akses Owner dan Staf Gudang?',
                  a: 'Di bagian bawah katalog terdapat menu Login Internal. Staf masuk dengan PIN Staf (hanya bisa ubah status Ready/Disewa), sedangkan Owner masuk dengan PIN Owner (bisa ubah harga, tambah unit, dan lihat log).'
                },
                {
                  q: 'Apakah ada potongan komisi dari transaksi sewa?',
                  a: 'Rp 0 (Bebas komisi). Seluruh pembayaran sewa dilakukan langsung antara penyewa dan rekening/QRIS toko Anda.'
                }
              ].map((item, idx) => (
                <div key={idx} className="border-b border-slate-800 last:border-none pb-2.5">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="w-full text-left text-xs font-bold text-slate-200 flex items-center justify-between py-1"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition ${
                        openFaq === idx ? 'rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">
              ⚡
            </span>
            <span className="font-bold text-slate-300">TebarAlat Indonesia</span>
          </div>
          <p>© 2026 TebarAlat SaaS. Solusi Katalog Instan UMKM & B2B Rental.</p>
        </div>
      </footer>
    </div>
  );
};

