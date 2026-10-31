import { z } from 'zod';
import { normalizeWhatsapp, sanitizeSlug } from './validators.ts';
import type { ShopMember } from '../types/index.ts';

// =========================================================
// SKEMA VALIDASI NOTIFIKASI TELEGRAM & SUPABASE WEBHOOK
// =========================================================

const SlugFieldSchema = z
  .string()
  .trim()
  .transform(sanitizeSlug)
  .refine((s) => s.length >= 3 && s.length <= 60, {
    message: 'Slug toko tidak valid.',
  });

const OptionalOriginSchema = z
  .string()
  .trim()
  .url()
  .optional()
  .catch(undefined);

export const TelegramShopCreatedEventSchema = z.object({
  event: z.literal('shop_created'),
  shopSlug: SlugFieldSchema,
  name: z.string().trim().max(120).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  location: z.string().trim().max(200).optional(),
  ownerEmail: z.string().trim().max(160).optional(),
  siteOrigin: OptionalOriginSchema,
});

export const TelegramMemberJoinedEventSchema = z.object({
  event: z.literal('member_joined'),
  shopSlug: SlugFieldSchema,
  shopName: z.string().trim().max(120).optional(),
  role: z.enum(['owner', 'staff']).optional(),
  email: z.string().trim().max(160).optional(),
  siteOrigin: OptionalOriginSchema,
});

export const TelegramNotifyRequestSchema = z.discriminatedUnion('event', [
  TelegramShopCreatedEventSchema,
  TelegramMemberJoinedEventSchema,
]);

export type TelegramNotifyRequest = z.infer<typeof TelegramNotifyRequestSchema>;

// Dukungan opsional untuk Supabase Database Webhook (INSERT pada shops / shop_members)
const SupabaseShopInsertWebhookSchema = z.object({
  type: z.literal('INSERT'),
  table: z.literal('shops'),
  schema: z.string().optional(),
  record: z.object({
    slug: z.string().min(3),
    name: z.string(),
    location: z.string().optional().default('-'),
    whatsapp: z.string().optional().default(''),
    created_at: z.string().optional(),
  }),
});

const SupabaseMemberInsertWebhookSchema = z.object({
  type: z.literal('INSERT'),
  table: z.literal('shop_members'),
  schema: z.string().optional(),
  record: z.object({
    shop_slug: z.string().min(3),
    user_id: z.string(),
    email: z.string().optional().default(''),
    role: z.enum(['owner', 'staff']),
    created_at: z.string().optional(),
  }),
});

export const SupabaseWebhookPayloadSchema = z.discriminatedUnion('table', [
  SupabaseShopInsertWebhookSchema,
  SupabaseMemberInsertWebhookSchema,
]);

export type SupabaseWebhookPayload = z.infer<typeof SupabaseWebhookPayloadSchema>;

// =========================================================
// FORMATTER HTML TELEGRAM & KEAMANAN SANITASI
// =========================================================

export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatWitaTimestamp(isoOrDate?: string | Date): string {
  const date = isoOrDate ? new Date(isoOrDate) : new Date();
  const validDate = Number.isNaN(date.getTime()) ? new Date() : date;

  try {
    const formatted = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Makassar',
    }).format(validDate);
    return `${formatted} WITA`;
  } catch {
    return `${validDate.toISOString()} UTC`;
  }
}

function normalizeOrigin(origin?: string): string {
  if (!origin) return 'https://sebaraja.com';
  return origin.replace(/\/+$/, '');
}

export interface ShopCreatedAlertInput {
  shopSlug: string;
  name: string;
  whatsapp?: string;
  location?: string;
  ownerEmail?: string;
  siteOrigin?: string;
  createdAt?: string | Date;
  totalShops?: number | null;
}

export function formatShopCreatedTelegramMessage(input: ShopCreatedAlertInput): string {
  const cleanSlug = sanitizeSlug(input.shopSlug);
  const origin = normalizeOrigin(input.siteOrigin);
  const shopUrl = `${origin}/${cleanSlug}`;
  const cleanWa = input.whatsapp ? normalizeWhatsapp(input.whatsapp) : '';
  const waDisplay = cleanWa
    ? `<a href="https://wa.me/${escapeTelegramHtml(cleanWa)}">+${escapeTelegramHtml(cleanWa)}</a>`
    : '-';

  const lines = [
    '🏪 <b>TOKO BARU SEBARAJA!</b>',
    '━━━━━━━━━━━━━━━━━━',
    `<b>Nama Toko :</b> ${escapeTelegramHtml(input.name || cleanSlug)}`,
    `<b>Tautan    :</b> <a href="${escapeTelegramHtml(shopUrl)}">${escapeTelegramHtml(shopUrl)}</a>`,
    `<b>WhatsApp  :</b> ${waDisplay}`,
    `<b>Lokasi    :</b> ${escapeTelegramHtml(input.location || '-')}`,
    `<b>Pemilik   :</b> ${escapeTelegramHtml(input.ownerEmail || '-')}`,
    `<b>Waktu     :</b> ${escapeTelegramHtml(formatWitaTimestamp(input.createdAt))}`,
  ];

  if (typeof input.totalShops === 'number' && Number.isFinite(input.totalShops)) {
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push(`📊 <b>Total Toko Saat Ini:</b> ${input.totalShops} Toko`);
  }

  return lines.join('\n');
}

export interface MemberJoinedAlertInput {
  shopSlug: string;
  shopName?: string;
  email?: string;
  role: 'owner' | 'staff';
  siteOrigin?: string;
  joinedAt?: string | Date;
  totalShopMembers?: number | null;
}

export function formatMemberJoinedTelegramMessage(input: MemberJoinedAlertInput): string {
  const cleanSlug = sanitizeSlug(input.shopSlug);
  const origin = normalizeOrigin(input.siteOrigin);
  const shopUrl = `${origin}/${cleanSlug}`;
  const roleLabel = input.role === 'owner' ? 'Owner Toko' : 'Staf Gudang';
  const shopTitle = input.shopName
    ? `${escapeTelegramHtml(input.shopName)} (<a href="${escapeTelegramHtml(shopUrl)}"><code>/${escapeTelegramHtml(cleanSlug)}</code></a>)`
    : `<a href="${escapeTelegramHtml(shopUrl)}"><code>/${escapeTelegramHtml(cleanSlug)}</code></a>`;

  const lines = [
    '👥 <b>MEMBER BARU JOIN TOKO!</b>',
    '━━━━━━━━━━━━━━━━━━',
    `<b>Email     :</b> ${escapeTelegramHtml(input.email || '-')}`,
    `<b>Toko      :</b> ${shopTitle}`,
    `<b>Role      :</b> ${escapeTelegramHtml(roleLabel)}`,
    `<b>Waktu     :</b> ${escapeTelegramHtml(formatWitaTimestamp(input.joinedAt))}`,
  ];

  if (
    typeof input.totalShopMembers === 'number' &&
    Number.isFinite(input.totalShopMembers)
  ) {
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push(`📊 <b>Total Anggota Toko Ini:</b> ${input.totalShopMembers} Orang`);
  }

  return lines.join('\n');
}

// =========================================================
// DEDUPLIKASI & DETEKSI ANGGOTA BARU
// =========================================================

const notificationDedupeCache = new Map<string, number>();
const MAX_DEDUPE_ENTRIES = 500;

export function claimNotificationKey(
  key: string,
  ttlMs = 10 * 60 * 1000,
  nowMs = Date.now()
): boolean {
  for (const [k, expiresAt] of notificationDedupeCache.entries()) {
    if (expiresAt <= nowMs) {
      notificationDedupeCache.delete(k);
    }
  }

  const existingExpiry = notificationDedupeCache.get(key);
  if (existingExpiry && existingExpiry > nowMs) {
    return false;
  }

  if (notificationDedupeCache.size >= MAX_DEDUPE_ENTRIES) {
    const oldestKey = notificationDedupeCache.keys().next().value;
    if (oldestKey) {
      notificationDedupeCache.delete(oldestKey);
    }
  }

  notificationDedupeCache.set(key, nowMs + ttlMs);
  return true;
}

export function resetNotificationDedupeCache(): void {
  notificationDedupeCache.clear();
}

export function detectNewlyClaimedMemberships(
  beforeSlugs: Iterable<string>,
  afterMembers: ShopMember[]
): ShopMember[] {
  const existingSet = new Set(Array.from(beforeSlugs, (s) => s.toLowerCase()));
  return afterMembers.filter((m) => !existingSet.has(m.shopSlug.toLowerCase()));
}

// =========================================================
// PENGIRIMAN PESAN KE TELEGRAM BOT API (SERVER & CLIENT HELPER)
// =========================================================

function redactSecret(message: string, secret: string): string {
  if (!secret) return message;
  return message.split(secret).join('[REDACTED_BOT_TOKEN]');
}

export async function sendTelegramBotMessage(params: {
  botToken: string;
  chatId: string;
  html: string;
  fetchFn?: typeof fetch;
}): Promise<{ ok: boolean; error?: string }> {
  const botToken = params.botToken.trim();
  const chatId = params.chatId.trim();
  const fetchImpl = params.fetchFn ?? fetch;

  if (!botToken || !chatId) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum diatur.' };
  }

  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: params.html,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal:
        typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
          ? AbortSignal.timeout(8000)
          : undefined,
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      return {
        ok: false,
        error: redactSecret(
          `Telegram API HTTP ${response.status}: ${errBody.slice(0, 200)}`,
          botToken
        ),
      };
    }

    return { ok: true };
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: redactSecret(rawMsg, botToken),
    };
  }
}

/**
 * Helper non-blocking dari sisi klien untuk memicu endpoint internal `/api/notify`.
 * Kegagalan jaringan/konfigurasi diabaikan dengan aman agar alur utama user tidak pernah terganggu.
 */
export async function triggerTelegramClientAlert(
  payload: TelegramNotifyRequest,
  accessToken?: string | null
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    await fetch('/api/notify', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...payload,
        siteOrigin: payload.siteOrigin || window.location.origin,
      }),
      keepalive: true,
    });
  } catch {
    // Non-blocking: jangan pernah mengganggu pembuatan toko atau login staf
  }
}

