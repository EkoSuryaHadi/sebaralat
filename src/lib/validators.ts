import { z } from 'zod';
import type { RentalItem, DurationOption, Booking, Role } from '../types/index.ts';

// =========================================================
// UTILITAS SANITASI, KEAMANAN ROLE & PERHITUNGAN MURNI
// =========================================================

export const DEMO_SHOP_SLUGS = new Set(['borneo-rental', 'kaltim-kamera']);

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
 * P0-2: Perhitungan deterministik multiplier tarif sewa berdasarkan durasi hari (identik dengan SQL duration_multiplier).
 */
export function getDurationMultiplier(durationDays: number): number {
  if (!Number.isFinite(durationDays) || durationDays <= 1) return 1;
  const days = Math.floor(durationDays);
  if (days === 2) return 2;
  if (days >= 7) return Number((days * 0.75).toFixed(2));
  if (days >= 3) return Number((days * 0.9).toFixed(2));
  return days;
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
  totalUnits: number;
  totalCost: number;
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
  availabilityMap?: Record<string, number>
): CalculatedCartSummary {
  const selectedList: (RentalItem & { qty: number; subtotal: number })[] = [];
  let totalUnits = 0;
  let totalCost = 0;
  const effectiveMultiplier = getDurationMultiplier(durationOption.days);

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

  return { selectedList, totalUnits, totalCost };
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
  } = params;

  if (cartSummary.selectedList.length === 0) return '';

  const lines = cartSummary.selectedList
    .map((it, idx) => `${idx + 1}. *${it.name}* (${it.qty} unit) = ${formatRp(it.subtotal)}`)
    .join('\n');

  const codeLine = bookingCode ? `🔖 *Kode Booking:* ${bookingCode}\n` : '';
  const customerLine = customerName?.trim() ? `👤 *Penyewa:* ${customerName.trim()}\n` : '';
  const dateRange = endDate && endDate !== startDate ? `${startDate} s/d ${endDate}` : startDate;
  const noteLine = notes?.trim() ? `\n📝 *Catatan:* ${notes.trim()}\n` : '';

  return (
    `Halo Admin *${shopName}*, saya ingin menyewa dari katalog resmi:\n\n` +
    codeLine +
    customerLine +
    `📅 *Jadwal Sewa:* ${dateRange}\n` +
    `⏳ *Durasi Paket:* ${durationLabel}\n\n` +
    `📦 *Rincian Unit:*\n${lines}\n` +
    noteLine +
    `\n💰 *Total Estimasi:* ${formatRp(cartSummary.totalCost)}\n\n` +
    `Mohon konfirmasi ketersediaan unit tersebut. Terima kasih.`
  );
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

// =========================================================
// ATURAN PAKET: STARTER VS BISNIS PRO
// =========================================================

export const STARTER_MAX_ITEMS = 8;
export const SEBARALA_ADMIN_WA = '6281911821355'; // Hotline WhatsApp Resmi SebarAlat

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
    `Halo Tim SebarAlat! 👋\n\n` +
    `Saya ingin mengajukan upgrade ke paket *${packageName}* untuk toko rental saya:\n\n` +
    `🏪 *Nama Toko:* ${shop.name}\n` +
    `🔗 *Link Katalog:* sebaraja.com/${shop.slug}\n` +
    `📅 *Siklus Langganan:* ${cycle === 'yearly' ? 'Tahunan (Hemat 46%)' : 'Bulanan'}\n\n` +
    `Mohon info rekening atau QRIS resmi SebarAlat untuk aktivasi toko saya. Terima kasih!`
  );
}


