import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, createServerSupabaseClient } from '@/lib/supabase';
import {
  TelegramNotifyRequestSchema,
  SupabaseWebhookPayloadSchema,
  formatShopCreatedTelegramMessage,
  formatMemberJoinedTelegramMessage,
  claimNotificationKey,
  sendTelegramBotMessage,
} from '@/lib/telegram';

const FRESHNESS_WINDOW_MS = 15 * 60 * 1000; // 15 menit

function isValidWebhookSecret(provided: string | null, expected: string): boolean {
  if (!provided || !expected) return false;
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function isWithinFreshnessWindow(isoTimestamp?: string | null): boolean {
  if (!isoTimestamp) return true;
  const parsed = Date.parse(isoTimestamp);
  if (Number.isNaN(parsed)) return true;
  return Date.now() - parsed <= FRESHNESS_WINDOW_MS;
}

export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || '';
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || '';

  if (!botToken || !chatId) {
    return Response.json(
      {
        ok: false,
        skipped: true,
        reason: 'TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum dikonfigurasi.',
      },
      { status: 200 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Payload JSON tidak valid.' }, { status: 400 });
  }

  const trustedOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin;

  // =========================================================
  // JALUR 1: SUPABASE DATABASE WEBHOOK (OPSIONAL VIA SECRET HEADER)
  // =========================================================
  const providedWebhookSecret = request.headers.get('x-webhook-secret');
  if (webhookSecret && isValidWebhookSecret(providedWebhookSecret, webhookSecret)) {
    const parsedWebhook = SupabaseWebhookPayloadSchema.safeParse(rawBody);
    if (!parsedWebhook.success) {
      return Response.json(
        { ok: false, error: 'Format payload Supabase Webhook tidak dikenali.' },
        { status: 400 }
      );
    }

    const serverSb = createServerSupabaseClient();
    const hook = parsedWebhook.data;

    if (hook.table === 'shops') {
      const rec = hook.record;
      if (!claimNotificationKey(`shop:${rec.slug}`)) {
        return Response.json({ ok: true, deduplicated: true });
      }

      let totalShops: number | null = null;
      if (serverSb) {
        const { count } = await serverSb
          .from('shops')
          .select('slug', { count: 'exact', head: true });
        totalShops = count;
      }

      const html = formatShopCreatedTelegramMessage({
        shopSlug: rec.slug,
        name: rec.name,
        whatsapp: rec.whatsapp,
        location: rec.location,
        siteOrigin: trustedOrigin,
        createdAt: rec.created_at,
        totalShops,
      });

      const sendRes = await sendTelegramBotMessage({ botToken, chatId, html });
      if (!sendRes.ok) {
        console.error('[TelegramNotify] Gagal mengirim webhook toko baru:', sendRes.error);
        return Response.json({ ok: false, error: 'Gagal mengirim ke Telegram.' }, { status: 502 });
      }
      return Response.json({ ok: true });
    }

    // hook.table === 'shop_members'
    const rec = hook.record;
    let shopName: string | undefined;
    if (serverSb) {
      const { data: shopRow } = await serverSb
        .from('shops')
        .select('name, created_at')
        .eq('slug', rec.shop_slug)
        .maybeSingle();

      if (shopRow) {
        shopName = shopRow.name;
        // Abaikan baris owner awal yang otomatis dibuat bersamaan dengan pembuatan toko baru
        if (
          rec.role === 'owner' &&
          shopRow.created_at &&
          rec.created_at &&
          Math.abs(Date.parse(shopRow.created_at) - Date.parse(rec.created_at)) < 15_000
        ) {
          return Response.json({ ok: true, skipped: true, reason: 'initial_shop_owner' });
        }
      }
    }

    const dedupeKey = `join:${rec.user_id}:${rec.shop_slug}:${rec.role}`;
    if (!claimNotificationKey(dedupeKey)) {
      return Response.json({ ok: true, deduplicated: true });
    }

    const html = formatMemberJoinedTelegramMessage({
      shopSlug: rec.shop_slug,
      shopName,
      email: rec.email,
      role: rec.role,
      siteOrigin: trustedOrigin,
      joinedAt: rec.created_at,
    });

    const sendRes = await sendTelegramBotMessage({ botToken, chatId, html });
    if (!sendRes.ok) {
      console.error('[TelegramNotify] Gagal mengirim webhook join member:', sendRes.error);
      return Response.json({ ok: false, error: 'Gagal mengirim ke Telegram.' }, { status: 502 });
    }
    return Response.json({ ok: true });
  }

  // =========================================================
  // VALIDASI EVENT DARI APLIKASI WEB
  // =========================================================
  const parsedReq = TelegramNotifyRequestSchema.safeParse(rawBody);
  if (!parsedReq.success) {
    return Response.json(
      { ok: false, error: 'Payload event notifikasi tidak valid.' },
      { status: 400 }
    );
  }
  const eventPayload = parsedReq.data;

  // =========================================================
  // JALUR 2: VERIFIKASI SESI SUPABASE (PRODUKSI & STAGING)
  // =========================================================
  if (isSupabaseConfigured) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const authHeader = request.headers.get('authorization') || '';
    const accessToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';

    if (!accessToken) {
      return Response.json({ ok: false, error: 'Autentikasi diperlukan.' }, { status: 401 });
    }

    const userSb = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: authData, error: authError } = await userSb.auth.getUser(accessToken);
    if (authError || !authData.user) {
      return Response.json({ ok: false, error: 'Sesi tidak valid.' }, { status: 401 });
    }

    const currentUser = authData.user;

    if (eventPayload.event === 'shop_created') {
      const [{ data: memberRow }, { data: shopRow }, { count: totalShops }] =
        await Promise.all([
          userSb
            .from('shop_members')
            .select('shop_slug, role, email, created_at')
            .eq('shop_slug', eventPayload.shopSlug)
            .eq('user_id', currentUser.id)
            .eq('role', 'owner')
            .maybeSingle(),
          userSb
            .from('shops')
            .select('slug, name, whatsapp, location, created_at')
            .eq('slug', eventPayload.shopSlug)
            .maybeSingle(),
          userSb.from('shops').select('slug', { count: 'exact', head: true }),
        ]);

      if (!memberRow || !shopRow) {
        return Response.json(
          { ok: false, error: 'Kepemilikan toko tidak terverifikasi.' },
          { status: 403 }
        );
      }

      if (!isWithinFreshnessWindow(shopRow.created_at)) {
        return Response.json({ ok: true, skipped: true, reason: 'stale_shop_event' });
      }

      if (!claimNotificationKey(`shop:${shopRow.slug}`)) {
        return Response.json({ ok: true, deduplicated: true });
      }

      const html = formatShopCreatedTelegramMessage({
        shopSlug: shopRow.slug,
        name: shopRow.name,
        whatsapp: shopRow.whatsapp,
        location: shopRow.location,
        ownerEmail: currentUser.email || memberRow.email,
        siteOrigin: trustedOrigin,
        createdAt: shopRow.created_at,
        totalShops,
      });

      const sendRes = await sendTelegramBotMessage({ botToken, chatId, html });
      if (!sendRes.ok) {
        console.error('[TelegramNotify] Gagal mengirim alert toko baru:', sendRes.error);
        return Response.json({ ok: false, error: 'Gagal mengirim ke Telegram.' }, { status: 502 });
      }
      return Response.json({ ok: true });
    }

    // eventPayload.event === 'member_joined'
    const [{ data: memberRow }, { data: shopRow }, { count: totalShopMembers }] =
      await Promise.all([
        userSb
          .from('shop_members')
          .select('shop_slug, role, email, created_at')
          .eq('shop_slug', eventPayload.shopSlug)
          .eq('user_id', currentUser.id)
          .maybeSingle(),
        userSb
          .from('shops')
          .select('slug, name, created_at')
          .eq('slug', eventPayload.shopSlug)
          .maybeSingle(),
        userSb
          .from('shop_members')
          .select('user_id', { count: 'exact', head: true })
          .eq('shop_slug', eventPayload.shopSlug),
      ]);

    if (!memberRow) {
      return Response.json(
        { ok: false, error: 'Keanggotaan toko tidak ditemukan.' },
        { status: 403 }
      );
    }

    if (!isWithinFreshnessWindow(memberRow.created_at)) {
      return Response.json({ ok: true, skipped: true, reason: 'stale_member_event' });
    }

    if (
      memberRow.role === 'owner' &&
      shopRow?.created_at &&
      memberRow.created_at &&
      Math.abs(Date.parse(shopRow.created_at) - Date.parse(memberRow.created_at)) < 15_000
    ) {
      return Response.json({ ok: true, skipped: true, reason: 'initial_shop_owner' });
    }

    const dedupeKey = `join:${currentUser.id}:${memberRow.shop_slug}:${memberRow.role}`;
    if (!claimNotificationKey(dedupeKey)) {
      return Response.json({ ok: true, deduplicated: true });
    }

    const html = formatMemberJoinedTelegramMessage({
      shopSlug: memberRow.shop_slug,
      shopName: shopRow?.name,
      email: currentUser.email || memberRow.email,
      role: memberRow.role,
      siteOrigin: trustedOrigin,
      joinedAt: memberRow.created_at,
      totalShopMembers:
        typeof totalShopMembers === 'number' && totalShopMembers > 0
          ? totalShopMembers
          : null,
    });

    const sendRes = await sendTelegramBotMessage({ botToken, chatId, html });
    if (!sendRes.ok) {
      console.error('[TelegramNotify] Gagal mengirim alert join member:', sendRes.error);
      return Response.json({ ok: false, error: 'Gagal mengirim ke Telegram.' }, { status: 502 });
    }
    return Response.json({ ok: true });
  }

  // =========================================================
  // JALUR 3: MODE PENGEMBANGAN LOKAL (TANPA SUPABASE DI DEV)
  // =========================================================
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  if (eventPayload.event === 'shop_created') {
    if (!claimNotificationKey(`dev-shop:${eventPayload.shopSlug}`)) {
      return Response.json({ ok: true, deduplicated: true });
    }
    const html = formatShopCreatedTelegramMessage({
      shopSlug: eventPayload.shopSlug,
      name: eventPayload.name || eventPayload.shopSlug,
      whatsapp: eventPayload.whatsapp,
      location: eventPayload.location,
      ownerEmail: eventPayload.ownerEmail || 'dev-preview@localhost',
      siteOrigin: trustedOrigin,
    });
    const sendRes = await sendTelegramBotMessage({ botToken, chatId, html });
    if (!sendRes.ok) {
      console.error('[TelegramNotify] Dev alert gagal:', sendRes.error);
      return Response.json({ ok: false, error: sendRes.error }, { status: 502 });
    }
    return Response.json({ ok: true, mode: 'development' });
  }

  if (!claimNotificationKey(`dev-join:${eventPayload.email || 'anon'}:${eventPayload.shopSlug}`)) {
    return Response.json({ ok: true, deduplicated: true });
  }
  const html = formatMemberJoinedTelegramMessage({
    shopSlug: eventPayload.shopSlug,
    shopName: eventPayload.shopName,
    email: eventPayload.email || 'dev-staff@localhost',
    role: eventPayload.role || 'staff',
    siteOrigin: trustedOrigin,
  });
  const sendRes = await sendTelegramBotMessage({ botToken, chatId, html });
  if (!sendRes.ok) {
    console.error('[TelegramNotify] Dev alert gagal:', sendRes.error);
    return Response.json({ ok: false, error: sendRes.error }, { status: 502 });
  }
  return Response.json({ ok: true, mode: 'development' });
}

