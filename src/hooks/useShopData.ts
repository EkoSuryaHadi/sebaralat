'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  mapShopFromDb,
  mapShopToDb,
  mapItemFromDb,
  mapItemToDb,
  mapLogFromDb,
  mapBookingFromDb,
  mapInviteFromDb,
  ShopDbRow,
  RentalItemDbRow,
  ActivityLogDbRow,
  BookingDbRow,
  ShopInviteDbRow,
} from '@/lib/supabase';
import {
  Shop,
  RentalItem,
  ActivityLog,
  Booking,
  BookingStatus,
  ShopInvite,
  Role,
  ItemStatus,
} from '@/types';
import { DEFAULT_SHOPS, DEFAULT_ITEMS } from '@/data/mockData';
import { addDaysToIsoDate } from '@/lib/validators';

export function useShopData(params: {
  activeShopSlug: string;
  currentRole: Role;
  startDate: string;
  durationDays: number;
  triggerToast: (msg: string) => void;
}) {
  const { activeShopSlug, currentRole, startDate, durationDays, triggerToast } = params;

  const [cloudSynced, setCloudSynced] = useState(isSupabaseConfigured);
  const [shops, setShops] = useState<Shop[]>(DEFAULT_SHOPS);
  const [allItems, setAllItems] = useState<RentalItem[]>(DEFAULT_ITEMS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    {
      id: 'log-1',
      shopSlug: 'borneo-rental',
      actorRole: 'Staf Gudang',
      action: 'Mengubah status Genset Silent Inverter 2200W menjadi 🔴 DISEWA',
      time: 'Hari ini, 08:15 WITA',
    },
    {
      id: 'log-2',
      shopSlug: 'borneo-rental',
      actorRole: 'Owner Toko',
      action: 'Memperbarui stok Tenda Eiger Kapasitas 4-5 Orang menjadi 4 unit',
      time: 'Kemarin, 19:40 WITA',
    },
  ]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invites, setInvites] = useState<ShopInvite[]>([]);
  const [cloudAvailabilityMap, setCloudAvailabilityMap] = useState<Record<string, number> | null>(null);

  // 1. Fetch daftar toko & item toko aktif
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const loadData = async () => {
      const [shopsRes, itemsRes] = await Promise.all([
        client
          .from('shops')
          .select(
            'slug, name, tagline, category_type, location, maps_url, hours, whatsapp, is_verified, plan, terms, partner_shop, logo_url'
          )
          .limit(50),
        client
          .from('rental_items')
          .select(
            'id, shop_slug, sku, name, category, icon_type, price_per_day, status, stock, available_at, renter_note, last_updated_by, specs, image_bg, image_url'
          )
          .eq('shop_slug', activeShopSlug)
          .limit(200),
      ]);

      if (!shopsRes.error && shopsRes.data && shopsRes.data.length > 0) {
        setShops((shopsRes.data as ShopDbRow[]).map(mapShopFromDb));
      }
      if (!itemsRes.error && itemsRes.data) {
        const fetchedItems = (itemsRes.data as RentalItemDbRow[]).map(mapItemFromDb);
        setAllItems((prev) => [
          ...prev.filter((i) => i.shopSlug !== activeShopSlug),
          ...fetchedItems,
        ]);
      }
      setCloudSynced(!shopsRes.error && !itemsRes.error);
    };

    loadData();

    // Realtime terfilter khusus toko yang sedang dibuka (mencegah kebocoran lintas toko & hemat bandwidth)
    const channel = client
      .channel(`shop_${activeShopSlug}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rental_items',
          filter: `shop_slug=eq.${activeShopSlug}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = mapItemFromDb(payload.new as RentalItemDbRow);
            setAllItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapItemFromDb(payload.new as RentalItemDbRow);
            setAllItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setAllItems((prev) => prev.filter((i) => i.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shops',
          filter: `slug=eq.${activeShopSlug}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const shopData = mapShopFromDb(payload.new as ShopDbRow);
            setShops((prev) => {
              const exists = prev.some((s) => s.slug === shopData.slug);
              return exists
                ? prev.map((s) => (s.slug === shopData.slug ? shopData : s))
                : [shopData, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `shop_slug=eq.${activeShopSlug}`,
        },
        (payload) => {
          const newLog = mapLogFromDb(payload.new as ActivityLogDbRow);
          setActivityLogs((prev) => [
            newLog,
            ...prev.filter((l) => l.id !== newLog.id).slice(0, 29),
          ]);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [activeShopSlug]);

  // 2. Fetch data internal (log, booking, undangan) hanya bila user punya role pengelola
  const fetchWorkspaceData = useCallback(async () => {
    if (!supabase || currentRole === 'customer') return;
    const [logsRes, bookingsRes, invitesRes] = await Promise.all([
      supabase
        .from('activity_logs')
        .select('id, shop_slug, actor_role, action, created_at')
        .eq('shop_slug', activeShopSlug)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('bookings')
        .select(
          'id, shop_slug, code, customer_name, customer_phone, start_date, end_date, duration_days, status, total_amount, notes, created_at, booking_lines(id, booking_id, item_id, item_name, qty, unit_price_per_day, subtotal)'
        )
        .eq('shop_slug', activeShopSlug)
        .order('created_at', { ascending: false })
        .limit(50),
      currentRole === 'owner'
        ? supabase
            .from('shop_invites')
            .select('id, shop_slug, email, role, token, accepted_at, expires_at, created_at')
            .eq('shop_slug', activeShopSlug)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (!logsRes.error && logsRes.data) {
      setActivityLogs((logsRes.data as ActivityLogDbRow[]).map(mapLogFromDb));
    }
    if (!bookingsRes.error && bookingsRes.data) {
      setBookings((bookingsRes.data as BookingDbRow[]).map(mapBookingFromDb));
    }
    if (!invitesRes.error && invitesRes.data) {
      setInvites((invitesRes.data as ShopInviteDbRow[]).map(mapInviteFromDb));
    }
  }, [activeShopSlug, currentRole]);

  useEffect(() => {
    let active = true;
    const loadWorkspace = async () => {
      await fetchWorkspaceData();
    };
    if (active) {
      void loadWorkspace();
    }
    return () => {
      active = false;
    };
  }, [fetchWorkspaceData]);

  // 3. Hitung ketersediaan unit berdasarkan tanggal (startDate + durationDays)
  useEffect(() => {
    if (!supabase || !startDate) return;
    const endDate = addDaysToIsoDate(startDate, durationDays);

    supabase
      .rpc('get_shop_availability', {
        p_shop_slug: activeShopSlug,
        p_start_date: startDate,
        p_end_date: endDate,
      })
      .then(({ data, error }) => {
        if (!error && Array.isArray(data)) {
          const map: Record<string, number> = {};
          for (const row of data as { item_id: string; available_qty: number }[]) {
            map[row.item_id] = Number(row.available_qty);
          }
          setCloudAvailabilityMap(map);
        }
      });
  }, [activeShopSlug, startDate, durationDays]);

  const availabilityMap = useMemo<Record<string, number>>(() => {
    if (cloudAvailabilityMap) {
      return cloudAvailabilityMap;
    }
    const endDate = addDaysToIsoDate(startDate, durationDays);
    const map: Record<string, number> = {};
    const shopItems = allItems.filter((i) => i.shopSlug === activeShopSlug);
    for (const item of shopItems) {
      if (item.status === 'maintenance') {
        map[item.id] = 0;
        continue;
      }
      const reserved = bookings
        .filter(
          (b) =>
            b.shopSlug === activeShopSlug &&
            (b.status === 'confirmed' || b.status === 'picked_up') &&
            b.startDate <= endDate &&
            b.endDate >= startDate
        )
        .reduce((acc, b) => {
          const lineQty =
            b.lines
              ?.filter((ln) => ln.itemId === item.id)
              .reduce((s, ln) => s + ln.qty, 0) || 0;
          return acc + lineQty;
        }, 0);

      map[item.id] = Math.max(0, item.stock - reserved);
    }
    return map;
  }, [cloudAvailabilityMap, activeShopSlug, startDate, durationDays, allItems, bookings]);

  const shop = useMemo<Shop | null>(() => {
    return shops.find((s) => s.slug === activeShopSlug) || null;
  }, [shops, activeShopSlug]);

  const items = useMemo<RentalItem[]>(() => {
    return allItems.filter((i) => i.shopSlug === activeShopSlug);
  }, [allItems, activeShopSlug]);

  const shopLogs = useMemo<ActivityLog[]>(() => {
    return activityLogs.filter((l) => l.shopSlug === activeShopSlug);
  }, [activityLogs, activeShopSlug]);

  const appendLocalAuditLog = useCallback(
    (actionDesc: string) => {
      // Hanya digunakan pada mode pratinjau lokal; pada Supabase, trigger DB yang menulis log secara aman
      if (supabase) return;
      const roleLabel = currentRole === 'owner' ? 'Owner Toko' : 'Staf Gudang';
      const nowStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const newLog: ActivityLog = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `log-${Date.now()}`,
        shopSlug: activeShopSlug,
        actorRole: roleLabel,
        action: actionDesc,
        time: `Hari ini, ${nowStr}`,
      };
      setActivityLogs((prev) => [newLog, ...prev.slice(0, 29)]);
    },
    [activeShopSlug, currentRole]
  );

  // Operasi CRUD dengan pengecekan `{ error }` dan rollback state optimistik
  const saveItemToCloud = async (updatedItem: RentalItem): Promise<boolean> => {
    const previousItems = allItems;
    setAllItems((prev) => {
      const exists = prev.some((i) => i.id === updatedItem.id);
      return exists
        ? prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
        : [updatedItem, ...prev];
    });

    if (!supabase) return true;

    const { error } = await supabase.from('rental_items').upsert(mapItemToDb(updatedItem));
    if (error) {
      setAllItems(previousItems);
      triggerToast(`Gagal menyimpan perubahan: ${error.message}`);
      return false;
    }
    return true;
  };

  const deleteItemFromCloud = async (itemId: string, itemName: string) => {
    if (currentRole !== 'owner') {
      triggerToast('Akses Ditolak: Hanya Owner yang dapat menghapus aset.');
      return;
    }
    const previousItems = allItems;
    setAllItems((prev) => prev.filter((i) => i.id !== itemId));

    if (!supabase) {
      appendLocalAuditLog(`Menghapus unit "${itemName}" dari inventaris`);
      triggerToast(`Unit "${itemName}" dihapus dari katalog`);
      return;
    }

    const { error } = await supabase.from('rental_items').delete().eq('id', itemId);
    if (error) {
      setAllItems(previousItems);
      triggerToast(`Gagal menghapus unit: ${error.message}`);
      return;
    }
    triggerToast(`Unit "${itemName}" dihapus dari katalog`);
  };

  const adjustItemStock = async (itemId: string, delta: number) => {
    if (currentRole === 'customer') return;
    const target = items.find((i) => i.id === itemId);
    if (!target) return;

    const previousItems = allItems;
    const nextStock = Math.max(0, target.stock + delta);
    const nextStatus: ItemStatus =
      nextStock === 0 && target.status === 'available'
        ? 'rented'
        : nextStock > 0 && target.status === 'rented'
        ? 'available'
        : target.status;

    setAllItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, stock: nextStock, status: nextStatus } : i))
    );

    if (!supabase) {
      appendLocalAuditLog(`Mengubah jumlah stok "${target.name}" menjadi ${nextStock} unit`);
      return;
    }

    const { data, error } = await supabase.rpc('adjust_item_stock', {
      p_item_id: itemId,
      p_delta: delta,
    });

    if (error) {
      setAllItems(previousItems);
      triggerToast(`Gagal memperbarui stok: ${error.message}`);
      return;
    }
    if (data) {
      const synced = mapItemFromDb(data as RentalItemDbRow);
      setAllItems((prev) => prev.map((i) => (i.id === synced.id ? synced : i)));
    }
  };

  const saveShopToCloud = async (updatedShop: Shop): Promise<boolean> => {
    const previousShops = shops;
    setShops((prev) =>
      prev.map((s) => (s.slug === updatedShop.slug ? updatedShop : s))
    );

    if (!supabase) return true;

    const { error } = await supabase
      .from('shops')
      .update(mapShopToDb(updatedShop))
      .eq('slug', updatedShop.slug);

    if (error) {
      setShops(previousShops);
      triggerToast(`Gagal memperbarui profil toko: ${error.message}`);
      return false;
    }
    return true;
  };

  const createShopAtomically = async (input: {
    slug: string;
    name: string;
    tagline: string;
    whatsapp: string;
    location: string;
    hours: string;
  }): Promise<Shop | null> => {
    if (!supabase) {
      if (shops.some((s) => s.slug === input.slug)) {
        triggerToast(`Tautan /${input.slug} sudah digunakan toko lain.`);
        return null;
      }
      const created: Shop = {
        slug: input.slug,
        name: input.name,
        tagline:
          input.tagline || 'Katalog Resmi Penyewaan Alat & Unit Operasional',
        categoryType: 'Umum',
        location: input.location,
        mapsUrl: 'https://maps.google.com',
        hours: input.hours,
        whatsapp: input.whatsapp,
        isVerified: false,
        plan: 'FREE',
        terms: [
          'Wajib meninggalkan kartu identitas asli (E-KTP) saat pengambilan unit.',
          'Pembayaran lunas saat serah terima alat.',
        ],
      };
      const starterItem: RentalItem = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `item-${Date.now()}`,
        shopSlug: input.slug,
        sku: 'UNIT-001',
        name: 'Unit Perdana (Silakan Edit di Panel Kerja)',
        category: 'Camping',
        iconType: 'tent',
        pricePerDay: 50000,
        status: 'available',
        stock: 2,
        availableAt: '',
        renterNote: '',
        lastUpdatedBy: 'Owner',
        specs: ['Kondisi siap pakai hari ini', 'Bisa dipesan langsung via WhatsApp'],
        imageBg: 'from-emerald-600 to-teal-800',
      };
      setShops((prev) => [...prev, created]);
      setAllItems((prev) => [starterItem, ...prev]);
      return created;
    }

    const { data, error } = await supabase.rpc('create_shop', {
      p_slug: input.slug,
      p_name: input.name,
      p_tagline: input.tagline,
      p_whatsapp: input.whatsapp,
      p_location: input.location,
      p_hours: input.hours,
    });

    if (error || !data) {
      triggerToast(error?.message || 'Gagal membuat toko baru.');
      return null;
    }

    const created = mapShopFromDb(data as ShopDbRow);
    setShops((prev) => [...prev.filter((s) => s.slug !== created.slug), created]);
    return created;
  };

  const createBookingOrder = async (params: {
    customerName: string;
    customerPhone: string;
    notes: string;
    multiplier: number;
    selectedList: (RentalItem & { qty: number; subtotal: number })[];
  }): Promise<Booking> => {
    const endDate = addDaysToIsoDate(startDate, durationDays);

    if (!supabase) {
      const code = `SBR-${startDate.replace(/-/g, '').slice(2)}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;
      const bookingId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `bk-${Date.now()}`;
      const totalAmount = params.selectedList.reduce((s, it) => s + it.subtotal, 0);
      const localBooking: Booking = {
        id: bookingId,
        shopSlug: activeShopSlug,
        code,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        startDate,
        endDate,
        durationDays,
        status: 'pending',
        totalAmount,
        notes: params.notes,
        createdAt: new Date().toISOString(),
        lines: params.selectedList.map((it, idx) => ({
          id: `${bookingId}-${idx}`,
          bookingId,
          itemId: it.id,
          itemName: it.name,
          qty: it.qty,
          unitPricePerDay: it.pricePerDay,
          subtotal: it.subtotal,
        })),
      };
      setBookings((prev) => [localBooking, ...prev]);
      appendLocalAuditLog(
        `Pengajuan booking ${code} (${params.customerName}) untuk ${startDate} s/d ${endDate}`
      );
      return localBooking;
    }

    const linesPayload = params.selectedList.map((it) => ({
      item_id: it.id,
      qty: it.qty,
    }));

    const { data, error } = await supabase.rpc('create_booking', {
      p_shop_slug: activeShopSlug,
      p_customer_name: params.customerName,
      p_customer_phone: params.customerPhone,
      p_start_date: startDate,
      p_duration_days: durationDays,
      p_multiplier: params.multiplier,
      p_lines: linesPayload,
      p_notes: params.notes,
    });

    if (error || !data) {
      throw new Error(error?.message || 'Gagal mencatat booking di server.');
    }

    const created = mapBookingFromDb(data as BookingDbRow);
    setBookings((prev) => [created, ...prev]);
    return created;
  };

  const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    const prevBookings = bookings;
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );

    if (!supabase) {
      appendLocalAuditLog(`Mengubah status booking menjadi ${newStatus.toUpperCase()}`);
      triggerToast(`Status booking diperbarui: ${newStatus.toUpperCase()}`);
      return;
    }

    const { error } = await supabase.rpc('update_booking_status', {
      p_booking_id: bookingId,
      p_new_status: newStatus,
    });

    if (error) {
      setBookings(prevBookings);
      triggerToast(`Gagal mengubah status booking: ${error.message}`);
      return;
    }
    triggerToast(`Status booking diperbarui: ${newStatus.toUpperCase()}`);
  };

  const inviteShopMember = async (email: string, role: 'owner' | 'staff') => {
    if (currentRole !== 'owner') {
      triggerToast('Hanya Owner yang dapat mengundang anggota.');
      return;
    }

    if (!supabase) {
      const mockInvite: ShopInvite = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `inv-${Date.now()}`,
        shopSlug: activeShopSlug,
        email,
        role,
        token: 'local-token',
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      setInvites((prev) => [mockInvite, ...prev.filter((i) => i.email !== email)]);
      appendLocalAuditLog(`Mengundang ${email} sebagai ${role.toUpperCase()}`);
      triggerToast(`Undangan ${role.toUpperCase()} untuk ${email} tercatat!`);
      return;
    }

    const { data, error } = await supabase.rpc('invite_shop_member', {
      p_shop_slug: activeShopSlug,
      p_email: email,
      p_role: role,
    });

    if (error || !data) {
      triggerToast(error?.message || 'Gagal mengirim undangan.');
      return;
    }

    const created = mapInviteFromDb(data as ShopInviteDbRow);
    setInvites((prev) => [created, ...prev.filter((i) => i.email !== created.email)]);
    triggerToast(`Undangan ${role.toUpperCase()} untuk ${email} berhasil dibuat!`);
  };

  return {
    cloudSynced,
    shops,
    shop,
    items,
    shopLogs,
    bookings,
    invites,
    availabilityMap,
    saveItemToCloud,
    deleteItemFromCloud,
    adjustItemStock,
    saveShopToCloud,
    createShopAtomically,
    createBookingOrder,
    updateBookingStatus,
    inviteShopMember,
    appendLocalAuditLog,
  };
}

