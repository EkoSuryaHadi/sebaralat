import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeTelegramHtml,
  formatWitaTimestamp,
  formatShopCreatedTelegramMessage,
  formatMemberJoinedTelegramMessage,
  TelegramNotifyRequestSchema,
  SupabaseWebhookPayloadSchema,
  claimNotificationKey,
  resetNotificationDedupeCache,
  detectNewlyClaimedMemberships,
  sendTelegramBotMessage,
} from '../telegram.ts';
import type { ShopMember } from '../../types/index.ts';

describe('Utilitas & Keamanan Notifikasi Telegram', () => {
  beforeEach(() => {
    resetNotificationDedupeCache();
  });

  it('escapeTelegramHtml mensterilkan karakter HTML berbahaya (<, >, &, ")', () => {
    const raw = 'Rental <Tenda> & "Kamera" Murah';
    assert.equal(
      escapeTelegramHtml(raw),
      'Rental &lt;Tenda&gt; &amp; &quot;Kamera&quot; Murah'
    );
  });

  it('formatWitaTimestamp memformat waktu ke zona WITA dengan akhiran WITA', () => {
    const formatted = formatWitaTimestamp('2026-10-31T06:15:00.000Z'); // 14:15 WITA (UTC+8)
    assert.match(formatted, /2026/);
    assert.match(formatted, /14[.:]15/);
    assert.match(formatted, /WITA$/);
  });

  it('formatShopCreatedTelegramMessage menghasilkan pesan HTML lengkap & aman dengan link WA dan toko', () => {
    const msg = formatShopCreatedTelegramMessage({
      shopSlug: 'tenda-rinjani',
      name: 'Rental Tenda & Alat <Rinjani>',
      whatsapp: '0812-3456-7890',
      location: 'Mataram, Lombok',
      ownerEmail: 'budi@gmail.com',
      siteOrigin: 'https://sebaraja.com',
      createdAt: '2026-10-31T06:15:00.000Z',
      totalShops: 42,
    });

    assert.match(msg, /TOKO BARU SEBARAJA/);
    assert.match(msg, /Rental Tenda &amp; Alat &lt;Rinjani&gt;/);
    assert.match(msg, /https:\/\/sebaraja\.com\/tenda-rinjani/);
    assert.match(msg, /https:\/\/wa\.me\/6281234567890/);
    assert.match(msg, /Mataram, Lombok/);
    assert.match(msg, /budi@gmail\.com/);
    assert.match(msg, /42 Toko/);
  });

  it('formatMemberJoinedTelegramMessage menghasilkan pesan join staf yang rapi', () => {
    const msg = formatMemberJoinedTelegramMessage({
      shopSlug: 'tenda-rinjani',
      shopName: 'Rental Tenda Rinjani',
      email: 'staf1@gmail.com',
      role: 'staff',
      siteOrigin: 'https://sebaraja.com',
      joinedAt: '2026-10-31T06:20:00.000Z',
      totalShopMembers: 3,
    });

    assert.match(msg, /MEMBER BARU JOIN TOKO/);
    assert.match(msg, /staf1@gmail\.com/);
    assert.match(msg, /Rental Tenda Rinjani/);
    assert.match(msg, /\/tenda-rinjani/);
    assert.match(msg, /Staf Gudang/);
    assert.match(msg, /3 Orang/);
  });

  it('TelegramNotifyRequestSchema memvalidasi event shop_created dan member_joined serta menolak slug ilegal', () => {
    const validShop = TelegramNotifyRequestSchema.safeParse({
      event: 'shop_created',
      shopSlug: 'borneo-outdoor',
      name: 'Borneo Outdoor',
      whatsapp: '628123456789',
      location: 'Samarinda',
      ownerEmail: 'owner@borneo.id',
      siteOrigin: 'https://sebaraja.com',
    });
    assert.equal(validShop.success, true);

    const validJoin = TelegramNotifyRequestSchema.safeParse({
      event: 'member_joined',
      shopSlug: 'borneo-outdoor',
      role: 'staff',
      email: 'staff@borneo.id',
    });
    assert.equal(validJoin.success, true);

    const invalidEvent = TelegramNotifyRequestSchema.safeParse({
      event: 'unknown_event',
      shopSlug: 'ab',
    });
    assert.equal(invalidEvent.success, false);
  });

  it('SupabaseWebhookPayloadSchema mengenali payload INSERT dari tabel shops dan shop_members', () => {
    const shopHook = SupabaseWebhookPayloadSchema.safeParse({
      type: 'INSERT',
      table: 'shops',
      schema: 'public',
      record: {
        slug: 'kamera-bali',
        name: 'Kamera Bali',
        location: 'Denpasar',
        whatsapp: '6281122334455',
        created_at: '2026-10-31T06:15:00.000Z',
      },
    });
    assert.equal(shopHook.success, true);

    const memberHook = SupabaseWebhookPayloadSchema.safeParse({
      type: 'INSERT',
      table: 'shop_members',
      schema: 'public',
      record: {
        shop_slug: 'kamera-bali',
        user_id: '00000000-0000-0000-0000-000000000001',
        email: 'kru@kamerabali.com',
        role: 'staff',
        created_at: '2026-10-31T06:20:00.000Z',
      },
    });
    assert.equal(memberHook.success, true);
  });

  it('claimNotificationKey mencegah duplikasi notifikasi dalam jendela TTL', () => {
    const t0 = 1_700_000_000_000;
    assert.equal(claimNotificationKey('shop:tenda-rinjani', 60_000, t0), true);
    assert.equal(claimNotificationKey('shop:tenda-rinjani', 60_000, t0 + 5_000), false);
    assert.equal(claimNotificationKey('shop:tenda-rinjani', 60_000, t0 + 61_000), true);
  });

  it('detectNewlyClaimedMemberships hanya mengembalikan toko yang baru diklaim (tidak mengirim ulang toko lama)', () => {
    const beforeSlugs = ['toko-lama'];
    const afterMembers: ShopMember[] = [
      {
        shopSlug: 'toko-lama',
        userId: 'u1',
        email: 'staf@mail.com',
        role: 'owner',
        createdAt: '2026-10-01T00:00:00Z',
      },
      {
        shopSlug: 'toko-baru-join',
        userId: 'u1',
        email: 'staf@mail.com',
        role: 'staff',
        createdAt: '2026-10-31T06:20:00Z',
      },
    ];

    const newlyJoined = detectNewlyClaimedMemberships(beforeSlugs, afterMembers);
    assert.equal(newlyJoined.length, 1);
    assert.equal(newlyJoined[0].shopSlug, 'toko-baru-join');
    assert.equal(newlyJoined[0].role, 'staff');
  });

  it('sendTelegramBotMessage mengirim payload ke API Telegram dan menyamarkan token bila terjadi error', async () => {
    let capturedUrl = '';
    let capturedBody: Record<string, unknown> = {};

    const mockFetchOk: typeof fetch = async (input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body || '{}'));
      return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const okRes = await sendTelegramBotMessage({
      botToken: '123456:SECRET_TOKEN_XYZ',
      chatId: '987654321',
      html: '<b>Halo</b>',
      fetchFn: mockFetchOk,
    });

    assert.equal(okRes.ok, true);
    assert.equal(
      capturedUrl,
      'https://api.telegram.org/bot123456:SECRET_TOKEN_XYZ/sendMessage'
    );
    assert.equal(capturedBody.chat_id, '987654321');
    assert.equal(capturedBody.parse_mode, 'HTML');

    const mockFetchFail: typeof fetch = async () => {
      throw new Error('Request failed to https://api.telegram.org/bot123456:SECRET_TOKEN_XYZ/sendMessage');
    };

    const failRes = await sendTelegramBotMessage({
      botToken: '123456:SECRET_TOKEN_XYZ',
      chatId: '987654321',
      html: '<b>Halo</b>',
      fetchFn: mockFetchFail,
    });

    assert.equal(failRes.ok, false);
    assert.ok(failRes.error);
    assert.equal(failRes.error.includes('SECRET_TOKEN_XYZ'), false);
  });
});

