import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  Shop,
  RentalItem,
  ActivityLog,
  Booking,
  BookingLine,
  ShopMember,
  ShopInvite,
} from '../types/index.ts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Buat klien Supabase baru untuk Server Component (tanpa state sesi bersama)
 */
export function createServerSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// =========================================================
// DATABASE ROW TYPES (PostgreSQL snake_case - TANPA PIN!)
// =========================================================

export interface ShopDbRow {
  slug: string;
  name: string;
  tagline?: string | null;
  category_type?: string | null;
  location: string;
  maps_url?: string | null;
  hours: string;
  whatsapp: string;
  is_verified?: boolean | null;
  plan?: 'FREE' | 'PRO' | string | null;
  terms?: string[] | null;
  partner_shop?: { name: string; slug: string } | null;
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ShopMemberDbRow {
  shop_slug: string;
  user_id: string;
  email: string;
  role: 'owner' | 'staff';
  created_at: string;
}

export interface ShopInviteDbRow {
  id: string;
  shop_slug: string;
  email: string;
  role: 'owner' | 'staff';
  token: string;
  accepted_at?: string | null;
  expires_at: string;
  created_at: string;
}

export interface RentalItemDbRow {
  id: string;
  shop_slug: string;
  sku?: string | null;
  name: string;
  category: string;
  icon_type?: string | null;
  price_per_day: number;
  status: 'available' | 'rented' | 'maintenance';
  stock: number;
  available_at?: string | null;
  renter_note?: string | null;
  last_updated_by?: string | null;
  specs?: string[] | null;
  image_bg?: string | null;
  image_url?: string | null;
}

export interface ActivityLogDbRow {
  id: string;
  shop_slug: string;
  actor_id?: string | null;
  actor_role: string;
  action: string;
  time?: string | null;
  created_at?: string | null;
}

export interface BookingLineDbRow {
  id: string;
  booking_id: string;
  item_id: string;
  item_name: string;
  qty: number;
  unit_price_per_day: number;
  subtotal: number;
}

export interface BookingDbRow {
  id: string;
  shop_slug: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  status: 'pending' | 'confirmed' | 'picked_up' | 'returned' | 'cancelled';
  total_amount: number;
  notes?: string | null;
  created_at: string;
  booking_lines?: BookingLineDbRow[];
}

// =========================================================
// DATA MAPPERS (Database snake_case <-> App camelCase)
// =========================================================

export function formatTimestampLabel(iso?: string | null, fallback?: string | null): string {
  if (!iso) return fallback || 'Baru saja';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const mapShopFromDb = (row: ShopDbRow): Shop => ({
  slug: row.slug,
  name: row.name,
  tagline: row.tagline || '',
  categoryType: row.category_type || 'Umum',
  location: row.location,
  mapsUrl: row.maps_url || '',
  hours: row.hours,
  whatsapp: row.whatsapp,
  isVerified: Boolean(row.is_verified),
  plan: row.plan === 'PRO' ? 'PRO' : 'FREE',
  terms: Array.isArray(row.terms) ? row.terms : [],
  partnerShop: row.partner_shop || undefined,
  logoUrl: row.logo_url || '',
});

export const mapShopToDb = (shop: Shop): Omit<ShopDbRow, 'is_verified' | 'plan' | 'created_at' | 'updated_at'> => ({
  slug: shop.slug,
  name: shop.name,
  tagline: shop.tagline || '',
  category_type: shop.categoryType,
  location: shop.location,
  maps_url: shop.mapsUrl || '',
  hours: shop.hours,
  whatsapp: shop.whatsapp,
  terms: shop.terms || [],
  partner_shop: shop.partnerShop || null,
  logo_url: shop.logoUrl || '',
});

export const mapItemFromDb = (row: RentalItemDbRow): RentalItem => ({
  id: row.id,
  shopSlug: row.shop_slug,
  sku: row.sku || '',
  name: row.name,
  category: row.category,
  iconType: row.icon_type || 'tent',
  pricePerDay: Number(row.price_per_day),
  status: row.status,
  stock: Number(row.stock),
  availableAt: row.available_at ? formatTimestampLabel(row.available_at, row.available_at) : '',
  renterNote: row.renter_note || '',
  lastUpdatedBy: row.last_updated_by || 'Owner',
  specs: Array.isArray(row.specs) ? row.specs : [],
  imageBg: row.image_bg || 'from-emerald-600 to-teal-800',
  imageUrl: row.image_url || undefined,
});

export const mapItemToDb = (item: RentalItem): RentalItemDbRow => {
  let isoAvailableAt: string | null = null;
  if (item.availableAt && item.availableAt.trim()) {
    const parsed = new Date(item.availableAt);
    if (!Number.isNaN(parsed.getTime())) {
      isoAvailableAt = parsed.toISOString();
    }
  }

  return {
    id: item.id,
    shop_slug: item.shopSlug,
    sku: item.sku || 'UNIT',
    name: item.name,
    category: item.category,
    icon_type: item.iconType,
    price_per_day: item.pricePerDay,
    status: item.status,
    stock: item.stock,
    available_at: isoAvailableAt,
    renter_note: item.renterNote || '',
    last_updated_by: item.lastUpdatedBy || 'Owner',
    specs: item.specs || [],
    image_bg: item.imageBg,
    image_url: item.imageUrl || null,
  };
};

export const mapLogFromDb = (row: ActivityLogDbRow): ActivityLog => ({
  id: row.id,
  shopSlug: row.shop_slug,
  actorRole: row.actor_role,
  action: row.action,
  time: formatTimestampLabel(row.created_at, row.time),
  createdAt: row.created_at || undefined,
});

export const mapMemberFromDb = (row: ShopMemberDbRow): ShopMember => ({
  shopSlug: row.shop_slug,
  userId: row.user_id,
  email: row.email,
  role: row.role,
  createdAt: row.created_at,
});

export const mapInviteFromDb = (row: ShopInviteDbRow): ShopInvite => ({
  id: row.id,
  shopSlug: row.shop_slug,
  email: row.email,
  role: row.role,
  token: row.token,
  acceptedAt: row.accepted_at,
  expiresAt: row.expires_at,
  createdAt: row.created_at,
});

export const mapBookingLineFromDb = (row: BookingLineDbRow): BookingLine => ({
  id: row.id,
  bookingId: row.booking_id,
  itemId: row.item_id,
  itemName: row.item_name,
  qty: Number(row.qty),
  unitPricePerDay: Number(row.unit_price_per_day),
  subtotal: Number(row.subtotal),
});

export const mapBookingFromDb = (row: BookingDbRow): Booking => ({
  id: row.id,
  shopSlug: row.shop_slug,
  code: row.code,
  customerName: row.customer_name,
  customerPhone: row.customer_phone,
  startDate: row.start_date,
  endDate: row.end_date,
  durationDays: Number(row.duration_days),
  status: row.status,
  totalAmount: Number(row.total_amount),
  notes: row.notes || '',
  createdAt: row.created_at,
  lines: Array.isArray(row.booking_lines)
    ? row.booking_lines.map(mapBookingLineFromDb)
    : undefined,
});
