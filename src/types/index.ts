export type Role = 'customer' | 'staff' | 'owner' | 'superadmin';
export type ViewMode = 'saas_home' | 'catalog' | 'workspace';
export type WorkspaceTab = 'inventory' | 'logs' | 'settings';
export type ItemStatus = 'available' | 'rented' | 'maintenance';

export interface Shop {
  slug: string;
  name: string;
  tagline: string;
  categoryType: string;
  location: string;
  mapsUrl?: string;
  hours: string;
  whatsapp: string;
  ownerPin?: string;
  staffPin?: string;
  isVerified?: boolean;
  plan?: string;
  ownerId?: string;
  terms: string[];
  partnerShop?: {
    name: string;
    slug: string;
  };
  logoUrl?: string;
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
