import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeSlug,
  normalizeWhatsapp,
  formatRp,
  addDaysToIsoDate,
  calculateCartSummary,
  buildWhatsappCheckoutMessage,
  NewShopSchema,
  NewItemSchema,
  CreateBookingSchema,
  InviteMemberSchema,
} from '../validators.ts';
import {
  mapShopFromDb,
  mapShopToDb,
  mapItemFromDb,
  mapBookingFromDb,
} from '../supabase.ts';
import { DEFAULT_ITEMS, DURATION_OPTIONS } from '../../data/mockData.ts';

describe('Sanitasi & Format Utilitas', () => {
  it('sanitizeSlug membersihkan spasi dan simbol menjadi format URL aman', () => {
    assert.equal(sanitizeSlug('  Borneo Outdoor & Teknik!! '), 'borneo-outdoor-teknik');
    assert.equal(sanitizeSlug('---Kamera___Pro---'), 'kamera-pro');
  });

  it('normalizeWhatsapp mengubah awalan 08 atau 8 menjadi 628', () => {
    assert.equal(normalizeWhatsapp('0812-3456-7890'), '6281234567890');
    assert.equal(normalizeWhatsapp('+62 812 9999 0000'), '6281299990000');
    assert.equal(normalizeWhatsapp('85211223344'), '6285211223344');
  });

  it('formatRp membulatkan dan memformat Rupiah', () => {
    assert.equal(formatRp(55000), 'Rp55.000');
    assert.equal(formatRp(0), 'Rp0');
  });

  it('addDaysToIsoDate menghitung tanggal selesai inklusif dengan benar', () => {
    assert.equal(addDaysToIsoDate('2026-11-01', 1), '2026-11-01');
    assert.equal(addDaysToIsoDate('2026-11-01', 3), '2026-11-03');
  });
});

describe('Perhitungan Keranjang, Diskon Durasi & Ketersediaan Tanggal', () => {
  it('calculateCartSummary menghitung diskon paket 3 hari (multiplier 2.7)', () => {
    const threeDays = DURATION_OPTIONS.find((d) => d.days === 3)!;
    const item1 = DEFAULT_ITEMS[0]; // Rp 55.000, stock 4
    const summary = calculateCartSummary({ [item1.id]: 2 }, DEFAULT_ITEMS, threeDays);

    assert.equal(summary.totalUnits, 2);
    assert.equal(summary.totalCost, 297000);
  });

  it('calculateCartSummary membatasi qty sesuai availabilityMap berbasis tanggal', () => {
    const oneDay = DURATION_OPTIONS[0];
    const item1 = DEFAULT_ITEMS[0]; // stock fisik 4
    const availabilityMap = { [item1.id]: 1 };
    const summary = calculateCartSummary(
      { [item1.id]: 3 },
      DEFAULT_ITEMS,
      oneDay,
      availabilityMap
    );

    assert.equal(summary.totalUnits, 1);
    assert.equal(summary.totalCost, 55000);
  });

  it('buildWhatsappCheckoutMessage menyertakan Kode Booking dan nama penyewa', () => {
    const oneDay = DURATION_OPTIONS[0];
    const item1 = DEFAULT_ITEMS[0];
    const summary = calculateCartSummary({ [item1.id]: 1 }, DEFAULT_ITEMS, oneDay);
    const text = buildWhatsappCheckoutMessage({
      shopName: 'Borneo Rental',
      bookingCode: 'SBR-261030-ABCD',
      customerName: 'Budi Santoso',
      startDate: '2026-11-05',
      endDate: '2026-11-05',
      durationLabel: oneDay.label,
      cartSummary: summary,
      notes: 'Ambil jam 09:00',
    });

    assert.ok(text.includes('SBR-261030-ABCD'));
    assert.ok(text.includes('Budi Santoso'));
    assert.ok(text.includes('Tenda Eiger'));
    assert.ok(text.includes('Rp55.000'));
  });
});

describe('Validasi Skema Zod & Keamanan Data Mapper', () => {
  it('NewItemSchema menerima harga angka, string angka, atau format ribuan serta URL foto valid', () => {
    const valid = NewItemSchema.safeParse({
      name: 'Tenda Dome',
      sku: 'TND-1',
      category: 'Camping',
      pricePerDay: '100.000',
      stock: 1,
      imageUrl: 'data:image/webp;base64,UklGRnoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQAAAP4AAA3AAP7mt+AAA==',
    });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.pricePerDay, 100000);
    }
  });

  it('NewItemSchema menolak harga negatif atau 0', () => {
    const invalid = NewItemSchema.safeParse({
      name: 'Tenda',
      sku: 'TND-1',
      category: 'Camping',
      pricePerDay: -10000,
      stock: 1,
    });
    assert.equal(invalid.success, false);
  });

  it('NewShopSchema menormalisasi slug dan nomor WhatsApp serta tidak menerima PIN', () => {
    const res = NewShopSchema.safeParse({
      name: 'Samarinda Kamera',
      tagline: 'Sewa Kamera',
      slug: 'Samarinda Kamera!!',
      whatsapp: '081234567890',
      location: 'Samarinda',
      hours: '08.00 - 20.00',
    });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.slug, 'samarinda-kamera');
      assert.equal(res.data.whatsapp, '6281234567890');
    }
  });

  it('CreateBookingSchema menolak tanggal masa lalu', () => {
    const res = CreateBookingSchema.safeParse({
      customerName: 'Andi',
      customerPhone: '08123456789',
      startDate: '2020-01-01',
      durationDays: 2,
    });
    assert.equal(res.success, false);
  });

  it('InviteMemberSchema memvalidasi email staf', () => {
    assert.equal(
      InviteMemberSchema.safeParse({ email: 'bukan-email', role: 'staff' }).success,
      false
    );
    assert.equal(
      InviteMemberSchema.safeParse({ email: 'Staf@Rental.com', role: 'staff' }).success,
      true
    );
  });

  it('mapShopFromDb & mapShopToDb TIDAK membocorkan PIN atau mengizinkan eskalasi plan/isVerified', () => {
    const mapped = mapShopFromDb({
      slug: 'toko-uji',
      name: 'Toko Uji',
      location: 'Balikpapan',
      hours: '08.00 - 17.00',
      whatsapp: '628123456789',
      is_verified: false,
      plan: 'FREE',
    });

    assert.equal(mapped.isVerified, false);
    assert.equal(mapped.plan, 'FREE');
    assert.equal('ownerPin' in mapped, false);
    assert.equal('staffPin' in mapped, false);

    const dbPayload = mapShopToDb({
      ...mapped,
      isVerified: true,
      plan: 'PRO',
    });
    assert.equal('is_verified' in dbPayload, false);
    assert.equal('plan' in dbPayload, false);
    assert.equal('owner_pin' in dbPayload, false);
  });

  it('mapItemFromDb dan mapBookingFromDb memetakan struktur DB dengan benar', () => {
    const item = mapItemFromDb({
      id: '00000000-0000-4000-8000-000000000001',
      shop_slug: 'borneo-rental',
      sku: 'SKU-1',
      name: 'Alat Uji',
      category: 'Camping',
      price_per_day: 75000,
      status: 'available',
      stock: 3,
    });
    assert.equal(item.pricePerDay, 75000);
    assert.equal(item.stock, 3);

    const booking = mapBookingFromDb({
      id: '00000000-0000-4000-8000-000000000099',
      shop_slug: 'borneo-rental',
      code: 'SBR-261030-9999',
      customer_name: 'Rina',
      customer_phone: '62811223344',
      start_date: '2026-11-01',
      end_date: '2026-11-02',
      duration_days: 2,
      status: 'confirmed',
      total_amount: 150000,
      created_at: '2026-10-30T10:00:00Z',
    });
    assert.equal(booking.code, 'SBR-261030-9999');
    assert.equal(booking.status, 'confirmed');
  });
});
