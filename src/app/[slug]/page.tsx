import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { DEFAULT_SHOPS } from '@/data/mockData';
import { createServerSupabaseClient } from '@/lib/supabase';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function resolveShopMeta(slug: string): Promise<{ name: string; tagline: string } | null> {
  const serverClient = createServerSupabaseClient();
  if (serverClient) {
    const { data, error } = await serverClient
      .from('shops')
      .select('slug, name, tagline')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data) {
      return { name: data.name, tagline: data.tagline || '' };
    }
  }

  const fallback = DEFAULT_SHOPS.find((s) => s.slug === slug);
  if (fallback) {
    return { name: fallback.name, tagline: fallback.tagline };
  }
  return null;
}

export function generateStaticParams() {
  return DEFAULT_SHOPS.map((shop) => ({
    slug: shop.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await resolveShopMeta(slug);

  if (shop) {
    return {
      title: `${shop.name} - Katalog Sewa & Rental Resmi`,
      description: `${shop.tagline}. Cek stok ketersediaan unit dan sewa langsung via WhatsApp.`,
    };
  }

  return {
    title: 'Katalog Tidak Ditemukan - Sebaraja',
    description: 'Tautan katalog rental tidak ditemukan.',
  };
}

async function ShopPageContent({ params }: PageProps) {
  const { slug } = await params;
  const shop = await resolveShopMeta(slug);
  if (!shop) {
    notFound();
  }
  return <AppShell initialShopSlug={slug} />;
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
