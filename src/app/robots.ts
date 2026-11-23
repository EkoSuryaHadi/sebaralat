import type { MetadataRoute } from 'next';
import { getPublicSiteOrigin } from '@/lib/validators';

export default function robots(): MetadataRoute.Robots {
  const origin = getPublicSiteOrigin();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/login', '/api/'],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
