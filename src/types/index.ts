export type Role = 'customer' | 'staff' | 'owner';
export type ViewMode = 'saas_home' | 'catalog' | 'workspace';
export type WorkspaceTab = 'inventory' | 'bookings' | 'logs' | 'settings';
export type ItemStatus = 'available' | 'rented' | 'maintenance';
export type BookingStatus = 'pending' | 'confirmed' | 'picked_up' | 'returned' | 'cancelled';

export interface Shop {
  slug: string;
  name: string;
  tagline: string;
  categoryType: string;
  location: string;
  mapsUrl?: string;
  hours: string;
  whatsapp: string;
  isVerified?: boolean;
  plan?: 'FREE' | 'PRO';
  terms: string[];
  partnerShop?: {
    name: string;
    slug: string;
  };
  logoUrl?: string;
}

export interface ShopMember {
  shopSlug: string;
  userId: string;
  email: string;
  role: 'owner' | 'staff';
  createdAt: string;
}

export interface ShopInvite {
  id: string;
  shopSlug: string;
  email: string;
  role: 'owner' | 'staff';
  token: string;
  acceptedAt?: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface RentalItem {
  id: string;
  shopSlug: string;
  sku: string;
  name: string;
  category: string;
  iconType: 'tent' | 'zap' | 'hammer' | 'camera' | 'radio' | string;
  pricePerDay: number;
  status: ItemStatus;
  stock: number;
  availableAt: string;
  renterNote: string;
  lastUpdatedBy: string;
  specs: string[];
  imageBg: string;
  imageUrl?: string;
}

export interface ActivityLog {
  id: string;
  shopSlug: string;
  actorRole: string;
  action: string;
  time: string;
  createdAt?: string;
}

export interface DurationOption {
  days: number;
  label: string;
  multiplier: number;
  discountTag: string | null;
}

export interface CartItem extends RentalItem {
  qty: number;
  subtotal: number;
}

export interface BookingLine {
  id: string;
  bookingId: string;
  itemId: string;
  itemName: string;
  qty: number;
  unitPricePerDay: number;
  subtotal: number;
}

export interface Booking {
  id: string;
  shopSlug: string;
  code: string;
  customerName: string;
  customerPhone: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  status: BookingStatus;
  totalAmount: number;
  notes: string;
  createdAt: string;
  lines?: BookingLine[];
}
