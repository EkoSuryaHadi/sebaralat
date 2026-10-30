-- =========================================================
-- MIGRASI 0003: SUPABASE STORAGE POLICIES KETAT & REALTIME
-- =========================================================

-- Buat / perbarui bucket 'item-images' dengan batas ukuran 1MB dan hanya tipe gambar aman
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-images',
  'item-images',
  true,
  1048576, -- 1 MB
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png'];

-- Hapus policy lama yang terlalu longgar
DROP POLICY IF EXISTS "Public Access for Item Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Access for Item Images" ON storage.objects;
DROP POLICY IF EXISTS "item_images_public_select" ON storage.objects;
DROP POLICY IF EXISTS "item_images_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "item_images_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "item_images_owner_delete" ON storage.objects;

-- 1. Publik dapat melihat gambar katalog
CREATE POLICY "item_images_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images');

-- 2. Hanya Owner dari toko yang sesuai dengan nama folder pertama (<shop_slug>/<uuid>.webp)
--    yang boleh mengunggah, mengubah, atau menghapus file di folder tokonya
CREATE POLICY "item_images_owner_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'item-images'
  AND public.is_shop_member((storage.foldername(name))[1], ARRAY['owner'])
);

CREATE POLICY "item_images_owner_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'item-images'
  AND public.is_shop_member((storage.foldername(name))[1], ARRAY['owner'])
)
WITH CHECK (
  bucket_id = 'item-images'
  AND public.is_shop_member((storage.foldername(name))[1], ARRAY['owner'])
);

CREATE POLICY "item_images_owner_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'item-images'
  AND public.is_shop_member((storage.foldername(name))[1], ARRAY['owner'])
);

-- =========================================================
-- PUBLIKASI REALTIME (IDEMPOTENT)
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'shops'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rental_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activity_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
  END IF;
END;
$$;

