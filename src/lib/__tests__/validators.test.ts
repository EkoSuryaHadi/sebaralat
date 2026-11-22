import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeSlug,
  normalizeWhatsapp,
  formatRp,
  addDaysToIsoDate,
  calculateCartSummary,
  computeShopAvailabilityMap,
  computeBundleAvailability,
  getDurationMultiplier,
  buildShopDurationOptions,
  buildGoogleMapsUrl,
  buildBookingFollowUpWaMessage,
  maskCustomerPhone,
  computeShopAnalytics,
  buildBookingsCsv,
  resolveEffectiveRole,
  sanitizeItemForRole,
  buildWhatsappCheckoutMessage,
  NewShopSchema,
  NewItemSchema,
  CreateBookingSchema,
  InviteMemberSchema,
  DiscountTierSchema,
} from '../validators.ts';
import {
  mapShopFromDb,
  mapShopToDb,
  mapItemFromDb,
  mapItemToDb,
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

  it('P0-2: getDurationMultiplier menghitung tarif diskon durasi resmi secara deterministik', () => {
    assert.equal(getDurationMultiplier(1), 1);
    assert.equal(getDurationMultiplier(2), 2);
    assert.equal(getDurationMultiplier(3), 2.7);
    assert.equal(getDurationMultiplier(7), 5.25);
    assert.equal(getDurationMultiplier(10), 7.5);
    assert.equal(getDurationMultiplier(0), 1);
  });

  it('getDurationMultiplier mendukung tier diskon fleksibel milik Owner dan 0% (tanpa diskon)', () => {
    assert.equal(getDurationMultiplier(3, []), 3);
    assert.equal(getDurationMultiplier(7, []), 7);

    const customTiers = [
      { minDays: 3, discountPercent: 10 },
      { minDays: 7, discountPercent: 25 },
      { minDays: 14, discountPercent: 40 },
    ];
    assert.equal(getDurationMultiplier(1, customTiers), 1);
    assert.equal(getDurationMultiplier(2, customTiers), 2);
    assert.equal(getDurationMultiplier(3, customTiers), 2.7);
    assert.equal(getDurationMultiplier(5, customTiers), 4.5);
    assert.equal(getDurationMultiplier(7, customTiers), 5.25);
    assert.equal(getDurationMultiplier(14, customTiers), 8.4);
  });

  it('buildShopDurationOptions membentuk opsi paket populer + hari kustom sesuai tier diskon toko', () => {
    const tiers = [{ minDays: 5, discountPercent: 15 }];
    const opts = buildShopDurationOptions(tiers, 4);
    const daysList = opts.map((o) => o.days);
    assert.ok(daysList.includes(1));
    assert.ok(daysList.includes(4));
    assert.ok(daysList.includes(5));
    const fiveDayOpt = opts.find((o) => o.days === 5)!;
    assert.equal(fiveDayOpt.discountTag, 'Hemat 15%');
    const threeDayOpt = opts.find((o) => o.days === 3)!;
    assert.equal(threeDayOpt.discountTag, null);
  });

  it('buildGoogleMapsUrl menggunakan mapsUrl kustom jika valid atau fallback ke query pencarian Maps', () => {
    assert.equal(
      buildGoogleMapsUrl('Balikpapan', 'https://maps.app.goo.gl/abc123'),
      'https://maps.app.goo.gl/abc123'
    );
    assert.equal(
      buildGoogleMapsUrl('Jl. MT Haryono, Balikpapan', ''),
      'https://www.google.com/maps/search/?api=1&query=Jl.%20MT%20Haryono%2C%20Balikpapan'
    );
  });

  it('buildBookingFollowUpWaMessage membuat pesan follow-up sesuai status booking', () => {
    const sampleBooking = {
      id: 'bk-1',
      shopSlug: 'borneo-rental',
      code: 'SBR-261122-ABCD',
      customerName: 'Budi Santoso',
      customerPhone: '628123456789',
      startDate: '2026-11-22',
      endDate: '2026-11-24',
      durationDays: 3,
      status: 'pending' as const,
      totalAmount: 150000,
      notes: '',
      createdAt: '2026-11-22T00:00:00Z',
    };
    const pendingMsg = buildBookingFollowUpWaMessage(sampleBooking, 'Borneo Rental');
    assert.ok(pendingMsg.includes('SBR-261122-ABCD'));
    assert.ok(pendingMsg.includes('Budi Santoso'));

    const pickedUpMsg = buildBookingFollowUpWaMessage(
      { ...sampleBooking, status: 'picked_up' },
      'Borneo Rental'
    );
    assert.ok(pickedUpMsg.includes('2026-11-24'));
    assert.equal(
      DiscountTierSchema.safeParse({ minDays: 3, discountPercent: 10 }).success,
      true
    );
  });

  it('maskCustomerPhone menyamarkan digit tengah nomor telepon penyewa untuk tampilan publik', () => {
    assert.equal(maskCustomerPhone('6281234567890'), '62812****890');
    assert.equal(maskCustomerPhone('0812998877'), '0812****77');
  });

  it('computeShopAnalytics menghitung omzet terealisasi, pending, konversi, AOV, dan top items dengan akurat', () => {
    const nowMs = Date.parse('2026-11-22T12:00:00Z');
    const sampleBookings = [
      {
        id: 'b1',
        shopSlug: 'borneo-rental',
        code: 'SBR-261120-AA11',
        customerName: 'Andi',
        customerPhone: '628111222333',
        startDate: '2026-11-20',
        endDate: '2026-11-21',
        durationDays: 2,
        status: 'returned' as const,
        totalAmount: 200000,
        notes: '',
        createdAt: '2026-11-20T08:00:00Z',
        lines: [
          {
            id: 'l1',
            bookingId: 'b1',
            itemId: 'i1',
            itemName: 'Tenda Eiger 4P',
            qty: 2,
            unitPricePerDay: 50000,
            subtotal: 200000,
          },
        ],
      },
      {
        id: 'b2',
        shopSlug: 'borneo-rental',
        code: 'SBR-261121-BB22',
        customerName: 'Budi',
        customerPhone: '628111222444',
        startDate: '2026-11-21',
        endDate: '2026-11-22',
        durationDays: 2,
        status: 'confirmed' as const,
        totalAmount: 350000,
        notes: '',
        createdAt: '2026-11-21T08:00:00Z',
        lines: [
          {
            id: 'l2',
            bookingId: 'b2',
            itemId: 'i2',
            itemName: 'Genset Silent 2200W',
            qty: 1,
            unitPricePerDay: 175000,
            subtotal: 350000,
          },
        ],
      },
      {
        id: 'b3',
        shopSlug: 'borneo-rental',
        code: 'SBR-261122-CC33',
        customerName: 'Citra',
        customerPhone: '628111222555',
        startDate: '2026-11-22',
        endDate: '2026-11-22',
        durationDays: 1,
        status: 'pending' as const,
        totalAmount: 120000,
        notes: '',
        createdAt: '2026-11-22T08:00:00Z',
        lines: [],
      },
    ];

    const summary = computeShopAnalytics(sampleBookings, null, nowMs);
    assert.equal(summary.realizedRevenue, 550000);
    assert.equal(summary.pendingRevenue, 120000);
    assert.equal(summary.totalBookings, 3);
    assert.equal(summary.activeOrCompletedCount, 2);
    assert.equal(summary.averageOrderValue, 275000);
    assert.equal(summary.topItems.length, 2);
    assert.equal(summary.topItems[0].itemName, 'Genset Silent 2200W');
    assert.equal(summary.topItems[0].totalRevenue, 350000);
  });

  it('buildBookingsCsv menghasilkan format CSV valid dengan header dan baris data', () => {
    const csv = buildBookingsCsv([
      {
        id: 'b1',
        shopSlug: 'borneo-rental',
        code: 'SBR-261120-AA11',
        customerName: 'Andi "Proyek"',
        customerPhone: '628111222333',
        startDate: '2026-11-20',
        endDate: '2026-11-21',
        durationDays: 2,
        status: 'confirmed',
        totalAmount: 200000,
        notes: 'Catatan, penting',
        createdAt: '2026-11-20T08:00:00Z',
      },
    ]);
    assert.ok(csv.includes('Kode Booking,Tanggal Buat,Nama Penyewa'));
    assert.ok(csv.includes('SBR-261120-AA11'));
    assert.ok(csv.includes('"Andi ""Proyek"""'));
  });

  it('computeBundleAvailability & calculateCartSummary menghitung kuota & total paket bundling dari stok komponen fisik', () => {
    const bundle = {
      id: 'bnd-1',
      name: 'Paket Camping Hemat',
      description: '1 Tenda + 1 Jackhammer',
      pricePerDay: 150000,
      lines: [
        { itemId: DEFAULT_ITEMS[0].id, qty: 1 }, // stock 4
        { itemId: DEFAULT_ITEMS[2].id, qty: 1 }, // stock 2
      ],
    };
    assert.equal(computeBundleAvailability(bundle, DEFAULT_ITEMS), 2);

    const oneDay = DURATION_OPTIONS[0];
    const summary = calculateCartSummary(
      {},
      DEFAULT_ITEMS,
      oneDay,
      undefined,
      [],
      { 'bnd-1': 2 },
      [bundle]
    );
    assert.equal(summary.totalUnits, 2);
    assert.equal(summary.totalCost, 300000);
    assert.equal(summary.selectedBundles.length, 1);

    const waText = buildWhatsappCheckoutMessage({
      shopName: 'Borneo Rental',
      startDate: '2026-11-22',
      durationLabel: oneDay.label,
      cartSummary: summary,
      pickupTime: '14:00',
      deliveryMode: 'delivery',
    });
    assert.ok(waText.includes('Paket Camping Hemat'));
    assert.ok(waText.includes('14:00'));
    assert.ok(waText.includes('Diantar Kurir'));
  });

  it('P0-3: sanitizeItemForRole menyembunyikan renterNote dari role customer tetapi tetap utuh bagi owner/staff', () => {
    const rentedItem = DEFAULT_ITEMS[1]; // Genset dengan renterNote: 'Pak Budi - Proyek Ruko MT Haryono'
    const forCustomer = sanitizeItemForRole(rentedItem, 'customer');
    const forStaff = sanitizeItemForRole(rentedItem, 'staff');
    const forOwner = sanitizeItemForRole(rentedItem, 'owner');

    assert.equal(forCustomer.renterNote, '');
    assert.equal(forStaff.renterNote, 'Pak Budi - Proyek Ruko MT Haryono');
    assert.equal(forOwner.renterNote, 'Pak Budi - Proyek Ruko MT Haryono');
  });

  it('P1-2: mapItemToDb dan mapItemFromDb mempertahankan teks availableAt ("Minggu, 1 Nov (14:00)") tanpa terhapus jadi null', () => {
    const item = {
      ...DEFAULT_ITEMS[1],
      availableAt: 'Minggu, 1 Nov (14:00 WITA)',
    };
    const dbRow = mapItemToDb(item);
    assert.equal(dbRow.available_at, 'Minggu, 1 Nov (14:00 WITA)');

    const roundTrip = mapItemFromDb(dbRow);
    assert.equal(roundTrip.availableAt, 'Minggu, 1 Nov (14:00 WITA)');
  });

  it('P1-3: resolveEffectiveRole memblokir devSimulatedRole pada toko riil saat Supabase aktif', () => {
    assert.equal(
      resolveEffectiveRole({
        authenticatedRole: undefined,
        devSimulatedRole: 'owner',
        isSupabaseConfigured: true,
        activeShopSlug: 'samarinda-kamera',
      }),
      'customer'
    );
    assert.equal(
      resolveEffectiveRole({
        authenticatedRole: undefined,
        devSimulatedRole: 'owner',
        isSupabaseConfigured: true,
        activeShopSlug: 'borneo-rental',
      }),
      'owner'
    );
    assert.equal(
      resolveEffectiveRole({
        authenticatedRole: 'staff',
        devSimulatedRole: 'owner',
        isSupabaseConfigured: true,
        activeShopSlug: 'samarinda-kamera',
      }),
      'staff'
    );
  });

  it('P1-5: computeShopAvailabilityMap & calculateCartSummary mengembalikan 0 untuk unit berstatus rented meskipun stock > 0', () => {
    const availMap = computeShopAvailabilityMap({
      items: DEFAULT_ITEMS,
      bookings: [],
      activeShopSlug: 'borneo-rental',
      startDate: '2026-11-01',
      durationDays: 2,
    });
    const gensetRented = DEFAULT_ITEMS[1]; // status: 'rented', stock: 1
    assert.equal(availMap[gensetRented.id], 0);

    const summary = calculateCartSummary(
      { [gensetRented.id]: 1 },
      DEFAULT_ITEMS,
      DURATION_OPTIONS[0],
      { [gensetRented.id]: 1 } // bahkan jika availabilityMap basi bernilai 1, status 'rented' wajib ditolak
    );
    assert.equal(summary.totalUnits, 0);
    assert.equal(summary.totalCost, 0);
  });
});
