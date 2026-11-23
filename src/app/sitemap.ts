import type { MetadataRoute } from 'next';
import { DEFAULT_SHOPS } from '@/data/mockData';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getPublicSiteOrigin } from '@/lib/validators';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getPublicSiteOrigin();
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();

  entries.set('/', {
    url: `${origin}/`,
    changeFrequency: 'weekly',
    priority: 1.0,
  });

  for (const shop of DEFAULT_SHOPS) {
    entries.set(`/${shop.slug}`, {
      url: `${origin}/${shop.slug}`,
      changeFrequency: 'daily',
      priority: 0.8,
    });
  }

  try {
    const serverClient = createServerSupabaseClient();
    if (serverClient) {
      const { data, error } = await serverClient
        .from('shops_public')
        .select('slug')
        .limit(500);
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (row && typeof row.slug === 'string' && row.slug.trim()) {
            entries.set(`/${row.slug}`, {
              url: `${origin}/${row.slug}`,
              changeFrequency: 'daily',
              priority: 0.8,
            });
          }
        }
      }
    }
  } catch {
    // Tetap gunakan daftar fallback bila query Supabase gagal saat build
  }

  return Array.from(entries.values());
}
