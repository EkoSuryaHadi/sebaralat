import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Kompres gambar di sisi klien menggunakan Canvas API
 * Mengurangi ukuran file kamera HP (5-12MB) menjadi ~30-90KB yang sangat ringan
 */
export async function compressImage(
  file: File,
  maxWidth = 900,
  maxHeight = 900,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Jika bukan gambar atau format SVG/GIF, langsung baca as DataURL
    if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

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
          resolve(e.target?.result as string);
          return;
        }

        // Gambar latar belakang putih jika ada transparansi pada format non-PNG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Prioritaskan WebP jika didukung, fallback ke JPEG
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // ignore error
        }

        const jpegData = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegData);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Helper konversi Data URL ke Blob (untuk upload Supabase Storage)
 */
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

/**
 * Upload gambar unit: Coba Supabase Storage terlebih dahulu,
 * jika gagal atau tidak terhubung, fallback ke compressed Data URL.
 */
export async function uploadItemImage(file: File, shopSlug: string): Promise<string> {
  const compressedDataUrl = await compressImage(file);

  if (!isSupabaseConfigured || !supabase) {
    return compressedDataUrl;
  }

  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${shopSlug || 'general'}/${Date.now()}-${cleanFileName}`;
    const blob = dataURLtoBlob(compressedDataUrl);

    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload failed, falling back to data URL:', error.message);
      return compressedDataUrl;
    }

    if (data?.path) {
      const { data: publicUrlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }

    return compressedDataUrl;
  } catch (err) {
    console.warn('Storage upload error, using compressed base64:', err);
    return compressedDataUrl;
  }
}

/**
 * Upload logo toko/usaha: Coba Supabase Storage terlebih dahulu,
 * jika gagal atau offline, fallback ke compressed Data URL.
 */
export async function uploadShopLogo(file: File, shopSlug: string): Promise<string> {
  const compressedDataUrl = await compressImage(file, 500, 500, 0.88);

  if (!isSupabaseConfigured || !supabase) {
    return compressedDataUrl;
  }

  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `logos/${shopSlug || 'general'}-${Date.now()}-${cleanFileName}`;
    const blob = dataURLtoBlob(compressedDataUrl);

    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase logo upload failed, using data URL:', error.message);
      return compressedDataUrl;
    }

    if (data?.path) {
      const { data: publicUrlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(data.path);

      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }

    return compressedDataUrl;
  } catch (err) {
    console.warn('Logo storage upload error, using compressed base64:', err);
    return compressedDataUrl;
  }
}


