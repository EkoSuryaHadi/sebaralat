import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sebaraja - Platform Katalog Rental & Cek Stok Real-Time',
    short_name: 'Sebaraja',
    description:
      'Platform katalog rental online instan untuk WhatsApp & Instagram dengan cek stok kalender dan panel staf gudang.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8faf8',
    theme_color: '#10b981',
    icons: [
      {
        src: '/logo-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
