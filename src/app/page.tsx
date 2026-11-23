import React from 'react';
import { AppShell } from '@/components/AppShell';
import { getPublicSiteOrigin } from '@/lib/validators';

const SITE_ORIGIN = getPublicSiteOrigin();

const HOME_JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Sebaraja',
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/logo-icon.svg`,
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Sebaraja',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE_ORIGIN,
      description:
        'Platform katalog rental online instan untuk WhatsApp & Instagram dengan cek stok kalender, kalkulator diskon durasi otomatis, QRIS, dan panel staf gudang.',
      offers: [
        {
          '@type': 'Offer',
          name: 'Paket Starter',
          price: '0',
          priceCurrency: 'IDR',
        },
        {
          '@type': 'Offer',
          name: 'Paket Bisnis PRO',
          price: '23000',
          priceCurrency: 'IDR',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Apakah penyewa perlu download aplikasi atau login?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tidak sama sekali. Penyewa cukup klik link katalog di WhatsApp atau bio Instagram, pilih unit, dan langsung terhubung ke chat WhatsApp admin.',
          },
        },
        {
          '@type': 'Question',
          name: 'Bagaimana cara membedakan akses Owner dan Staf Gudang?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pengelola dapat masuk melalui halaman Login (/login) atau tombol pengelola di katalog. Hak akses diverifikasi aman via Supabase Auth (Magic Link & OTP email) sesuai peran Owner atau Staf Gudang.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah uang sewa & DP masuk ke Sebaraja dulu? Ada komisi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Rp 0 (Bebas komisi). Seluruh pembayaran sewa & DP ditransfer langsung ke rekening atau QRIS toko Anda sendiri yang dapat diunggah di Pengaturan Toko.',
          },
        },
        {
          '@type': 'Question',
          name: 'Bagaimana jika ada penyewa yang datang langsung ke toko (Walk-in)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Staf atau Owner cukup menekan tombol "+ Catat Sewa Walk-in" di Panel Kerja. Transaksi otomatis berstatus Picked Up, memotong stok kalender, mencetak nota, dan masuk ke laporan Omzet.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah diskon sewa mingguan bisa diatur sendiri atau dinonaktifkan?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ya! Di Pengaturan Toko, Owner dapat mengatur persentase diskon berdasarkan minimal hari sewa (atau menghapus seluruh tier diskon jika ingin memakai tarif harian murni).',
          },
        },
        {
          '@type': 'Question',
          name: 'Bagaimana jika staf gudang resign?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Owner dapat mencabut akses staf kapan saja dengan 1 klik ("Cabut Akses") pada daftar Anggota Tim di Tab Profil.',
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSON_LD) }}
      />
      <AppShell />
    </>
  );
}
