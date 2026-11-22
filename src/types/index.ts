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

export interface PlatformShopAnalyticsRow {
  slug: string;
  name: string;
  location: string;
  whatsapp: string;
  plan: 'FREE' | 'PRO';
  is_verified: boolean;
  pro_expires_at: string | null;
  billing_cycle: string | null;
  created_at: string;
  has_qris: boolean;
  has_telegram: boolean;
  item_count: number;
  booking_count: number;
  gmv: number;
  member_count: number;
  views_period?: number;
  wa_clicks_period?: number;
}

export interface PlatformTrafficDailyPoint {
  date: string;
  label: string;
  views: number;
  unique_visitors: number;
  catalog_views: number;
  wa_clicks: number;
}

export interface PlatformTrafficSourceRow {
  source: string;
  views: number;
  unique_visitors: number;
}

export interface PlatformTrafficDeviceRow {
  device: 'mobile' | 'tablet' | 'desktop';
  views: number;
  unique_visitors: number;
}

export interface PlatformTrafficPageRow {
  path: string;
  shop_slug: string | null;
  views: number;
  unique_visitors: number;
}

export interface PlatformTrafficSummary {
  period_days: number;
  total_page_views: number;
  unique_visitors: number;
  today_views: number;
  today_unique_visitors: number;
  landing_views: number;
  catalog_views: number;
  item_detail_views: number;
  add_to_carts: number;
  wa_checkout_clicks: number;
  booking_created_events: number;
  shop_signup_started: number;
  shop_created_events: number;
  daily_series: PlatformTrafficDailyPoint[];
  top_referrers: PlatformTrafficSourceRow[];
  device_breakdown: PlatformTrafficDeviceRow[];
  top_pages: PlatformTrafficPageRow[];
}

export interface PlatformAnalyticsPayload {
  summary: {
    total_shops: number;
    pro_shops: number;
    free_shops: number;
    verified_shops: number;
    qris_adopted_shops: number;
    telegram_adopted_shops: number;
    total_items: number;
    total_bookings: number;
    walkin_bookings: number;
    confirmed_bookings: number;
    total_gmv: number;
    pending_gmv: number;
    total_members: number;
  };
  shops: PlatformShopAnalyticsRow[];
  recent_bookings: {
    id: string;
    shop_slug: string;
    shop_name: string;
    code: string;
    customer_name: string;
    total_amount: number;
    status: BookingStatus;
    source: BookingSource;
    payment_status: PaymentStatus;
    created_at: string;
  }[];
  traffic?: PlatformTrafficSummary;
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
