import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Shop, RentalItem, ActivityLog } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// =========================================================
// DATABASE ROW TYPES (PostgreSQL snake_case)
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
  owner_pin?: string | null;
  staff_pin?: string | null;
  is_verified?: boolean | null;
  plan?: string | null;
  owner_id?: string | null;
  terms?: string[] | null;
  partner_shop?: { name: string; slug: string } | null;
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
}

export interface ActivityLogDbRow {
  id: string;
  shop_slug: string;
  actor_role: string;
  action: string;
  time: string;
}

// =========================================================
// DATA MAPPERS (Database snake_case <-> App camelCase)
// =========================================================

export const mapShopFromDb = (row: ShopDbRow): Shop => ({
  slug: row.slug,
  name: row.name,
  tagline: row.tagline || '',
  categoryType: row.category_type || 'Umum',
  location: row.location,
  mapsUrl: row.maps_url || '',
  hours: row.hours,
  whatsapp: row.whatsapp,
  ownerPin: row.owner_pin || '1234',
  staffPin: row.staff_pin || '0000',
  isVerified: row.is_verified ?? true,
  plan: row.plan || 'PRO',
  ownerId: row.owner_id || 'demo-owner',
  terms: Array.isArray(row.terms) ? row.terms : [],
  partnerShop: row.partner_shop || undefined,
});

export const mapShopToDb = (shop: Shop): ShopDbRow => ({
  slug: shop.slug,
  name: shop.name,
  tagline: shop.tagline || '',
  category_type: shop.categoryType,
  location: shop.location,
  maps_url: shop.mapsUrl || '',
  hours: shop.hours,
  whatsapp: shop.whatsapp,
  owner_pin: shop.ownerPin || '1234',
  staff_pin: shop.staffPin || '0000',
  is_verified: shop.isVerified ?? true,
  plan: shop.plan || 'PRO',
  owner_id: shop.ownerId || 'demo-owner',
  terms: shop.terms || [],
  partner_shop: shop.partnerShop || null,
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
  availableAt: row.available_at || '',
  renterNote: row.renter_note || '',
  lastUpdatedBy: row.last_updated_by || 'Owner',
  specs: Array.isArray(row.specs) ? row.specs : [],
  imageBg: row.image_bg || 'from-emerald-600 to-teal-800',
});

export const mapItemToDb = (item: RentalItem): RentalItemDbRow => ({
  id: item.id,
  shop_slug: item.shopSlug,
  sku: item.sku || '',
  name: item.name,
  category: item.category,
  icon_type: item.iconType,
  price_per_day: item.pricePerDay,
  status: item.status,
  stock: item.stock,
  available_at: item.availableAt || '',
  renter_note: item.renterNote || '',
  last_updated_by: item.lastUpdatedBy || 'Owner',
  specs: item.specs || [],
  image_bg: item.imageBg,
});

export const mapLogFromDb = (row: ActivityLogDbRow): ActivityLog => ({
  id: row.id,
  shopSlug: row.shop_slug,
  actorRole: row.actor_role,
  action: row.action,
  time: row.time,
});

export const mapLogToDb = (log: ActivityLog): ActivityLogDbRow => ({
  id: log.id,
  shop_slug: log.shopSlug,
  actor_role: log.actorRole,
  action: log.action,
  time: log.time,
});
