import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isLikelyBotUserAgent,
  detectDeviceType,
  extractReferrerHost,
} from '../analytics.ts';

describe('Utilitas First-Party Traffic Analytics', () => {
  it('isLikelyBotUserAgent mendeteksi bot/crawler umum dan meloloskan browser normal', () => {
    assert.equal(isLikelyBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
    assert.equal(isLikelyBotUserAgent('HeadlessChrome/120.0.0.0'), true);
    assert.equal(
      isLikelyBotUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'
      ),
      false
    );
  });

  it('detectDeviceType mengklasifikasikan mobile, tablet, dan desktop dengan tepat', () => {
    assert.equal(
      detectDeviceType('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148'),
      'mobile'
    );
    assert.equal(detectDeviceType('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'), 'tablet');
    assert.equal(detectDeviceType('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 1440), 'desktop');
    assert.equal(detectDeviceType('', 390), 'mobile');
  });

  it('extractReferrerHost menormalisasi sumber trafik populer dan mengabaikan domain sendiri', () => {
    assert.equal(extractReferrerHost('', 'sebaraja.my.id'), 'Direct');
    assert.equal(extractReferrerHost('https://sebaraja.my.id/borneo-rental', 'sebaraja.my.id'), 'Direct');
    assert.equal(extractReferrerHost('https://l.instagram.com/', 'sebaraja.my.id'), 'Instagram');
    assert.equal(extractReferrerHost('https://www.google.com/search?q=sebaraja', 'sebaraja.my.id'), 'Google');
    assert.equal(extractReferrerHost('https://wa.me/', 'sebaraja.my.id'), 'WhatsApp');
    assert.equal(extractReferrerHost('https://blog.example.com/post', 'sebaraja.my.id'), 'blog.example.com');
  });
});
