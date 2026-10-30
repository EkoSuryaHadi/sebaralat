import { z } from 'zod';
import type { RentalItem, DurationOption } from '../types/index.ts';

// =========================================================
// UTILITAS SANITASI & PERHITUNGAN MURNI
// =========================================================

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

export function calculateCartSummary(
  cart: Record<string, number>,
  items: RentalItem[],
  durationOption: DurationOption,
  availabilityMap?: Record<string, number>
): CalculatedCartSummary {
  const selectedList: (RentalItem & { qty: number; subtotal: number })[] = [];
  let totalUnits = 0;
  let totalCost = 0;

  Object.entries(cart).forEach(([itemId, qty]) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.status === 'maintenance' || qty <= 0) return;

    const maxAvail =
      availabilityMap && typeof availabilityMap[item.id] === 'number'
        ? availabilityMap[item.id]
        : item.status === 'available'
        ? item.stock
        : 0;

    if (maxAvail <= 0) return;

    const validQty = Math.min(qty, maxAvail);
    const subtotal = Math.round(item.pricePerDay * durationOption.multiplier * validQty);
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

