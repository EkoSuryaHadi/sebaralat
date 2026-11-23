import { ImageResponse } from 'next/og';

export const alt = 'Sebaraja - Platform Katalog Rental & Cek Stok Real-Time WhatsApp';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          background: 'linear-gradient(135deg, #0b1411 0%, #10241c 55%, #0b1411 100%)',
          color: '#f4f7f5',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 20px',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#6ee7b7',
              fontSize: '22px',
              fontWeight: 700,
            }}
          >
            <span>sebaraja.my.id</span>
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '999px',
              background: '#bef264',
              color: '#0c110f',
              fontSize: '20px',
              fontWeight: 800,
            }}
          >
            Gratis &bull; Tanpa Komisi 0%
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px' }}>
          <div style={{ fontSize: '60px', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em' }}>
            Ubah Chat &ldquo;Alat Ini Ready Kak?&rdquo; Jadi Booking Otomatis di WhatsApp.
          </div>
          <div style={{ fontSize: '28px', color: '#a7b8b0', lineHeight: 1.4 }}>
            Katalog rental online real-time, cek stok anti bentrok, kalkulator durasi sewa, QRIS, &amp; manajemen staf gudang.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', fontSize: '20px', color: '#d1fae5' }}>
          <span>&#9679; Kamera &amp; Lensa</span>
          <span>&#9679; Camping &amp; Outdoor</span>
          <span>&#9679; Genset &amp; Alat Proyek</span>
          <span>&#9679; Sound &amp; Event</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
