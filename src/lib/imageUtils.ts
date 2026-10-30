import { supabase, isSupabaseConfigured } from './supabase';

const MAX_RAW_FILE_BYTES = 8 * 1024 * 1024; // 8 MB batas file mentah sebelum kompresi
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(file: File): void {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Format gambar harus berupa JPG, PNG, atau WebP.');
  }
  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error('Ukuran file gambar maksimal 8 MB.');
  }
}

/**
 * Kompres gambar di sisi klien menggunakan Canvas API
 * Mengurangi ukuran file kamera HP (5-8MB) menjadi ~30-90KB WebP/JPEG yang ringan
 */
export async function compressImage(
  file: File,
  maxWidth = 900,
  maxHeight = 900,
  quality = 0.82
): Promise<string> {
  validateImageFile(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Browser tidak mendukung pemrosesan kanvas gambar.'));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // fallback ke JPEG
        }

        const jpegData = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegData);
      };
      img.onerror = () => reject(new Error('File gambar rusak atau tidak dapat dibaca.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat.'));
    reader.readAsDataURL(file);
  });
}

function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

function randomFileId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Upload gambar unit ke folder `<shopSlug>/<uuid>.webp` di Supabase Storage.
 * Tidak menyimpan base64 ke database produksi bila upload cloud gagal,
 * melainkan melempar pesan error yang jelas.
 */
export async function uploadItemImage(file: File, shopSlug: string): Promise<string> {
  const compressedDataUrl = await compressImage(file);

  if (!isSupabaseConfigured || !supabase) {
    // Hanya pada mode pengembangan lokal tanpa Supabase
    return compressedDataUrl;
  }

  const blob = dataURLtoBlob(compressedDataUrl);
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const safeSlug = (shopSlug || 'general').replace(/[^a-z0-9-]/g, '');
  const filePath = `${safeSlug}/${randomFileId()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('item-images')
    .upload(filePath, blob, {
      contentType: blob.type,
      upsert: false,
    });

  if (error || !data?.path) {
    throw new Error(
      error?.message || 'Gagal mengunggah foto ke penyimpanan cloud. Pastikan Anda login sebagai Owner.'
    );
  }

  const { data: publicUrlData } = supabase.storage.from('item-images').getPublicUrl(data.path);
  if (!publicUrlData?.publicUrl) {
    throw new Error('Gagal mendapatkan URL publik gambar.');
  }

  return publicUrlData.publicUrl;
}

/**
 * Upload logo toko ke folder `<shopSlug>/logo-<uuid>.webp` agar sesuai policy RLS per-folder toko.
 */
export async function uploadShopLogo(file: File, shopSlug: string): Promise<string> {
  const compressedDataUrl = await compressImage(file, 500, 500, 0.88);

  if (!isSupabaseConfigured || !supabase) {
    return compressedDataUrl;
  }

  const blob = dataURLtoBlob(compressedDataUrl);
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const safeSlug = (shopSlug || 'general').replace(/[^a-z0-9-]/g, '');
  const filePath = `${safeSlug}/logo-${randomFileId()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('item-images')
    .upload(filePath, blob, {
      contentType: blob.type,
      upsert: false,
    });

  if (error || !data?.path) {
    throw new Error(
      error?.message || 'Gagal mengunggah logo toko. Pastikan Anda login sebagai Owner toko ini.'
    );
  }

  const { data: publicUrlData } = supabase.storage.from('item-images').getPublicUrl(data.path);
  if (!publicUrlData?.publicUrl) {
    throw new Error('Gagal mendapatkan URL publik logo.');
  }

  return publicUrlData.publicUrl;
}
