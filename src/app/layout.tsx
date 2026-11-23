import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import { themeInitScript } from "@/components/ThemeToggle";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { getPublicSiteOrigin } from "@/lib/validators";
import "./globals.css";

const SITE_ORIGIN = getPublicSiteOrigin();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const displayFont = Bricolage_Grotesque({
  variable: "--font-display-family",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Sebaraja - Aplikasi Katalog Rental & Cek Stok Real-Time WhatsApp",
    template: "%s | Sebaraja",
  },
  description:
    "Platform katalog rental online instan untuk usaha sewa kamera, alat camping, genset, dan perlengkapan event. Cek stok real-time, kalkulator diskon otomatis, dan booking langsung ke WhatsApp.",
  keywords: [
    "aplikasi rental alat",
    "katalog sewa whatsapp",
    "sistem manajemen rental",
    "cek stok rental online",
    "web katalog sewa kamera",
    "aplikasi sewa alat camping",
    "sebaraja",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Sebaraja",
    title: "Sebaraja - Ubah Chat 'Ready Kak?' Jadi Booking Otomatis di WhatsApp",
    description:
      "Buat katalog sewa online gratis dalam 2 menit. Lengkap dengan cek stok kalender anti bentrok, kalkulator durasi sewa, QRIS, dan panel staf gudang.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sebaraja - Aplikasi Katalog Rental & Cek Stok Real-Time",
    description:
      "Katalog sewa online instan untuk WhatsApp & Instagram. Cek stok real-time, diskon durasi otomatis, dan manajemen staf gudang.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo-icon.svg",
    apple: "/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-bg text-fg">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
