import { z } from 'zod';
import type {
  RentalItem,
  DurationOption,
  Booking,
  Role,
  DiscountTier,
  ShopAnalyticsSummary,
  TopItemAnalytics,
  RentalBundle,
  DeliveryMode,
  PlatformShopAnalyticsRow,
} from '../types/index.ts';

// =========================================================
// UTILITAS SANITASI, KEAMANAN ROLE & PERHITUNGAN MURNI
// =========================================================

export const DEMO_SHOP_SLUGS = new Set(['borneo-rental', 'kaltim-kamera']);

export const DEFAULT_DISCOUNT_TIERS: DiscountTier[] = [
  { minDays: 3, discountPercent: 10 },
  { minDays: 7, discountPercent: 25 },
];

export const PUBLIC_SITE_URL = 'https://sebaraja.my.id';

/**
 * Mengembalikan origin domain publik untuk tautan katalog, QR, dan pelacakan booking.
 * Menghindari kebocoran URL preview *.vercel.app jika NEXT_PUBLIC_SITE_URL belum diatur.
 */
export function getPublicSiteOrigin(): string {
  const envUrl =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SITE_URL?.trim() : '';
  if (envUrl && /^https?:\/\/.+/i.test(envUrl)) {
    return envUrl.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    if (window.location.hostname.endsWith('.vercel.app')) {
      return PUBLIC_SITE_URL;
    }
    return window.location.origin;
  }
  return PUBLIC_SITE_URL;
}

export function isDemoShopSlug(slug?: string | null): boolean {
  if (!slug) return false;
  return DEMO_SHOP_SLUGS.has(slug.trim().toLowerCase());
}

/**
 * Menentukan role efektif pengguna.
 * P1-3: Saat Supabase aktif di produksi, simulasi devSimulatedRole HANYA diizinkan pada toko showcase demo.
 */
export function resolveEffectiveRole(params: {
  authenticatedRole?: Role | null;
  devSimulatedRole: Role;
  isSupabaseConfigured: boolean;
  activeShopSlug?: string | null;
}): Role {
  const { authenticatedRole, devSimulatedRole, isSupabaseConfigured, activeShopSlug } = params;
  if (authenticatedRole === 'owner' || authenticatedRole === 'staff') {
    return authenticatedRole;
  }
  if (!isSupabaseConfigured || isDemoShopSlug(activeShopSlug)) {
    return devSimulatedRole;
  }
  return 'customer';
}

/**
 * P0-3: Menyembunyikan catatan internal peminjam (renterNote) dari pelanggan publik (anon/customer).
 */
export function sanitizeItemForRole(item: RentalItem, role: Role): RentalItem {
  if (role === 'owner' || role === 'staff') {
    return item;
  }
  if (!item.renterNote) {
    return item;
  }
  return {
    ...item,
    renterNote: '',
  };
}

/**
 * Normalisasi dan pengurutan tier diskon durasi milik toko.
 */
export function normalizeDiscountTiers(tiers?: DiscountTier[] | null): DiscountTier[] {
  if (!Array.isArray(tiers)) return [];
  const byDays = new Map<number, number>();
  for (const t of tiers) {
    if (!t || !Number.isFinite(t.minDays) || !Number.isFinite(t.discountPercent)) continue;
    const minDays = Math.floor(Number(t.minDays));
    const discountPercent = Math.round(Number(t.discountPercent));
    if (minDays >= 2 && minDays <= 60 && discountPercent > 0 && discountPercent <= 90) {
      byDays.set(minDays, discountPercent);
    }
  }
  return Array.from(byDays.entries())
    .map(([minDays, discountPercent]) => ({ minDays, discountPercent }))
    .sort((a, b) => a.minDays - b.minDays);
}

/**
 * Mengambil persentase diskon yang berlaku untuk jumlah hari sewa berdasarkan tier toko.
 * Jika discountTiers tidak diberikan (undefined), menggunakan DEFAULT_DISCOUNT_TIERS.
 * Jika discountTiers berupa array kosong [], maka diskon 0% (tanpa diskon).
 */
export function getAppliedDiscountPercent(
  durationDays: number,
  discountTiers?: DiscountTier[] | null
): number {
  if (!Number.isFinite(durationDays) || durationDays <= 1) return 0;
  const days = Math.floor(durationDays);
  const effectiveTiers =
    discountTiers === undefined
      ? DEFAULT_DISCOUNT_TIERS
      : normalizeDiscountTiers(discountTiers);

  let applied = 0;
  for (const tier of effectiveTiers) {
    if (tier.minDays <= days) {
      applied = tier.discountPercent;
    }
  }
  return applied;
}

/**
 * P0-2: Perhitungan deterministik multiplier tarif sewa berdasarkan durasi hari dan tier diskon toko.
 */
export function getDurationMultiplier(
  durationDays: number,
  discountTiers?: DiscountTier[] | null
): number {
  if (!Number.isFinite(durationDays) || durationDays <= 1) return 1;
  const days = Math.floor(durationDays);
  const discPercent = getAppliedDiscountPercent(days, discountTiers);
  if (discPercent > 0) {
    return Number((days * (1 - discPercent / 100)).toFixed(2));
  }
  return days;
}

/**
 * Membangun daftar opsi paket durasi untuk katalog berdasarkan tier diskon toko + durasi aktif (1-60 hari).
 */
export function buildShopDurationOptions(
  discountTiers?: DiscountTier[] | null,
  currentDays?: number
): DurationOption[] {
  const effectiveTiers =
    discountTiers === undefined
      ? DEFAULT_DISCOUNT_TIERS
      : normalizeDiscountTiers(discountTiers);

  const daySet = new Set<number>([1, 2, 3, 7]);
  for (const t of effectiveTiers) {
    daySet.add(t.minDays);
  }
  if (
    typeof currentDays === 'number' &&
    Number.isFinite(currentDays) &&
    currentDays >= 1 &&
    currentDays <= 60
  ) {
    daySet.add(Math.floor(currentDays));
  }

  return Array.from(daySet)
    .sort((a, b) => a - b)
    .map((days) => {
      const disc = getAppliedDiscountPercent(days, effectiveTiers);
      const multiplier = getDurationMultiplier(days, effectiveTiers);
      const discountTag = disc > 0 ? `Hemat ${disc}%` : null;
      let label = `${days} Hari`;
      if (days === 1) {
        label = '1 Hari (24 Jam)';
      } else if (days === 7) {
        label = disc > 0 ? `1 Minggu (Hemat ${disc}%)` : '1 Minggu (7 Hari)';
      } else if (disc > 0) {
        label = `${days} Hari (Hemat ${disc}%)`;
      }
      return {
        days,
        label,
        multiplier,
        discountTag,
      };
    });
}

/**
 * Membentuk URL Google Maps yang valid dari mapsUrl toko atau fallback ke pencarian lokasi.
 */
export function buildGoogleMapsUrl(location: string, mapsUrl?: string | null): string {
  const cleanUrl = (mapsUrl || '').trim();
  if (
    cleanUrl &&
    /^https?:\/\/.+/i.test(cleanUrl) &&
    cleanUrl !== 'https://maps.google.com' &&
    cleanUrl !== 'https://maps.google.com/'
  ) {
    return cleanUrl;
  }
  const query = encodeURIComponent((location || '').trim() || 'Indonesia');
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Membentuk pesan WhatsApp follow-up dari Admin/Owner ke Penyewa berdasarkan status booking.
 */
export function buildBookingFollowUpWaMessage(booking: Booking, shopName: string): string {
  const dateRange =
    booking.endDate && booking.endDate !== booking.startDate
      ? `${booking.startDate} s/d ${booking.endDate}`
      : booking.startDate;
  const itemsText =
    booking.lines && booking.lines.length > 0
      ? booking.lines.map((l) => `• ${l.itemName} (${l.qty} unit)`).join('\n') + '\n\n'
      : '';

  switch (booking.status) {
    case 'pending':
      return (
        `Halo Kak *${booking.customerName}*, kami dari Admin *${shopName}*.\n\n` +
        `Mengonfirmasi pengajuan booking Anda:\n` +
        `🔖 *Kode Booking:* ${booking.code}\n` +
        `📅 *Jadwal:* ${dateRange} (${booking.durationDays} hari)\n` +
        `💰 *Total Sewa:* ${formatRp(booking.totalAmount)}\n\n` +
        itemsText +
        `Unit tersedia untuk jadwal tersebut. Silakan lakukan konfirmasi/DP agar stok langsung kami kunci untuk Anda. Terima kasih!`
      );
    case 'confirmed':
      return (
        `Halo Kak *${booking.customerName}*, booking Anda di *${shopName}* dengan kode *${booking.code}* sudah *TERKONFIRMASI (Stok Dikunci)* ✅.\n\n` +
        `📅 *Jadwal Ambil:* ${booking.startDate}\n` +
        `📅 *Jadwal Kembali:* ${booking.endDate}\n` +
        `💰 *Total:* ${formatRp(booking.totalAmount)}\n\n` +
        `Jangan lupa membawa kartu identitas asli (E-KTP) saat pengambilan unit. Sampai jumpa di toko!`
      );
    case 'picked_up':
      return (
        `Halo Kak *${booking.customerName}*, kami dari *${shopName}* ingin mengingatkan jadwal pengembalian unit sewa:\n\n` +
        `🔖 *Kode Booking:* ${booking.code}\n` +
        `📅 *Batas Pengembalian:* ${booking.endDate}\n\n` +
        itemsText +
        `Apabila ingin memperpanjang durasi sewa, mohon kabari kami lebih awal ya. Terima kasih!`
      );
    case 'returned':
      return (
        `Halo Kak *${booking.customerName}*, terima kasih telah menyewa di *${shopName}* (Kode Booking: *${booking.code}*).\n\n` +
        `Seluruh unit telah kami terima kembali dengan baik. Ditunggu pemesanan berikutnya ya!`
      );
    case 'cancelled':
      return (
        `Halo Kak *${booking.customerName}*, menginformasikan bahwa booking *${booking.code}* di *${shopName}* untuk jadwal ${dateRange} telah dibatalkan. Hubungi kami jika ingin menjadwalkan ulang. Terima kasih.`
      );
  }
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function normalizeWhatsapp(input: string): string {
  const digits = input.replace(/[^0-9]/g, '');
  if (digits.startsWith('08')) {
    return '62' + digits.slice(1);
  }
  if (digits.startsWith('8')) {
    return '62' + digits;
  }
  return digits;
}

export function formatRp(num: number): string {
  if (!Number.isFinite(num)) return 'Rp0';
  return 'Rp' + Math.round(num).toLocaleString('id-ID');
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToIsoDate(startDateIso: string, durationDays: number): string {
  const parts = startDateIso.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return startDateIso;
  }
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  dt.setUTCDate(dt.getUTCDate() + Math.max(0, durationDays - 1));
  return dt.toISOString().slice(0, 10);
}

export interface CalculatedCartSummary {
  selectedList: (RentalItem & { qty: number; subtotal: number })[];
  selectedBundles: (RentalBundle & { qty: number; subtotal: number })[];
  totalUnits: number;
  totalCost: number;
}

/**
 * Menghitung sisa kuota paket bundling berdasarkan sisa stok fisik seluruh unit penyusunnya.
 */
export function computeBundleAvailability(
  bundle: RentalBundle,
  items: RentalItem[],
  availabilityMap?: Record<string, number>
): number {
  if (!bundle.lines || bundle.lines.length === 0) return 0;
  let minBundles = Infinity;
  for (const line of bundle.lines) {
    if (line.qty <= 0) continue;
    const item = items.find((i) => i.id === line.itemId);
    if (!item || item.status !== 'available') return 0;
    const avail =
      availabilityMap && typeof availabilityMap[item.id] === 'number'
        ? availabilityMap[item.id]
        : item.stock;
    const possible = Math.floor(Math.max(0, avail) / line.qty);
    if (possible < minBundles) {
      minBundles = possible;
    }
  }
  return Number.isFinite(minBundles) ? minBundles : 0;
}

/**
 * P1-5: Menghitung ketersediaan stok per item berdasarkan status operasional dan jadwal booking aktif.
 * Jika status item bukan 'available' ('rented' atau 'maintenance'), stok tersedia wajib 0.
 */
export function computeShopAvailabilityMap(params: {
  items: RentalItem[];
  bookings: Booking[];
  activeShopSlug: string;
  startDate: string;
  durationDays: number;
}): Record<string, number> {
  const { items, bookings, activeShopSlug, startDate, durationDays } = params;
  const endDate = addDaysToIsoDate(startDate, durationDays);
  const map: Record<string, number> = {};
  const shopItems = items.filter((i) => i.shopSlug === activeShopSlug);

  for (const item of shopItems) {
    if (item.status !== 'available') {
      map[item.id] = 0;
      continue;
    }
    const reserved = bookings
      .filter(
        (b) =>
          b.shopSlug === activeShopSlug &&
          (b.status === 'confirmed' || b.status === 'picked_up') &&
          b.startDate <= endDate &&
          b.endDate >= startDate
      )
      .reduce((acc, b) => {
        const lineQty =
          b.lines
            ?.filter((ln) => ln.itemId === item.id)
            .reduce((s, ln) => s + ln.qty, 0) || 0;
        return acc + lineQty;
      }, 0);

    map[item.id] = Math.max(0, item.stock - reserved);
  }

  return map;
}

export function calculateCartSummary(
  cart: Record<string, number>,
  items: RentalItem[],
  durationOption: DurationOption,
  availabilityMap?: Record<string, number>,
  discountTiers?: DiscountTier[] | null,
  bundleCart?: Record<string, number>,
  bundles?: RentalBundle[]
): CalculatedCartSummary {
  const selectedList: (RentalItem & { qty: number; subtotal: number })[] = [];
  const selectedBundles: (RentalBundle & { qty: number; subtotal: number })[] = [];
  let totalUnits = 0;
  let totalCost = 0;
  const effectiveMultiplier = getDurationMultiplier(durationOption.days, discountTiers);

  Object.entries(cart).forEach(([itemId, qty]) => {
    const item = items.find((i) => i.id === itemId);
    // P1-5: Unit yang sedang disewa ('rented') atau dalam perawatan ('maintenance') tidak bisa masuk keranjang
    if (!item || item.status !== 'available' || qty <= 0) return;

    const maxAvail =
      availabilityMap && typeof availabilityMap[item.id] === 'number'
        ? availabilityMap[item.id]
        : item.stock;

    if (maxAvail <= 0) return;

    const validQty = Math.min(qty, maxAvail);
    const subtotal = Math.round(item.pricePerDay * effectiveMultiplier * validQty);
    selectedList.push({
      ...item,
      qty: validQty,
      subtotal,
    });
    totalUnits += validQty;
    totalCost += subtotal;
  });

  if (bundleCart && bundles && bundles.length > 0) {
    Object.entries(bundleCart).forEach(([bundleId, qty]) => {
      const bnd = bundles.find((b) => b.id === bundleId);
      if (!bnd || qty <= 0) return;
      const maxBundleAvail = computeBundleAvailability(bnd, items, availabilityMap);
      if (maxBundleAvail <= 0) return;
      const validQty = Math.min(qty, maxBundleAvail);
      const subtotal = Math.round(bnd.pricePerDay * effectiveMultiplier * validQty);
      selectedBundles.push({
        ...bnd,
        qty: validQty,
        subtotal,
      });
      totalUnits += validQty;
      totalCost += subtotal;
    });
  }

  return { selectedList, selectedBundles, totalUnits, totalCost };
}

export function buildWhatsappCheckoutMessage(params: {
  shopName: string;
  bookingCode?: string;
  customerName?: string;
  startDate: string;
  endDate?: string;
  durationLabel: string;
  cartSummary: CalculatedCartSummary;
  notes?: string;
  trackingUrl?: string;
  pickupTime?: string;
  deliveryMode?: DeliveryMode;
}): string {
  const {
    shopName,
    bookingCode,
    customerName,
    startDate,
    endDate,
    durationLabel,
    cartSummary,
    notes,
    trackingUrl,
    pickupTime,
    deliveryMode,
  } = params;

  if (
    cartSummary.selectedList.length === 0 &&
    cartSummary.selectedBundles.length === 0
  ) {
    return '';
  }

  const unitLines = cartSummary.selectedList.map(
    (it, idx) => `${idx + 1}. *${it.name}* (${it.qty} unit) = ${formatRp(it.subtotal)}`
  );
  const bundleLines = cartSummary.selectedBundles.map(
    (bnd, idx) =>
      `${unitLines.length + idx + 1}. 🎁 *Paket ${bnd.name}* (${bnd.qty} paket) = ${formatRp(bnd.subtotal)}`
  );
  const lines = [...unitLines, ...bundleLines].join('\n');

  const codeLine = bookingCode ? `🔖 *Kode Booking:* ${bookingCode}\n` : '';
  const customerLine = customerName?.trim() ? `👤 *Penyewa:* ${customerName.trim()}\n` : '';
  const dateRange = endDate && endDate !== startDate ? `${startDate} s/d ${endDate}` : startDate;
  const pickupLine = pickupTime ? `⏰ *Jam Ambil:* ${pickupTime}\n` : '';
  const deliveryLine = deliveryMode
    ? `🚚 *Pengambilan:* ${deliveryMode === 'delivery' ? 'Minta Diantar Kurir' : 'Ambil di Toko'}\n`
    : '';
  const noteLine = notes?.trim() ? `\n📝 *Catatan:* ${notes.trim()}\n` : '';
  const trackingLine = trackingUrl?.trim()
    ? `🔗 *Cek Status & Nota Booking:* ${trackingUrl.trim()}\n`
    : '';

  return (
    `Halo Admin *${shopName}*, saya ingin menyewa dari katalog resmi:\n\n` +
    codeLine +
    customerLine +
    `📅 *Jadwal Sewa:* ${dateRange}\n` +
    `⏳ *Durasi Paket:* ${durationLabel}\n` +
    pickupLine +
    deliveryLine +
    `\n📦 *Rincian Unit:*\n${lines}\n` +
    noteLine +
    `\n💰 *Total Estimasi:* ${formatRp(cartSummary.totalCost)}\n` +
    trackingLine +
    `\nMohon konfirmasi ketersediaan unit tersebut. Terima kasih.`
  );
}

/**
 * Menyamarkan digit tengah nomor telepon pelanggan untuk tampilan cek status booking publik.
 */
export function maskCustomerPhone(phone: string): string {
  const clean = (phone || '').trim();
  if (clean.includes('****')) return clean;
  const digits = clean.replace(/[^0-9+]/g, '');
  if (digits.length > 10) {
    return `${digits.slice(0, 5)}****${digits.slice(-3)}`;
  }
  if (digits.length > 6) {
    return `${digits.slice(0, 4)}****${digits.slice(-2)}`;
  }
  return '****';
}

/**
 * Menghitung metrik analitik omzet, konversi, AOV, dan peringkat alat terlaris untuk Tab Omzet Owner PRO.
 */
export function computeShopAnalytics(
  bookings: Booking[],
  periodDays: number | null = null,
  nowMs: number = Date.now()
): ShopAnalyticsSummary {
  const filtered = bookings.filter((b) => {
    if (!periodDays || periodDays <= 0) return true;
    const createdMs = Date.parse(b.createdAt);
    if (Number.isNaN(createdMs)) return true;
    return nowMs - createdMs <= periodDays * 86_400_000;
  });

  let realizedRevenue = 0;
  let pendingRevenue = 0;
  let activeOrCompletedCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;

  const itemMap = new Map<string, TopItemAnalytics>();

  for (const bk of filtered) {
    const amount = Number(bk.totalAmount) || 0;
    const isRealized =
      bk.status === 'confirmed' || bk.status === 'picked_up' || bk.status === 'returned';

    if (isRealized) {
      realizedRevenue += amount;
      activeOrCompletedCount += 1;

      for (const ln of bk.lines || []) {
        const key = ln.itemId || ln.itemName;
        const existing = itemMap.get(key) || {
          itemId: ln.itemId || key,
          itemName: ln.itemName,
          totalQtyRented: 0,
          bookingCount: 0,
          totalRevenue: 0,
        };
        existing.totalQtyRented += Number(ln.qty) || 0;
        existing.bookingCount += 1;
        existing.totalRevenue += Number(ln.subtotal) || 0;
        itemMap.set(key, existing);
      }
    } else if (bk.status === 'pending') {
      pendingRevenue += amount;
      pendingCount += 1;
    } else if (bk.status === 'cancelled') {
      cancelledCount += 1;
    }
  }

  const totalBookings = filtered.length;
  const conversionRate =
    totalBookings > 0 ? Math.round((activeOrCompletedCount / totalBookings) * 100) : 0;
  const averageOrderValue =
    activeOrCompletedCount > 0 ? Math.round(realizedRevenue / activeOrCompletedCount) : 0;

  const topItems = Array.from(itemMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue || b.totalQtyRented - a.totalQtyRented
  );

  return {
    realizedRevenue,
    pendingRevenue,
    totalBookings,
    activeOrCompletedCount,
    pendingCount,
    cancelledCount,
    conversionRate,
    averageOrderValue,
    topItems,
  };
}

/**
 * Menghasilkan konten file CSV dari daftar booking untuk diunduh Owner PRO.
 */
export function buildBookingsCsv(bookings: Booking[]): string {
  const escapeCsvCell = (val: string | number | null | undefined): string => {
    const str = String(val ?? '');
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    'Kode Booking',
    'Tanggal Buat',
    'Nama Penyewa',
    'No WhatsApp',
    'Tanggal Mulai',
    'Tanggal Selesai',
    'Durasi (Hari)',
    'Status',
    'Total (Rp)',
    'Rincian Unit',
    'Catatan',
  ];

  const rows = bookings.map((bk) => {
    const unitSummary = (bk.lines || [])
      .map((l) => `${l.itemName} x${l.qty}`)
      .join('; ');
    return [
      escapeCsvCell(bk.code),
      escapeCsvCell(bk.createdAt),
      escapeCsvCell(bk.customerName),
      escapeCsvCell(bk.customerPhone),
      escapeCsvCell(bk.startDate),
      escapeCsvCell(bk.endDate),
      escapeCsvCell(bk.durationDays),
      escapeCsvCell(bk.status.toUpperCase()),
      escapeCsvCell(bk.totalAmount),
      escapeCsvCell(unitSummary),
      escapeCsvCell(bk.notes),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Menghasilkan file CSV daftar seluruh mitra toko dan performa GMV untuk Super Admin Sebaraja.
 */
export function buildPlatformShopsCsv(shops: PlatformShopAnalyticsRow[]): string {
  const escapeCsvCell = (val: string | number | boolean | null | undefined): string => {
    const str = String(val ?? '');
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    'Slug',
    'Nama Toko',
    'Lokasi',
    'WhatsApp',
    'Paket',
    'Verified',
    'Jumlah Unit',
    'Jumlah Booking',
    'Total GMV (Rp)',
    'Anggota Tim',
    'QRIS Aktif',
    'Telegram Alert',
    'Tanggal Daftar',
  ];

  const rows = shops.map((s) =>
    [
      escapeCsvCell(s.slug),
      escapeCsvCell(s.name),
      escapeCsvCell(s.location),
      escapeCsvCell(s.whatsapp),
      escapeCsvCell(s.plan),
      escapeCsvCell(s.is_verified ? 'Ya' : 'Tidak'),
      escapeCsvCell(s.item_count),
      escapeCsvCell(s.booking_count),
      escapeCsvCell(s.gmv),
      escapeCsvCell(s.member_count),
      escapeCsvCell(s.has_qris ? 'Ya' : 'Tidak'),
      escapeCsvCell(s.has_telegram ? 'Ya' : 'Tidak'),
      escapeCsvCell(s.created_at),
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

// =========================================================
// SKEMA ZOD VALIDASI INPUT FORM
// =========================================================

export const NewShopSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama usaha minimal 2 karakter.')
    .max(120, 'Nama usaha terlalu panjang.'),
  tagline: z.string().trim().max(240, 'Tagline maksimal 240 karakter.').optional().default(''),
  slug: z
    .string()
    .trim()
    .transform(sanitizeSlug)
    .refine((v) => v.length >= 3 && v.length <= 60, {
      message: 'Slug URL harus antara 3 hingga 60 karakter huruf/angka.',
    }),
  whatsapp: z
    .string()
    .trim()
    .transform(normalizeWhatsapp)
    .refine((v) => /^62[0-9]{8,13}$/.test(v), {
      message: 'Nomor WhatsApp harus diawali 628 / 08 dan terdiri dari 10-15 digit angka.',
    }),
  location: z
    .string()
    .trim()
    .min(2, 'Lokasi minimal 2 karakter.')
    .max(200, 'Lokasi maksimal 200 karakter.'),
  hours: z.string().trim().min(2, 'Jam operasional wajib diisi.').max(100),
});

export const NewItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama unit minimal 2 karakter.')
    .max(150, 'Nama unit maksimal 150 karakter.'),
  sku: z.string().trim().max(40, 'Kode SKU maksimal 40 karakter.').optional().default(''),
  category: z
    .string()
    .trim()
    .min(2, 'Kategori wajib dipilih atau diisi.')
    .max(80, 'Nama kategori maksimal 80 karakter.'),
  pricePerDay: z.preprocess((val) => {
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^0-9]/g, '');
      return cleaned ? Number(cleaned) : 0;
    }
    return val;
  }, z.number().positive('Tarif sewa per hari harus lebih dari Rp 0.').max(100_000_000, 'Tarif sewa melebihi batas wajar.')),
  stock: z.coerce
    .number()
    .int('Stok harus berupa bilangan bulat.')
    .min(1, 'Stok minimal 1 unit.')
    .max(10_000, 'Stok terlalu besar.'),
  spec1: z.string().trim().max(160).optional().default(''),
  spec2: z.string().trim().max(160).optional().default(''),
  spec3: z.string().trim().max(160).optional().default(''),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) =>
        !val ||
        /^https?:\/\/.+/i.test(val) ||
        val.startsWith('/') ||
        val.startsWith('data:image/'),
      {
        message: 'Format URL foto tidak valid.',
      }
    ),
});

export const CreateBookingSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Nama lengkap minimal 2 karakter.')
    .max(120, 'Nama terlalu panjang.'),
  customerPhone: z
    .string()
    .trim()
    .transform(normalizeWhatsapp)
    .refine((v) => /^62[0-9]{8,13}$/.test(v), {
      message: 'Nomor WhatsApp harus valid (contoh: 08123456789).',
    }),
  startDate: z
    .string()
    .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= getTodayIsoDate(), {
      message: 'Tanggal ambil tidak boleh di masa lalu.',
    }),
  durationDays: z.coerce.number().int().min(1).max(60),
  notes: z.string().trim().max(400, 'Catatan maksimal 400 karakter.').optional().default(''),
});

export const InviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format alamat email tidak valid.'),
  role: z.enum(['owner', 'staff']).default('staff'),
});

export const DiscountTierSchema = z.object({
  minDays: z.coerce
    .number()
    .int('Minimal hari harus bilangan bulat.')
    .min(2, 'Tier diskon minimal mulai dari 2 hari.')
    .max(60, 'Maksimal durasi sewa adalah 60 hari.'),
  discountPercent: z.coerce
    .number()
    .min(0, 'Persentase diskon minimal 0%.')
    .max(90, 'Persentase diskon maksimal 90%.'),
});

// =========================================================
// ATURAN PAKET: STARTER VS BISNIS PRO
// =========================================================

export const STARTER_MAX_ITEMS = 8;
export const SEBARALA_ADMIN_WA = '6281911821355'; // Hotline WhatsApp Resmi Sebaraja

/**
 * Cek apakah paket Bisnis PRO aktif dan belum melewati masa berlaku
 */
export function isProPlanActive(
  shop?: { plan?: string | null; proExpiresAt?: string | null } | null
): boolean {
  if (!shop || shop.plan !== 'PRO') return false;
  if (!shop.proExpiresAt) return true; // Tanpa batas waktu (Lifetime/Trial aktif)
  const expires = new Date(shop.proExpiresAt).getTime();
  if (Number.isNaN(expires)) return true;
  return expires > Date.now();
}

/**
 * Validasi apakah toko diizinkan menambah item katalog baru
 */
export function canAddRentalItem(
  shop: { plan?: string | null; proExpiresAt?: string | null } | null | undefined,
  currentItemCount: number
): boolean {
  if (isProPlanActive(shop)) {
    return true; // PRO: Tanpa batas (Unlimited)
  }
  return currentItemCount < STARTER_MAX_ITEMS;
}

/**
 * Format pesan WhatsApp otomatis untuk pengajuan upgrade ke Bisnis PRO
 */
export function formatUpgradeWhatsappMessage(
  shop: { slug: string; name: string },
  cycle: 'monthly' | 'yearly'
): string {
  const packageName = cycle === 'yearly' ? 'Bisnis PRO Tahunan (Rp 149.000 / thn)' : 'Bisnis PRO Bulanan (Rp 23.000 / bln)';
  return (
    `Halo Tim Sebaraja! 👋\n\n` +
    `Saya ingin mengajukan upgrade ke paket *${packageName}* untuk toko rental saya:\n\n` +
    `🏪 *Nama Toko:* ${shop.name}\n` +
    `🔗 *Link Katalog:* sebaraja.my.id/${shop.slug}\n` +
    `📅 *Siklus Langganan:* ${cycle === 'yearly' ? 'Tahunan (Hemat 46%)' : 'Bulanan'}\n\n` +
    `Mohon info rekening atau QRIS resmi Sebaraja untuk aktivasi toko saya. Terima kasih!`
  );
}


