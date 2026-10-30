-- =========================================================
-- MIGRASI 0002: ROW LEVEL SECURITY, RPC & SERVER AUDIT LOG
-- =========================================================

-- Helper 1: Cek apakah user saat ini adalah Super Admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = auth.uid()
  );
$$;

-- Helper 2: Cek keanggotaan toko berdasarkan role
CREATE OR REPLACE FUNCTION public.is_shop_member(p_slug TEXT, p_roles TEXT[] DEFAULT ARRAY['owner', 'staff'])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_slug = p_slug
      AND user_id = auth.uid()
      AND role = ANY(p_roles)
  );
$$;

-- Helper 3: Ambil label role user saat ini di suatu toko
CREATE OR REPLACE FUNCTION public.current_actor_role(p_slug TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT CASE
    WHEN public.is_platform_admin() THEN 'Super Admin'
    WHEN EXISTS (SELECT 1 FROM public.shop_members WHERE shop_slug = p_slug AND user_id = auth.uid() AND role = 'owner') THEN 'Owner Toko'
    WHEN EXISTS (SELECT 1 FROM public.shop_members WHERE shop_slug = p_slug AND user_id = auth.uid() AND role = 'staff') THEN 'Staf Gudang'
    ELSE 'Sistem'
  END;
$$;

-- =========================================================
-- AKTIFKAN RLS PADA SEMUA TABEL
-- =========================================================
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Kebijakan platform_admins: hanya diri sendiri yang bisa melihat
DROP POLICY IF EXISTS "platform_admins_select_self" ON public.platform_admins;
CREATE POLICY "platform_admins_select_self" ON public.platform_admins
  FOR SELECT USING (user_id = auth.uid());

-- Kebijakan shops:
-- Publik (anon & authenticated) boleh SELECT profil toko (tidak ada lagi kolom PIN rahasia di tabel ini)
DROP POLICY IF EXISTS "shops_public_select" ON public.shops;
CREATE POLICY "shops_public_select" ON public.shops
  FOR SELECT USING (true);

-- Hanya Owner toko yang bersangkutan (atau Super Admin) yang boleh UPDATE profil tokonya
-- Catatan: Perubahan plan & is_verified diblokir oleh trigger untuk non-superadmin
DROP POLICY IF EXISTS "shops_owner_update" ON public.shops;
CREATE POLICY "shops_owner_update" ON public.shops
  FOR UPDATE
  USING (public.is_shop_member(slug, ARRAY['owner']))
  WITH CHECK (public.is_shop_member(slug, ARRAY['owner']));

-- Hanya Super Admin yang bisa DELETE toko
DROP POLICY IF EXISTS "shops_admin_delete" ON public.shops;
CREATE POLICY "shops_admin_delete" ON public.shops
  FOR DELETE USING (public.is_platform_admin());

-- Trigger proteksi kolom sensitif pada shops (plan & is_verified tidak boleh diubah dari klien biasa)
CREATE OR REPLACE FUNCTION public.guard_shop_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    NEW.plan := OLD.plan;
    NEW.is_verified := OLD.is_verified;
    NEW.slug := OLD.slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_shop_columns ON public.shops;
CREATE TRIGGER trg_guard_shop_columns
BEFORE UPDATE ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.guard_shop_privileged_columns();

-- Kebijakan shop_members:
DROP POLICY IF EXISTS "shop_members_select" ON public.shop_members;
CREATE POLICY "shop_members_select" ON public.shop_members
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_shop_member(shop_slug, ARRAY['owner'])
  );

DROP POLICY IF EXISTS "shop_members_owner_delete" ON public.shop_members;
CREATE POLICY "shop_members_owner_delete" ON public.shop_members
  FOR DELETE USING (
    public.is_shop_member(shop_slug, ARRAY['owner']) AND role <> 'owner'
  );

-- Kebijakan shop_invites: hanya Owner toko yang boleh melihat, membuat, dan menghapus undangan
DROP POLICY IF EXISTS "shop_invites_owner_all" ON public.shop_invites;
CREATE POLICY "shop_invites_owner_all" ON public.shop_invites
  FOR ALL
  USING (public.is_shop_member(shop_slug, ARRAY['owner']))
  WITH CHECK (public.is_shop_member(shop_slug, ARRAY['owner']));

-- Kebijakan rental_items:
-- Publik boleh membaca katalog item
DROP POLICY IF EXISTS "rental_items_public_select" ON public.rental_items;
CREATE POLICY "rental_items_public_select" ON public.rental_items
  FOR SELECT USING (true);

-- Hanya Owner yang boleh menambah (INSERT) dan menghapus (DELETE) unit
DROP POLICY IF EXISTS "rental_items_owner_insert" ON public.rental_items;
CREATE POLICY "rental_items_owner_insert" ON public.rental_items
  FOR INSERT WITH CHECK (public.is_shop_member(shop_slug, ARRAY['owner']));

DROP POLICY IF EXISTS "rental_items_owner_delete" ON public.rental_items;
CREATE POLICY "rental_items_owner_delete" ON public.rental_items
  FOR DELETE USING (public.is_shop_member(shop_slug, ARRAY['owner']));

-- Owner dan Staf boleh UPDATE, tetapi Staf dibatasi oleh trigger hanya boleh mengubah status, stock, available_at, renter_note
DROP POLICY IF EXISTS "rental_items_member_update" ON public.rental_items;
CREATE POLICY "rental_items_member_update" ON public.rental_items
  FOR UPDATE
  USING (public.is_shop_member(shop_slug, ARRAY['owner', 'staff']))
  WITH CHECK (public.is_shop_member(shop_slug, ARRAY['owner', 'staff']));

CREATE OR REPLACE FUNCTION public.guard_rental_item_staff_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_shop_member(OLD.shop_slug, ARRAY['owner']) THEN
    -- Staf Gudang DILARANG mengubah identitas, harga, kategori, SKU, atau foto
    IF NEW.name IS DISTINCT FROM OLD.name
       OR NEW.sku IS DISTINCT FROM OLD.sku
       OR NEW.category IS DISTINCT FROM OLD.category
       OR NEW.price_per_day IS DISTINCT FROM OLD.price_per_day
       OR NEW.specs IS DISTINCT FROM OLD.specs
       OR NEW.image_url IS DISTINCT FROM OLD.image_url
       OR NEW.shop_slug IS DISTINCT FROM OLD.shop_slug THEN
      RAISE EXCEPTION 'Akses Ditolak: Staf Gudang hanya diizinkan memperbarui status, stok fisik, dan catatan peminjam.';
    END IF;
    NEW.last_updated_by := 'Staf Gudang';
  ELSE
    NEW.last_updated_by := 'Owner';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_rental_item_update ON public.rental_items;
CREATE TRIGGER trg_guard_rental_item_update
BEFORE UPDATE ON public.rental_items
FOR EACH ROW EXECUTE FUNCTION public.guard_rental_item_staff_update();

-- Kebijakan activity_logs:
-- Hanya anggota toko (Owner & Staf) yang boleh membaca log tokonya; KLIEN TIDAK BISA INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "activity_logs_member_select" ON public.activity_logs;
CREATE POLICY "activity_logs_member_select" ON public.activity_logs
  FOR SELECT USING (public.is_shop_member(shop_slug, ARRAY['owner', 'staff']));

-- =========================================================
-- TRIGGER AUDIT LOG OTOMATIS DI SERVER (ANTI PEMALSUAN)
-- =========================================================
CREATE OR REPLACE FUNCTION public.audit_rental_item_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role TEXT;
  v_action TEXT;
  v_slug TEXT;
BEGIN
  v_slug := COALESCE(NEW.shop_slug, OLD.shop_slug);
  v_role := public.current_actor_role(v_slug);

  IF TG_OP = 'INSERT' THEN
    v_action := format('Menambahkan unit baru "%s" (Rp%s/hari) - Kategori: %s', NEW.name, NEW.price_per_day, NEW.category);
  ELSIF TG_OP = 'DELETE' THEN
    v_action := format('Menghapus unit "%s" (SKU: %s) dari inventaris', OLD.name, OLD.sku);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := format(
        'Mengubah status "%s" menjadi %s',
        NEW.name,
        CASE NEW.status
          WHEN 'available' THEN '🟢 READY'
          WHEN 'rented' THEN '🔴 DISEWA'
          ELSE '🟡 SERVIS'
        END
      );
    ELSIF NEW.stock IS DISTINCT FROM OLD.stock THEN
      v_action := format('Memperbarui stok fisik "%s" dari %s menjadi %s unit', NEW.name, OLD.stock, NEW.stock);
    ELSIF NEW.price_per_day IS DISTINCT FROM OLD.price_per_day THEN
      v_action := format('Mengubah tarif sewa "%s" menjadi Rp%s/hari', NEW.name, NEW.price_per_day);
    ELSE
      v_action := format('Memperbarui rincian unit "%s"', NEW.name);
    END IF;
  END IF;

  INSERT INTO public.activity_logs (shop_slug, actor_id, actor_role, action)
  VALUES (v_slug, auth.uid(), v_role, v_action);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_rental_items ON public.rental_items;
CREATE TRIGGER trg_audit_rental_items
AFTER INSERT OR UPDATE OR DELETE ON public.rental_items
FOR EACH ROW EXECUTE FUNCTION public.audit_rental_item_changes();

-- =========================================================
-- RPC ATOMIK: PEMBUATAN TOKO, OPERASIONAL STAF & UNDANGAN
-- =========================================================

-- 1. RPC Buat Toko Baru (Hanya untuk user yang sudah login)
CREATE OR REPLACE FUNCTION public.create_shop(
  p_slug TEXT,
  p_name TEXT,
  p_tagline TEXT,
  p_whatsapp TEXT,
  p_location TEXT,
  p_hours TEXT DEFAULT '08.00 - 21.00 WITA'
)
RETURNS public.shops
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID;
  v_email TEXT;
  v_clean_slug TEXT;
  v_owned_count INT;
  v_shop public.shops;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan: silakan masuk dengan email terlebih dahulu untuk membuat toko.';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  -- Batasi 1 toko gratis per akun (kecuali Super Admin)
  IF NOT public.is_platform_admin() THEN
    SELECT count(*) INTO v_owned_count
    FROM public.shop_members
    WHERE user_id = v_uid AND role = 'owner';

    IF v_owned_count >= 1 THEN
      RAISE EXCEPTION 'Batas paket Starter tercapai: setiap akun gratis hanya dapat memiliki 1 toko. Hubungi tim Sebaraja untuk upgrade multi-cabang.';
    END IF;
  END IF;

  v_clean_slug := lower(regexp_replace(trim(p_slug), '[^a-z0-9]+', '-', 'g'));
  v_clean_slug := regexp_replace(v_clean_slug, '^-+|-+$', '', 'g');

  IF char_length(v_clean_slug) < 3 THEN
    RAISE EXCEPTION 'Slug URL minimal 3 karakter huruf/angka.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.shops WHERE slug = v_clean_slug) THEN
    RAISE EXCEPTION 'Tautan slug "/%" sudah digunakan toko lain. Silakan pilih nama tautan lain.', v_clean_slug;
  END IF;

  INSERT INTO public.shops (
    slug, name, tagline, category_type, location, hours, whatsapp, is_verified, plan, terms
  ) VALUES (
    v_clean_slug,
    trim(p_name),
    COALESCE(NULLIF(trim(p_tagline), ''), 'Katalog Resmi Penyewaan Alat & Unit Operasional'),
    'Umum',
    trim(p_location),
    COALESCE(NULLIF(trim(p_hours), ''), '08.00 - 21.00 WITA'),
    regexp_replace(p_whatsapp, '[^0-9]', '', 'g'),
    false,
    'FREE',
    '["Wajib meninggalkan kartu identitas asli (E-KTP) saat pengambilan unit.", "Pembayaran lunas saat serah terima alat."]'::jsonb
  )
  RETURNING * INTO v_shop;

  INSERT INTO public.shop_members (shop_slug, user_id, email, role)
  VALUES (v_clean_slug, v_uid, COALESCE(v_email, ''), 'owner');

  INSERT INTO public.rental_items (
    shop_slug, sku, name, category, icon_type, price_per_day, status, stock, specs, image_bg
  ) VALUES (
    v_clean_slug,
    'UNIT-001',
    'Unit Perdana (Silakan Edit di Panel Kerja)',
    'Camping',
    'tent',
    50000,
    'available',
    2,
    '["Kondisi siap pakai hari ini", "Bisa dipesan langsung via WhatsApp"]'::jsonb,
    'from-emerald-600 to-teal-800'
  );

  RETURN v_shop;
END;
$$;

-- 2. RPC Update Stok Atomik (Mencegah Race Condition / Lost Update)
CREATE OR REPLACE FUNCTION public.adjust_item_stock(
  p_item_id UUID,
  p_delta INTEGER
)
RETURNS public.rental_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item public.rental_items;
  v_next_stock INTEGER;
  v_next_status TEXT;
BEGIN
  SELECT * INTO v_item
  FROM public.rental_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unit tidak ditemukan.';
  END IF;

  IF NOT public.is_shop_member(v_item.shop_slug, ARRAY['owner', 'staff']) THEN
    RAISE EXCEPTION 'Akses Ditolak: Anda bukan pengelola toko ini.';
  END IF;

  v_next_stock := GREATEST(0, v_item.stock + p_delta);
  v_next_status := CASE
    WHEN v_next_stock = 0 AND v_item.status = 'available' THEN 'rented'
    WHEN v_next_stock > 0 AND v_item.status = 'rented' THEN 'available'
    ELSE v_item.status
  END;

  UPDATE public.rental_items
  SET stock = v_next_stock,
      status = v_next_status
  WHERE id = p_item_id
  RETURNING * INTO v_item;

  RETURN v_item;
END;
$$;

-- 3. RPC Undang Anggota / Staf via Email
CREATE OR REPLACE FUNCTION public.invite_shop_member(
  p_shop_slug TEXT,
  p_email TEXT,
  p_role TEXT DEFAULT 'staff'
)
RETURNS public.shop_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invite public.shop_invites;
  v_clean_email TEXT;
BEGIN
  IF NOT public.is_shop_member(p_shop_slug, ARRAY['owner']) THEN
    RAISE EXCEPTION 'Hanya Owner toko yang dapat mengundang staf.';
  END IF;

  v_clean_email := lower(trim(p_email));
  IF v_clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Format alamat email tidak valid.';
  END IF;

  IF p_role NOT IN ('owner', 'staff') THEN
    RAISE EXCEPTION 'Role tidak valid.';
  END IF;

  INSERT INTO public.shop_invites (shop_slug, email, role, invited_by)
  VALUES (p_shop_slug, v_clean_email, p_role, auth.uid())
  ON CONFLICT (shop_slug, email)
  DO UPDATE SET
    role = EXCLUDED.role,
    token = gen_random_uuid(),
    accepted_at = NULL,
    expires_at = timezone('utc'::text, now()) + interval '7 days'
  RETURNING * INTO v_invite;

  INSERT INTO public.activity_logs (shop_slug, actor_id, actor_role, action)
  VALUES (p_shop_slug, auth.uid(), 'Owner Toko', format('Mengirim undangan akses %s ke %s', upper(p_role), v_clean_email));

  RETURN v_invite;
END;
$$;

-- 4. RPC Klaim Otomatis Undangan Staf berdasarkan Email User yang Login
CREATE OR REPLACE FUNCTION public.claim_my_invites()
RETURNS SETOF public.shop_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID;
  v_email TEXT;
  v_inv RECORD;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL THEN
    RETURN;
  END IF;

  FOR v_inv IN
    SELECT * FROM public.shop_invites
    WHERE lower(email) = v_email
      AND accepted_at IS NULL
      AND expires_at > timezone('utc'::text, now())
  LOOP
    INSERT INTO public.shop_members (shop_slug, user_id, email, role)
    VALUES (v_inv.shop_slug, v_uid, v_email, v_inv.role)
    ON CONFLICT (shop_slug, user_id) DO UPDATE SET role = EXCLUDED.role;

    UPDATE public.shop_invites
    SET accepted_at = timezone('utc'::text, now())
    WHERE id = v_inv.id;

    INSERT INTO public.activity_logs (shop_slug, actor_id, actor_role, action)
    VALUES (v_inv.shop_slug, v_uid, 'Staf Gudang', format('Bergabung sebagai %s (%s)', v_inv.role, v_email));
  END LOOP;

  RETURN QUERY
  SELECT * FROM public.shop_members WHERE user_id = v_uid;
END;
$$;

