'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  ChevronDown,
  Lock,
} from 'lucide-react';
import { Shop } from '../types';
import { ThemeToggle } from '@/components/ThemeToggle';

export interface NewShopFormState {
  name: string;
  tagline: string;
  slug: string;
  whatsapp: string;
  location: string;
  hours: string;
}

interface LandingPageProps {
  shops: Shop[];
  onSelectShop: (slug: string) => void;
  newShopForm: NewShopFormState;
  setNewShopForm: React.Dispatch<React.SetStateAction<NewShopFormState>>;
  onCreateNewShop: (e: React.FormEvent) => void;
  userEmail?: string | null;
  onOpenAuthModal?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  shops,
  onSelectShop,
  newShopForm,
  setNewShopForm,
  onCreateNewShop,
  userEmail,
}) => {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* NAVBAR LANDING PAGE */}
      <header className="sticky top-0 z-30 px-3 sm:px-6 pt-3 sm:pt-4">
        <div className="glass max-w-6xl mx-auto rounded-2xl pl-3 pr-2 sm:pl-5 sm:pr-3 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Image
              src="/logo.svg"
              alt="Sebaraja"
              width={160}
              height={40}
              className="h-7 sm:h-9 w-auto object-contain dark:hidden"
              priority
            />
            <Image
              src="/logo-dark.svg"
              alt="Sebaraja"
              width={160}
              height={40}
              className="h-7 sm:h-9 w-auto object-contain hidden dark:block"
              priority
            />
            <span className="chip hidden lg:inline-flex uppercase tracking-wider text-[10px]">
              Micro-SaaS Katalog Rental
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-muted">
            <a href="#masalah" className="px-3 py-2 rounded-xl hover:text-fg hover:bg-surface-2 transition">Solusi</a>
            <a href="#fitur" className="px-3 py-2 rounded-xl hover:text-fg hover:bg-surface-2 transition">Fitur &amp; Role</a>
            <a href="#demo" className="px-3 py-2 rounded-xl hover:text-fg hover:bg-surface-2 transition">Live Demo</a>
            <a href="#harga" className="px-3 py-2 rounded-xl hover:text-fg hover:bg-surface-2 transition">Harga</a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              href="/login"
              className="btn-glass px-2.5 sm:px-3.5 py-2 text-xs"
            >
              <Lock className="w-3.5 h-3.5 text-accent-text" />
              <span className="hidden sm:inline">{userEmail ? 'Kelola Toko' : 'Masuk'}</span>
            </Link>
            <button
              onClick={() => onSelectShop('borneo-rental')}
              className="btn-glass px-2.5 sm:px-3.5 py-2 text-xs"
            >
              <Eye className="w-3.5 h-3.5 text-accent-text" />
              <span className="hidden sm:inline">Demo Toko</span>
            </button>
            <ThemeToggle />
            <a
              href="#daftar-toko"
              className="btn-brutal px-3 sm:px-4 py-2 text-xs whitespace-nowrap"
            >
              <span className="sm:hidden">Buat Gratis</span>
              <span className="hidden sm:inline">Buat Katalog Gratis</span>
            </a>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden aurora -mt-20 pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div aria-hidden className="grid-lines pointer-events-none absolute inset-0" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="chip animate-rise bg-accent-soft border-accent/30 text-accent-text text-xs">
              <Sparkles className="w-3.5 h-3.5 text-accent-text" />
              <span>Platform Katalog Sewa #1 untuk WhatsApp &amp; Instagram</span>
            </div>

            <h1
              className="animate-rise font-display font-extrabold tracking-tight text-4xl sm:text-6xl leading-[1.02] text-fg"
              style={{ animationDelay: '80ms' }}
            >
              Ubah Pertanyaan{' '}
              <span className="text-gradient">
                &ldquo;Alat Ini Ready Kak?&rdquo;
              </span>{' '}
              Jadi Booking Otomatis di WhatsApp.
            </h1>

            <p
              className="animate-rise text-sm sm:text-base text-muted leading-relaxed max-w-2xl"
              style={{ animationDelay: '160ms' }}
            >
              Berhenti mengirim PDF berat atau membalas chat satu per satu. Buat tautan katalog rental resmi lengkap dengan indikator status{' '}
              <strong className="text-accent-text">🟢 Ready</strong>,{' '}
              <strong className="text-danger-text">🔴 Disewa</strong>, kalkulator durasi otomatis, dan akses login khusus untuk staf gudang Anda.
            </p>

            <div
              className="animate-rise flex flex-wrap items-center gap-3 pt-2"
              style={{ animationDelay: '240ms' }}
            >
              <a
                href="#daftar-toko"
                className="btn-brutal px-6 py-3.5 text-xs sm:text-sm"
              >
                <span>Buat Katalog Rental Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                onClick={() => onSelectShop('borneo-rental')}
                className="btn-glass px-5 py-3.5 text-xs sm:text-sm"
              >
                <Store className="w-4 h-4 text-accent-text" />
                <span>Lihat Contoh Katalog Live</span>
              </button>
            </div>

            <div
              className="animate-rise grid grid-cols-3 gap-2.5 sm:gap-3 pt-2 max-w-lg"
              style={{ animationDelay: '320ms' }}
            >
              <div className="bento p-3 sm:p-4">
                <p className="font-display text-lg sm:text-2xl font-extrabold tracking-tight text-fg">30 Detik</p>
                <p className="text-[11px] text-muted leading-snug">Setup Toko Baru</p>
              </div>
              <div className="bento p-3 sm:p-4 bg-accent-soft border-accent/30">
                <p className="font-display text-lg sm:text-2xl font-extrabold tracking-tight text-accent-text">3 Role</p>
                <p className="text-[11px] text-muted leading-snug">Pelanggan, Staf &amp; Owner</p>
              </div>
              <div className="bento p-3 sm:p-4">
                <p className="font-display text-lg sm:text-2xl font-extrabold tracking-tight text-fg">100% WA</p>
                <p className="text-[11px] text-muted leading-snug">Checkout Tanpa Komisi</p>
              </div>
            </div>
          </div>

          {/* PREVIEW MOCKUP INTERAKTIF DI KANAN HERO */}
          <div className="lg:col-span-5 animate-rise" style={{ animationDelay: '200ms' }}>
            <div className="glass rounded-bento p-3 sm:p-4 space-y-3 lg:rotate-1">
              <div className="flex items-center justify-between gap-2 px-1 pb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger shrink-0"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-warn shrink-0"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0"></span>
                  <span className="text-[11px] font-mono text-muted ml-2 truncate">
                    sebaraja.com/borneo-rental
                  </span>
                </div>
                <span className="chip bg-accent-soft border-accent/30 text-accent-text text-[10px] shrink-0">
                  Live Preview
                </span>
              </div>

              {/* Mockup Card Item */}
              <div className="bento p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-accent-text uppercase">
                      🟢 TERSEDIA HARI INI (4 UNIT)
                    </span>
                    <h3 className="text-sm font-bold text-fg mt-0.5">
                      Tenda Eiger Kapasitas 4-5 Orang
                    </h3>
                    <p className="text-xs text-muted">Rp55.000 / hari • Double Layer</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent/30 flex items-center justify-center shrink-0">
                    <Tent className="w-6 h-6 text-accent-text" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 bg-danger-soft rounded-2xl p-3 border border-danger/30">
                  <div>
                    <span className="text-[10px] font-extrabold text-danger-text uppercase">
                      🔴 SEDANG DISEWA
                    </span>
                    <h4 className="text-xs font-bold text-fg">
                      Genset Silent Inverter 2200W
                    </h4>
                    <p className="text-[11px] text-danger-text">
                      ⏰ Ready kembali: Minggu, 14:00 WITA
                    </p>
                  </div>
                  <Zap className="w-5 h-5 text-warn-text shrink-0" />
                </div>

                <button
                  onClick={() => onSelectShop('borneo-rental')}
                  className="w-full py-2.5 bg-accent hover:bg-accent-strong text-accent-fg text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>Klik untuk Uji Katalog Interaktif</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERBANDINGAN CARA LAMA VS SEBARAJA */}
      <section id="masalah" className="py-16 sm:py-20 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4">
            <div className="bento md:col-span-6 p-6 sm:p-8 text-center bg-surface-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-accent-text">
                Mengapa Pengusaha Rental Beralih?
              </span>
              <h2 className="font-display font-extrabold tracking-tight text-2xl sm:text-4xl text-fg mt-2 max-w-2xl mx-auto">
                Tinggalkan Cara Manual yang Membuat Admin Kewalahan
              </h2>
            </div>

            <div className="bento md:col-span-3 p-6 sm:p-7 space-y-4 border-danger/30">
              <div className="chip bg-danger-soft border-danger/30 text-danger-text text-xs">
                <XCircle className="w-4 h-4" />
                <span>Cara Lama (Manual via Chat &amp; PDF)</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-muted">
                <li className="flex items-start gap-2.5">
                  <span className="text-danger-text font-bold">✕</span>
                  <span>Pelanggan terus bertanya &ldquo;Barang X ready gak kak?&rdquo; di jam sibuk.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-danger-text font-bold">✕</span>
                  <span>Kirim brosur PDF/Gambar ukuran besar yang malas dibuka pelanggan.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-danger-text font-bold">✕</span>
                  <span>Staf gudang salah info stok karena catatan di grup WA tertumpuk.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-danger-text font-bold">✕</span>
                  <span>Rawan salah hitung diskon sewa 3 hari atau mingguan.</span>
                </li>
              </ul>
            </div>

            <div className="bento md:col-span-3 p-6 sm:p-7 space-y-4 border-accent/40 bg-accent-soft">
              <div className="chip bg-surface border-accent/30 text-accent-text text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cara Baru dengan Sebaraja</span>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-fg-soft">
                <li className="flex items-start gap-2.5">
                  <span className="text-accent-text font-bold">✓</span>
                  <span>Pelanggan langsung tahu unit mana yang Ready &amp; kapan unit yang disewa kembali.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-accent-text font-bold">✓</span>
                  <span>Staf gudang cukup tekan 1 tombol di HP saat barang keluar/masuk.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-accent-text font-bold">✓</span>
                  <span>Kalkulator sewa otomatis menghitung total harga &amp; mengirim rincian rapi ke WA.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-accent-text font-bold">✓</span>
                  <span>Tersedia cetak stiker QR fisik untuk ditempel di bodi alat sebagai promosi gratis.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3 ROLE PROFESIONAL */}
      <section id="fitur" className="py-16 sm:py-20 scroll-mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4">
            {/* Header tile */}
            <div className="bento md:col-span-4 p-6 sm:p-8 flex flex-col justify-end min-h-45 overflow-hidden">
              <div aria-hidden className="aurora pointer-events-none absolute inset-0 rounded-bento opacity-80" />
              <div className="relative space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-accent-text">
                  Arsitektur Kelas Bisnis
                </span>
                <h2 className="font-display font-extrabold tracking-tight text-2xl sm:text-4xl text-fg">
                  Satu Aplikasi, 3 Hak Akses Berbeda (RBAC)
                </h2>
                <p className="text-xs sm:text-sm text-muted max-w-xl">
                  Aman didelegasikan ke karyawan atau penjaga toko tanpa takut harga atau inventaris Anda terhapus.
                </p>
              </div>
            </div>

            {/* Mini tile: status real-time */}
            <div className="bento bento-hover md:col-span-2 p-6 flex flex-col justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <span className="chip bg-accent-soft border-accent/30 text-accent-text">🟢 Ready</span>
                <span className="chip bg-danger-soft border-danger/30 text-danger-text">🔴 Disewa</span>
              </div>
              <p className="font-display text-lg font-extrabold tracking-tight text-fg leading-tight">
                Indikator Status Real-Time
              </p>
            </div>

            {/* Role 1 */}
            <div className="bento bento-hover md:col-span-3 md:row-span-2 p-6 sm:p-7 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent/30 flex items-center justify-center text-accent-text">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent-text">
                1. Role Pelanggan (Publik)
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-fg">
                Katalog Bersih Tanpa Login
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Pelanggan membuka link di bio IG atau grup WA, melihat stok real-time, memilih durasi sewa, dan langsung mengirim pesanan ke WhatsApp admin.
              </p>
              <div className="mt-auto pt-3 flex items-center gap-2 text-[11px] font-mono text-muted">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                <span className="truncate">sebaraja.com/borneo-rental</span>
              </div>
            </div>

            {/* Role 2 */}
            <div className="bento bento-hover md:col-span-3 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-warn-soft border border-warn/30 flex items-center justify-center text-warn-text shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-warn-text">
                  2. Role Staf Gudang (Akses Terbatas)
                </span>
              </div>
              <h3 className="font-display text-lg font-extrabold tracking-tight text-fg">
                Remote Kontrol Stok Keluar/Masuk
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Staf hanya bisa menekan tombol Ready/Disewa/Servis dan mencatat nama peminjam. Tidak bisa menghapus unit, menambah barang, atau mengubah nomor WA toko.
              </p>
            </div>

            {/* Role 3 */}
            <div className="bento bento-hover md:col-span-3 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-info-soft border border-info/30 flex items-center justify-center text-info-text shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-info-text">
                  3. Role Owner (Full Akses)
                </span>
              </div>
              <h3 className="font-display text-lg font-extrabold tracking-tight text-fg">
                Kendali Penuh &amp; Audit Log
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Owner dapat menambah/menghapus unit, mengatur tarif sewa, mencetak label QR per unit, serta memantau riwayat perubahan status yang dilakukan staf gudang.
              </p>
            </div>

            {/* Mini tiles */}
            <div className="bento bento-hover md:col-span-2 p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-accent-text shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-fg leading-snug">Kalkulator Durasi &amp; Checkout langsung ke WhatsApp</p>
            </div>
            <div className="bento bento-hover md:col-span-2 p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-accent-text shrink-0">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-fg leading-snug">Generator Label QR Fisik siap cetak untuk bodi unit</p>
            </div>
            <div className="bento md:col-span-2 p-5 flex items-center justify-between gap-3 bg-pop border-ink/20">
              <p className="font-display text-2xl font-extrabold tracking-tight text-[#0c110f] leading-none">Rp 0</p>
              <p className="text-xs font-bold text-[#0c110f]/80 text-right leading-snug">Bebas komisi dari transaksi sewa</p>
            </div>
          </div>
        </div>
      </section>

      {/* PAKET HARGA (PRICING) */}
      <section id="harga" className="py-16 sm:py-20 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-accent-text">
              Investasi Super Ringan
            </span>
            <h2 className="font-display font-extrabold tracking-tight text-2xl sm:text-4xl text-fg">
              Harga Seharga Segelas Es Kopi per Bulan
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              Mulai gratis selamanya, upgrade ke PRO kapan saja saat bisnis rental Anda berkembang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5 max-w-4xl mx-auto items-stretch">
            {/* Starter */}
            <div className="bento md:col-span-3 p-6 sm:p-7 flex flex-col justify-between gap-6">
              <div className="space-y-5">
                <div>
                  <span className="chip uppercase">Starter</span>
                  <h3 className="font-display text-4xl font-extrabold tracking-tight text-fg mt-3">Rp 0</h3>
                  <p className="text-xs text-muted mt-1">Gratis selamanya untuk usaha rental rintisan</p>
                </div>
                <ul className="space-y-2.5 text-xs text-fg-soft">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent-text shrink-0" />
                    <span>Maksimal 8 unit alat di katalog</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent-text shrink-0" />
                    <span>Indikator Status 🟢 Ready / 🔴 Disewa Real-Time</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent-text shrink-0" />
                    <span>Kalkulator Durasi &amp; Checkout langsung ke WhatsApp</span>
                  </li>
                </ul>
              </div>

              <a
                href="#daftar-toko"
                className="btn-glass w-full py-3 text-xs"
              >
                Mulai Gratis Sekarang
              </a>
            </div>

            {/* PRO */}
            <div className="bento md:col-span-3 p-6 sm:p-7 flex flex-col justify-between gap-6 border-2 border-ink shadow-[6px_6px_0_0_var(--ink)]">
              <span className="absolute -top-3 right-6 bg-pop text-[#0c110f] border-2 border-ink text-[10px] font-black uppercase px-3 py-1 rounded-full">
                Paling Laris
              </span>
              <div className="space-y-5">
                <div>
                  <span className="chip uppercase bg-accent-soft border-accent/30 text-accent-text">Bisnis PRO</span>
                  <div className="flex items-baseline gap-1 mt-3">
                    <h3 className="font-display text-4xl font-extrabold tracking-tight text-fg">Rp 23.000</h3>
                    <span className="text-xs text-muted">/ bulan</span>
                  </div>
                  <p className="text-xs text-accent-text mt-1">Atau hemat Rp 149.000 / tahun</p>
                </div>
                <ul className="space-y-2.5 text-xs text-fg-soft">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent-text shrink-0" />
                    <span><strong>Unlimited</strong> unit alat &amp; kategori sewa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent-text shrink-0" />
                    <span><strong>Akses Multi-Role:</strong> Login Email Magic Link / OTP untuk Staf &amp; Owner</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent-text shrink-0" />
                    <span><strong>Generator Label QR Fisik</strong> siap cetak untuk bodi unit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent-text shrink-0" />
                    <span><strong>Audit Trail Log:</strong> Pantau jam berapa staf mengubah stok</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent-text shrink-0" />
                    <span>Lencana <strong>Official Partner</strong> &amp; Bebas Watermark</span>
                  </li>
                </ul>
              </div>

              <a
                href="#daftar-toko"
                className="btn-brutal btn-brutal-accent w-full py-3 text-xs"
              >
                Buka Toko PRO (Uji Coba Gratis)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* REGISTRASI TOKO & DEMO MITRA LIVE */}
      <section id="daftar-toko" className="relative py-16 sm:py-20 scroll-mt-24 aurora">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-4 md:gap-5 items-start">
          {/* Form Buat Katalog */}
          <div className="lg:col-span-7 bento p-6 sm:p-8 space-y-5">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent-text">
                Onboarding 30 Detik
              </span>
              <h2 className="font-display font-extrabold tracking-tight text-2xl sm:text-3xl text-fg mt-1">
                Buka Katalog Usaha Rental Anda Sekarang
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-1">
                Langsung aktif dan siap ditempel ke bio Instagram atau dibagikan ke WhatsApp.
              </p>
            </div>

            <form onSubmit={onCreateNewShop} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-fg-soft mb-1.5">
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
                  className="field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-fg-soft mb-1.5">
                  Tautan Katalog Resmi (Slug URL)
                </label>
                <div className="field flex items-center gap-0.5 bg-surface-2 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-soft)]">
                  <span className="text-xs text-subtle font-mono shrink-0">sebaraja.com/</span>
                  <input
                    type="text"
                    required
                    placeholder="samarinda-kamera"
                    value={newShopForm.slug}
                    onChange={(e) => setNewShopForm({ ...newShopForm, slug: e.target.value })}
                    className="w-full min-w-0 text-xs font-bold font-mono bg-transparent text-accent-text placeholder:text-subtle focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fg-soft mb-1.5">
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
                    className="field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-fg-soft mb-1.5">
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
                    className="field"
                  />
                </div>
              </div>

              <div className="bg-accent-soft border border-accent/30 rounded-2xl p-3.5 text-xs text-fg flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-bold block wrap-break-word">
                    {userEmail
                      ? `Terhubung sebagai: ${userEmail}`
                      : 'Akun Owner Terlindungi Supabase Auth'}
                  </span>
                  <span className="text-[11px] text-muted">
                    {userEmail
                      ? 'Toko baru akan langsung terikat ke akun email Anda.'
                      : 'Sudah punya akun? Masuk untuk mengelola atau mengklaim toko Anda.'}
                  </span>
                </div>
                {!userEmail && (
                  <Link
                    href="/login?redirect=/#daftar-toko"
                    className="btn-glass shrink-0 px-3 py-2 text-[11px]"
                  >
                    <Lock className="w-3 h-3 text-accent-text" />
                    <span>Masuk</span>
                  </Link>
                )}
              </div>

              <button
                type="submit"
                className="btn-brutal w-full py-3.5 text-xs sm:text-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Luncurkan Katalog &amp; Masuk sebagai Owner</span>
              </button>
            </form>
          </div>

          {/* Direktori Demo Mitra & FAQ */}
          <div id="demo" className="lg:col-span-5 space-y-4 md:space-y-5 scroll-mt-24">
            <div className="bento p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent-text">
                    Live Showcase
                  </span>
                  <h3 className="font-display text-lg font-extrabold tracking-tight text-fg">
                    Klik untuk Mencoba Katalog Mitra ({shops.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {shops.map((s) => (
                  <div
                    key={s.slug}
                    onClick={() => onSelectShop(s.slug)}
                    className="bg-surface-2 p-4 rounded-2xl border border-line hover:border-accent hover:-translate-y-0.5 cursor-pointer flex items-center justify-between gap-3 transition group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-fg group-hover:text-accent-text transition truncate">
                          {s.name}
                        </p>
                        <BadgeCheck className="w-4 h-4 text-accent-text shrink-0" />
                      </div>
                      <p className="text-[11px] text-muted flex items-center gap-1.5 mt-1 flex-wrap">
                        <MapPin className="w-3 h-3 text-accent-text" />
                        <span>{s.location}</span>
                        <span>•</span>
                        <span className="font-mono text-accent-text">/{s.slug}</span>
                      </p>
                    </div>
                    <span className="text-xs font-bold text-accent-text bg-accent-soft px-3 py-1.5 rounded-xl border border-accent/30 shrink-0">
                      Buka →
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini FAQ */}
            <div className="bento p-6 space-y-3">
              <h3 className="font-display text-lg font-extrabold tracking-tight text-fg">Pertanyaan Umum (FAQ)</h3>
              <div className="space-y-2">
                {[
                  {
                    q: 'Apakah penyewa perlu download aplikasi atau login?',
                    a: 'Tidak sama sekali. Penyewa cukup klik link katalog di WhatsApp atau bio Instagram, pilih unit, dan langsung terhubung ke chat WhatsApp admin.'
                  },
                  {
                    q: 'Bagaimana cara membedakan akses Owner dan Staf Gudang?',
                    a: 'Pengelola dapat masuk melalui halaman Login (/login) atau tombol pengelola di katalog. Hak akses diverifikasi aman via Supabase Auth (Magic Link & OTP email) sesuai peran Owner atau Staf Gudang.'
                  },
                  {
                    q: 'Apakah ada potongan komisi dari transaksi sewa?',
                    a: 'Rp 0 (Bebas komisi). Seluruh pembayaran sewa dilakukan langsung antara penyewa dan rekening/QRIS toko Anda.'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border transition ${
                      openFaq === idx ? 'bg-surface-2 border-line-strong' : 'bg-surface border-line'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                      className="w-full text-left text-xs sm:text-sm font-bold text-fg flex items-center justify-between gap-3 px-4 py-3 cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted shrink-0 transition ${
                          openFaq === idx ? 'rotate-180 text-accent-text' : ''
                        }`}
                      />
                    </button>
                    {openFaq === idx && (
                      <p className="text-xs text-muted leading-relaxed px-4 pb-4 -mt-1">
                        {item.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-3 sm:px-6 pb-6 text-xs text-muted">
        <div className="bento max-w-6xl mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Sebaraja" width={120} height={30} className="h-6 w-auto object-contain dark:hidden" />
            <Image src="/logo-dark.svg" alt="Sebaraja" width={120} height={30} className="h-6 w-auto object-contain hidden dark:block" />
            <span className="font-bold text-fg-soft">Sebaraja Indonesia</span>
          </div>
          <p>© 2026 Sebaraja SaaS. Solusi Katalog Instan UMKM &amp; B2B Rental.</p>
        </div>
      </footer>
    </div>
  );
};
