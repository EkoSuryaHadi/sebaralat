export type Role = 'customer' | 'staff' | 'owner';
export type ViewMode = 'saas_home' | 'catalog' | 'workspace';
export type WorkspaceTab = 'inventory' | 'bookings' | 'analytics' | 'logs' | 'settings';
export type ItemStatus = 'available' | 'rented' | 'maintenance';
export type BookingStatus = 'pending' | 'confirmed' | 'picked_up' | 'returned' | 'cancelled';
export type DeliveryMode = 'pickup' | 'delivery';
export type PaymentStatus = 'unpaid' | 'dp' | 'paid';
export type BookingSource = 'catalog' | 'walkin';

export interface TopItemAnalytics {
  itemId: string;
  itemName: string;
  totalQtyRented: number;
  bookingCount: number;
  totalRevenue: number;
}

export interface ShopAnalyticsSummary {
  realizedRevenue: number;
  pendingRevenue: number;
  totalBookings: number;
  activeOrCompletedCount: number;
  pendingCount: number;
  cancelledCount: number;
  conversionRate: number;
  averageOrderValue: number;
  topItems: TopItemAnalytics[];
}

export interface DiscountTier {
  minDays: number;
  discountPercent: number;
}

export interface BundleLine {
  itemId: string;
  qty: number;
}

export interface RentalBundle {
  id: string;
  name: string;
  description: string;
  pricePerDay: number;
  lines: BundleLine[];
}

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
  proExpiresAt?: string | null;
  billingCycle?: 'monthly' | 'yearly' | null;
  terms: string[];
  discountTiers?: DiscountTier[];
  qrisUrl?: string;
  notifyTelegramChatId?: string;
  bundles?: RentalBundle[];
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
  pickupTime?: string;
  deliveryMode?: DeliveryMode;
  paymentStatus?: PaymentStatus;
  dpAmount?: number;
  collateral?: string;
  source?: BookingSource;
  createdAt: string;
  lines?: BookingLine[];
}
