import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  STARTER_MAX_ITEMS,
  isProPlanActive,
  canAddRentalItem,
  formatUpgradeWhatsappMessage,
} from '../validators.ts';

describe('Aturan & Pembatasan Paket Starter vs Bisnis PRO', () => {
  it('Starter max items bernilai 8 unit', () => {
    assert.equal(STARTER_MAX_ITEMS, 8);
  });

  it('isProPlanActive mengembalikan true jika plan PRO tanpa proExpiresAt', () => {
    assert.equal(isProPlanActive({ plan: 'PRO' }), true);
    assert.equal(isProPlanActive({ plan: 'PRO', proExpiresAt: null }), true);
  });

  it('isProPlanActive mengembalikan false jika plan FREE', () => {
    assert.equal(isProPlanActive({ plan: 'FREE' }), false);
    assert.equal(isProPlanActive(null), false);
  });

  it('isProPlanActive mengecek masa kedaluwarsa proExpiresAt dengan tepat', () => {
    const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
    const pastDate = new Date(Date.now() - 86400000).toISOString();

    assert.equal(isProPlanActive({ plan: 'PRO', proExpiresAt: futureDate }), true);
    assert.equal(isProPlanActive({ plan: 'PRO', proExpiresAt: pastDate }), false);
  });

  it('canAddRentalItem membatasi Starter hingga 8 item', () => {
    const freeShop = { plan: 'FREE', proExpiresAt: null };
    assert.equal(canAddRentalItem(freeShop, 0), true);
    assert.equal(canAddRentalItem(freeShop, 7), true);
    assert.equal(canAddRentalItem(freeShop, 8), false);
    assert.equal(canAddRentalItem(freeShop, 12), false);
  });

  it('canAddRentalItem mengizinkan penambahan tanpa batas untuk PRO aktif', () => {
    const proShop = { plan: 'PRO', proExpiresAt: null };
    assert.equal(canAddRentalItem(proShop, 8), true);
    assert.equal(canAddRentalItem(proShop, 100), true);
  });

  it('formatUpgradeWhatsappMessage menghasilkan teks WhatsApp yang lengkap dan valid', () => {
    const shop = { slug: 'toko-outdoor', name: 'Toko Outdoor Balikpapan' };
    const msg = formatUpgradeWhatsappMessage(shop, 'yearly');
    assert.match(msg, /Toko Outdoor Balikpapan/);
    assert.match(msg, /sebaraja\.com\/toko-outdoor/);
    assert.match(msg, /Bisnis PRO Tahunan/);
  });

  it('P0-1: Migrasi SQL 0005_subscriptions.sql menggunakan shop_slug & slug (bukan shop_id)', () => {
    const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/0005_subscriptions.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    assert.equal(
      sqlContent.includes('NEW.shop_id'),
      false,
      '0005_subscriptions.sql tidak boleh mereferensikan NEW.shop_id yang tidak ada'
    );
    assert.equal(
      sqlContent.includes('WHERE slug = NEW.shop_slug'),
      true,
      '0005_subscriptions.sql wajib memfilter public.shops dengan slug = NEW.shop_slug'
    );
    assert.equal(
      sqlContent.includes('WHERE shop_slug = NEW.shop_slug'),
      true,
      '0005_subscriptions.sql wajib memfilter public.rental_items dengan shop_slug = NEW.shop_slug'
    );
  });

  it('P0-2 & P1-5: Migrasi SQL 0004_bookings.sql menghitung multiplier di server & mengecek status <> available', () => {
    const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/0004_bookings.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    assert.equal(
      sqlContent.includes('public.duration_multiplier(p_duration_days)'),
      true,
      'create_booking wajib menggunakan fungsi server public.duration_multiplier(p_duration_days)'
    );
    assert.equal(
      sqlContent.includes("WHEN i.status <> 'available' THEN 0"),
      true,
      'available_item_qty wajib mengembalikan 0 bila status item bukan available (rented / maintenance)'
    );
  });
});


