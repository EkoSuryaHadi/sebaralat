'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackAnalyticsEvent } from '@/lib/analytics';

const NON_SHOP_ROOT_PATHS = new Set(['/', '/login', '/admin']);

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    if (NON_SHOP_ROOT_PATHS.has(pathname)) {
      void trackAnalyticsEvent({
        eventType: 'page_view',
        path: pathname,
      });
      return;
    }

    const firstSegment = pathname.split('/').filter(Boolean)[0] || null;
    void trackAnalyticsEvent({
      eventType: firstSegment ? 'catalog_view' : 'page_view',
      path: pathname,
      shopSlug: firstSegment,
    });
  }, [pathname]);

  return null;
}
