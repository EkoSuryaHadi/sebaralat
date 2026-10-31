import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
});

