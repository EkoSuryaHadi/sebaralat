import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import App from '../page';
import { DEFAULT_SHOPS } from '@/data/mockData';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return DEFAULT_SHOPS.map((shop) => ({
    slug: shop.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = DEFAULT_SHOPS.find((s) => s.slug === slug);

  if (shop) {
    return {
      title: `${shop.name} - Katalog Sewa & Rental Resmi`,
      description: `${shop.tagline}. Cek stok ketersediaan unit dan sewa langsung via WhatsApp.`,
    };
  }

  return {
    title: `Katalog Rental - Sebaraja`,
    description: 'Katalog resmi penyewaan alat dan perlengkapan.',
  };
}

async function ShopPageContent({ params }: PageProps) {
  const { slug } = await params;
  return <App initialShopSlug={slug} />;
}

export default function ShopPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 text-xs">
          Memuat Katalog...
        </div>
      }
    >
      <ShopPageContent params={params} />
    </Suspense>
  );
}
