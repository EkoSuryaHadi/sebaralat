import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import { themeInitScript } from "@/components/ThemeToggle";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import "./globals.css";

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
  title: "Sebaraja - Platform Katalog Rental & Cek Stok Real-Time",
  description: "Micro-SaaS katalog rental alat instan untuk WhatsApp dan media sosial. Cek ketersediaan ready, disewa, hitung sewa otomatis, dan manajemen staf gudang.",
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
