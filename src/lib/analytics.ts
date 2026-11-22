import { supabase, isSupabaseConfigured } from './supabase.ts';

export type AnalyticsEventType =
  | 'page_view'
  | 'catalog_view'
  | 'item_detail_view'
  | 'add_to_cart'
  | 'wa_checkout_click'
  | 'booking_created'
  | 'shop_signup_started'
  | 'shop_created';

export type AnalyticsDeviceType = 'mobile' | 'tablet' | 'desktop';

const VISITOR_STORAGE_KEY = 'sebaraja_visitor_id';
const SESSION_STORAGE_KEY = 'sebaraja_session_id';
const UTM_STORAGE_KEY = 'sebaraja_utm_params';
const DEDUP_WINDOW_MS = 15_000;

const recentTrackTimestamps = new Map<string, number>();

export function isLikelyBotUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;
  return /(bot|crawl|spider|slurp|mediapartners|headless|lighthouse|pingdom|uptime|curl|wget|python-requests)/i.test(
    userAgent
  );
}

export function detectDeviceType(userAgent: string, viewportWidth?: number): AnalyticsDeviceType {
  const ua = (userAgent || '').toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) {
    return 'tablet';
  }
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(ua)) {
    return 'mobile';
  }
  if (typeof viewportWidth === 'number') {
    if (viewportWidth < 640) return 'mobile';
    if (viewportWidth < 1024) return 'tablet';
  }
  return 'desktop';
}

export function extractReferrerHost(referrer: string, currentHost?: string): string {
  const raw = (referrer || '').trim();
  if (!raw) return 'Direct';
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    if (!host) return 'Direct';
    if (currentHost && host === currentHost.replace(/^www\./i, '').toLowerCase()) {
      return 'Direct';
    }
    if (host.includes('instagram.com') || host === 'l.instagram.com') return 'Instagram';
    if (host.includes('wa.me') || host.includes('whatsapp.com')) return 'WhatsApp';
    if (host.includes('tiktok.com')) return 'TikTok';
    if (host.includes('facebook.com') || host === 'fb.com' || host === 'l.facebook.com') return 'Facebook';
    if (host.includes('google.')) return 'Google';
    if (host === 't.co' || host.includes('twitter.com') || host.includes('x.com')) return 'X / Twitter';
    return host.slice(0, 120);
  } catch {
    return 'Direct';
  }
}

function generateRandomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'anon_ssr';
  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing && existing.length >= 6) return existing;
    const created = generateRandomId('v');
    window.localStorage.setItem(VISITOR_STORAGE_KEY, created);
    return created;
  } catch {
    return generateRandomId('v');
  }
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const created = generateRandomId('s');
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return '';
  }
}

function readPersistedUtm(): { utmSource: string; utmMedium: string; utmCampaign: string } {
  if (typeof window === 'undefined') {
    return { utmSource: '', utmMedium: '', utmCampaign: '' };
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const source = (params.get('utm_source') || '').trim().slice(0, 80);
    const medium = (params.get('utm_medium') || '').trim().slice(0, 80);
    const campaign = (params.get('utm_campaign') || '').trim().slice(0, 100);
    if (source || medium || campaign) {
      const payload = { utmSource: source, utmMedium: medium, utmCampaign: campaign };
      window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(payload));
      return payload;
    }
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<{
        utmSource: string;
        utmMedium: string;
        utmCampaign: string;
      }>;
      return {
        utmSource: (parsed.utmSource || '').slice(0, 80),
        utmMedium: (parsed.utmMedium || '').slice(0, 80),
        utmCampaign: (parsed.utmCampaign || '').slice(0, 100),
      };
    }
  } catch {
    // Abaikan error storage
  }
  return { utmSource: '', utmMedium: '', utmCampaign: '' };
}

export interface TrackEventParams {
  eventType: AnalyticsEventType;
  path?: string;
  shopSlug?: string | null;
}

export async function trackAnalyticsEvent({
  eventType,
  path,
  shopSlug,
}: TrackEventParams): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!supabase || !isSupabaseConfigured) return;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (isLikelyBotUserAgent(ua)) return;

  const resolvedPath = (path || window.location.pathname || '/').slice(0, 200);
  if (resolvedPath.startsWith('/admin') || resolvedPath.startsWith('/api')) return;

  const dedupKey = `${eventType}:${resolvedPath}:${shopSlug || ''}`;
  const now = Date.now();
  const lastSent = recentTrackTimestamps.get(dedupKey);
  if (
    (eventType === 'page_view' || eventType === 'catalog_view' || eventType === 'shop_signup_started') &&
    lastSent &&
    now - lastSent < DEDUP_WINDOW_MS
  ) {
    return;
  }
  recentTrackTimestamps.set(dedupKey, now);

  const visitorId = getOrCreateVisitorId();
  const sessionId = getOrCreateSessionId();
  const referrerHost = extractReferrerHost(document.referrer || '', window.location.hostname);
  const { utmSource, utmMedium, utmCampaign } = readPersistedUtm();
  const deviceType = detectDeviceType(ua, window.innerWidth);

  try {
    await supabase.rpc('log_analytics_event', {
      p_event_type: eventType,
      p_path: resolvedPath,
      p_visitor_id: visitorId,
      p_shop_slug: shopSlug || null,
      p_session_id: sessionId,
      p_referrer_host: referrerHost,
      p_utm_source: utmSource,
      p_utm_medium: utmMedium,
      p_utm_campaign: utmCampaign,
      p_device_type: deviceType,
    });
  } catch {
    // Telemetry tidak boleh mengganggu pengalaman pengguna
  }
}
