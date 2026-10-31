-- =========================================================
-- MIGRASI 0005: MANAJEMEN PAKET (STARTER VS BISNIS PRO)
-- Batas 8 item untuk Starter & Kolom Masa Aktif Langganan
-- =========================================================

-- 1. Tambah kolom informasi masa aktif langganan pada tabel shops
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT NULL CHECK (billing_cycle IN ('monthly', 'yearly') OR billing_cycle IS NULL);

COMMENT ON COLUMN public.shops.pro_expires_at IS 'Waktu kedaluwarsa masa aktif paket PRO. Jika null atau lewat waktu, dianggap Starter.';
COMMENT ON COLUMN public.shops.billing_cycle IS 'Siklus tagihan paket PRO: monthly atau yearly.';

-- 2. Fungsi penegakan batas 8 unit item untuk paket Starter (FREE)
CREATE OR REPLACE FUNCTION public.check_shop_item_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_plan TEXT;
  v_expires_at TIMESTAMPTZ;
  v_item_count INT;
BEGIN
  -- Ambil plan toko terkait
  SELECT plan, pro_expires_at INTO v_plan, v_expires_at
  FROM public.shops
  WHERE id = NEW.shop_id;

  -- Jika toko adalah PRO dan belum kedaluwarsa, tidak ada batasan
  IF v_plan = 'PRO' AND (v_expires_at IS NULL OR v_expires_at > now()) THEN
    RETURN NEW;
  END IF;

  -- Untuk paket FREE (Starter), hitung jumlah unit yang sudah ada
  SELECT count(*) INTO v_item_count
  FROM public.rental_items
  WHERE shop_id = NEW.shop_id;

  -- Maksimal 8 unit alat di katalog Starter
  IF v_item_count >= 8 THEN
    RAISE EXCEPTION 'Batas paket Starter tercapai (maksimal 8 unit alat). Silakan upgrade ke Bisnis PRO untuk menambah unit tanpa batas.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_shop_item_limit ON public.rental_items;
CREATE TRIGGER trg_check_shop_item_limit
BEFORE INSERT ON public.rental_items
FOR EACH ROW EXECUTE FUNCTION public.check_shop_item_limit();

