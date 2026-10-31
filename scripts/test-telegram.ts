import {
  formatShopCreatedTelegramMessage,
  sendTelegramBotMessage,
} from '../src/lib/telegram.ts';

async function main() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || '';
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://sebaraja.com';

  if (!botToken || !chatId) {
    console.error(
      '❌ TELEGRAM_BOT_TOKEN atau TELEGRAM_CHAT_ID belum diisi di file .env.local!'
    );
    console.error('Contoh pengisian di .env.local:');
    console.error('  TELEGRAM_BOT_TOKEN=7123456789:AAHxxxxxxx');
    console.error('  TELEGRAM_CHAT_ID=123456789');
    process.exit(1);
  }

  const sampleHtml = [
    '✅ <b>TES KONEKSI BOT SEBARAJA BERHASIL!</b>',
    '',
    formatShopCreatedTelegramMessage({
      shopSlug: 'contoh-toko-uji',
      name: 'Contoh Toko Uji Coba',
      whatsapp: '6281234567890',
      location: 'Samarinda, Kalimantan Timur',
      ownerEmail: 'owner-test@sebaraja.com',
      siteOrigin,
      totalShops: 1,
    }),
  ].join('\n');

  console.log('📨 Mengirim pesan uji coba ke Telegram...');
  const res = await sendTelegramBotMessage({
    botToken,
    chatId,
    html: sampleHtml,
  });

  if (!res.ok) {
    console.error('❌ Gagal mengirim pesan ke Telegram:', res.error);
    console.error(
      '💡 Pastikan Anda sudah menekan tombol START pada bot Anda di Telegram dan Chat ID sudah benar.'
    );
    process.exit(1);
  }

  console.log('🎉 Sukses! Cek aplikasi Telegram di HP Anda sekarang.');
}

main();

