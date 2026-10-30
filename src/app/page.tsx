'use client';

import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { Sparkles } from 'lucide-react';
import {
  supabase,
  isSupabaseConfigured,
  mapShopFromDb,
  mapShopToDb,
  mapItemFromDb,
  mapItemToDb,
  mapLogFromDb,
  mapLogToDb,
  ShopDbRow,
  RentalItemDbRow,
  ActivityLogDbRow,
} from '@/lib/supabase';
import {
  Shop,
  RentalItem,
  ActivityLog,
  Role,
  ViewMode,
  WorkspaceTab,
  ItemStatus
} from '@/types';
import {
  DEFAULT_SHOPS,
  DEFAULT_ITEMS,
  DURATION_OPTIONS,
  CATEGORIES
} from '@/data/mockData';
import { RoleBar } from '@/components/RoleBar';
import { LandingPage, NewShopFormState } from '@/components/LandingPage';
import { CatalogView } from '@/components/CatalogView';
import { WorkspaceView } from '@/components/WorkspaceView';
import { AuthModal } from '@/components/AuthModal';
import { WaPreviewModal } from '@/components/WaPreviewModal';
import { AddItemModal, NewItemFormState } from '@/components/AddItemModal';
import { QrModal } from '@/components/QrModal';

interface AppProps {
  initialShopSlug?: string;
}

export default function App({ initialShopSlug }: AppProps) {
  // Hydration Guard using useSyncExternalStore
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [cloudSynced, setCloudSynced] = useState(isSupabaseConfigured);

  // Role & View Routing
  const [viewMode, setViewMode] = useState<ViewMode>(initialShopSlug ? 'catalog' : 'saas_home');
  const [currentRole, setCurrentRole] = useState<Role>('customer');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('inventory');

  // Multi-toko & Inventaris
  const [shops, setShops] = useState<Shop[]>(DEFAULT_SHOPS);
  const [activeShopSlug, setActiveShopSlug] = useState<string>(initialShopSlug || 'borneo-rental');
  const [allItems, setAllItems] = useState<RentalItem[]>(DEFAULT_ITEMS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    {
      id: 'log-1',
      shopSlug: 'borneo-rental',
      actorRole: 'Staf Gudang',
      action: 'Mengubah status Genset Silent Inverter 2200W menjadi 🔴 DISEWA',
      time: 'Hari ini, 08:15 WITA'
    },
    {
      id: 'log-2',
      shopSlug: 'borneo-rental',
      actorRole: 'Owner',
      action: 'Memperbarui stok Tenda Eiger Kapasitas 4-5 Orang menjadi 4 unit',
      time: 'Kemarin, 19:40 WITA'
    }
  ]);

  // Auth State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginTargetRole, setLoginTargetRole] = useState<Role>('owner');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Catalog State
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('2026-10-30');
  const [durationDays, setDurationDays] = useState(2);
  const [showTerms, setShowTerms] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showWaPreviewModal, setShowWaPreviewModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Workspace Internal State
  const [adminSearch, setAdminSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedQrItem, setSelectedQrItem] = useState<RentalItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form Tambah Unit
  const [newItemForm, setNewItemForm] = useState<NewItemFormState>({
    name: '',
    sku: '',
    category: 'Camping',
    pricePerDay: '',
    stock: 1,
    spec1: '',
    spec2: ''
  });

  // Form Mitra Toko Baru
  const [newShopForm, setNewShopForm] = useState<NewShopFormState>({
    name: '',
    tagline: '',
    slug: '',
    whatsapp: '628',
    location: 'Balikpapan',
    hours: '08.00 - 21.00 WITA',
    ownerPin: '1234',
    staffPin: '0000'
  });

  // Handle browser popstate navigation
  useEffect(() => {
    const handlePopState = () => {
      const pathSlug = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (pathSlug && pathSlug !== 'dashboard' && pathSlug !== 'login') {
        const matched = shops.find((s) => s.slug === pathSlug);
        if (matched) {
          setActiveShopSlug(matched.slug);
          setViewMode('catalog');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [shops]);

  // =========================================================
  // SUPABASE REALTIME & INITIAL FETCH
  // =========================================================
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    // 1. Fetch initial data from Supabase
    const loadInitialData = async () => {
      try {
        const [shopsRes, itemsRes, logsRes] = await Promise.all([
          client.from('shops').select('*'),
          client.from('rental_items').select('*'),
          client.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(30),
        ]);

        if (shopsRes.data && shopsRes.data.length > 0) {
          setShops(shopsRes.data.map(mapShopFromDb));
        }
        if (itemsRes.data && itemsRes.data.length > 0) {
          setAllItems(itemsRes.data.map(mapItemFromDb));
        }
        if (logsRes.data && logsRes.data.length > 0) {
          setActivityLogs(logsRes.data.map(mapLogFromDb));
        }
        setCloudSynced(true);
      } catch (err) {
        console.warn('Supabase fetch error, fallback to initial state:', err);
      }
    };

    loadInitialData();

    // 2. Subscribe to Realtime PostgreSQL Changes
    const channel = client
      .channel('public_db_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rental_items' },
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
        { event: '*', schema: 'public', table: 'shops' },
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
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          const newLog = mapLogFromDb(payload.new as ActivityLogDbRow);
          setActivityLogs((prev) => [newLog, ...prev.filter((l) => l.id !== newLog.id).slice(0, 29)]);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  // Current Active Shop
  const shop = useMemo<Shop>(() => {
    return shops.find((s) => s.slug === activeShopSlug) || shops[0] || DEFAULT_SHOPS[0];
  }, [shops, activeShopSlug]);

  const items = useMemo<RentalItem[]>(() => {
    return allItems.filter((i) => i.shopSlug === shop.slug);
  }, [allItems, shop.slug]);

  const shopLogs = useMemo<ActivityLog[]>(() => {
    return activityLogs.filter((l) => l.shopSlug === shop.slug);
  }, [activityLogs, shop.slug]);

  const recordAuditLog = async (actionDesc: string) => {
    const roleLabel =
      currentRole === 'owner'
        ? 'Owner Toko'
        : currentRole === 'staff'
        ? 'Staf Gudang'
        : 'Super Admin';
    const nowStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      shopSlug: shop.slug,
      actorRole: roleLabel,
      action: actionDesc,
      time: `Hari ini, ${nowStr}`
    };

    setActivityLogs((prev) => [newLog, ...prev.slice(0, 29)]);

    if (supabase) {
      try {
        await supabase.from('activity_logs').insert(mapLogToDb(newLog));
      } catch (e) {
        console.warn('Audit log Supabase sync warning:', e);
      }
    }
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const copyToClipboard = (text: string, successMsg = 'Berhasil disalin!') => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => triggerToast(successMsg));
    } else {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        triggerToast(successMsg);
      } catch {
        triggerToast(successMsg);
      }
    }
  };

  const formatRp = (num: number) => {
    return 'Rp' + Math.round(num).toLocaleString('id-ID');
  };

  const saveItemToCloud = async (updatedItem: RentalItem) => {
    setAllItems((prev) => {
      const exists = prev.some((i) => i.id === updatedItem.id);
      return exists
        ? prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
        : [updatedItem, ...prev];
    });

    if (supabase) {
      try {
        await supabase.from('rental_items').upsert(mapItemToDb(updatedItem));
      } catch (e) {
        console.warn('Save item to Supabase warning:', e);
      }
    }
  };

  const deleteItemFromCloud = async (itemId: string, itemName: string) => {
    if (currentRole !== 'owner' && currentRole !== 'superadmin') {
      triggerToast('Akses Ditolak: Hanya Owner yang dapat menghapus aset.');
      return;
    }
    setAllItems((prev) => prev.filter((i) => i.id !== itemId));
    recordAuditLog(`Menghapus unit "${itemName}" dari inventaris`);
    triggerToast(`Unit "${itemName}" dihapus dari katalog`);

    if (supabase) {
      try {
        await supabase.from('rental_items').delete().eq('id', itemId);
      } catch (e) {
        console.warn('Delete item from Supabase warning:', e);
      }
    }
  };

  const saveShopToCloud = async (updatedShop: Shop) => {
    setShops((prev) => {
      const exists = prev.some((s) => s.slug === updatedShop.slug);
      return exists
        ? prev.map((s) => (s.slug === updatedShop.slug ? updatedShop : s))
        : [...prev, updatedShop];
    });

    if (supabase) {
      try {
        await supabase.from('shops').upsert(mapShopToDb(updatedShop));
      } catch (e) {
        console.warn('Save shop to Supabase warning:', e);
      }
    }
  };

  const handleRoleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const expectedOwnerPin = shop.ownerPin || '1234';
    const expectedStaffPin = shop.staffPin || '0000';

    if (loginTargetRole === 'owner') {
      if (pinInput === expectedOwnerPin) {
        setCurrentRole('owner');
        setViewMode('workspace');
        setWorkspaceTab('inventory');
        setShowAuthModal(false);
        setPinInput('');
        triggerToast(`Selamat datang, Owner ${shop.name}`);
      } else {
        setAuthError('PIN Owner tidak sesuai.');
      }
    } else if (loginTargetRole === 'staff') {
      if (pinInput === expectedStaffPin || pinInput === expectedOwnerPin) {
        setCurrentRole('staff');
        setViewMode('workspace');
        setWorkspaceTab('inventory');
        setShowAuthModal(false);
        setPinInput('');
        triggerToast('Masuk sebagai Staf Gudang (Mode Operasional)');
      } else {
        setAuthError('PIN Staf Gudang salah.');
      }
    }
  };

  const handleLogoutRole = () => {
    setCurrentRole('customer');
    setViewMode('catalog');
    triggerToast('Berhasil keluar. Kembali ke tampilan Katalog Publik.');
  };

  const currentDurationObj = useMemo(() => {
    return DURATION_OPTIONS.find((d) => d.days === Number(durationDays)) || DURATION_OPTIONS[0];
  }, [durationDays]);

  const filteredAdminItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(adminSearch.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(adminSearch.toLowerCase()))
    );
  }, [items, adminSearch]);

  const stats = useMemo(() => {
    return {
      ready: items.filter((i) => i.status === 'available').length,
      rented: items.filter((i) => i.status === 'rented').length,
      maintenance: items.filter((i) => i.status === 'maintenance').length
    };
  }, [items]);

  const updateCartQty = (itemId: string, delta: number, maxStock: number) => {
    setCart((prev) => {
      const currentQty = prev[itemId] || 0;
      const nextQty = currentQty + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      if (nextQty > maxStock) {
        triggerToast(`Maksimal stok tersedia ${maxStock} unit`);
        return prev;
      }
      return { ...prev, [itemId]: nextQty };
    });
  };

  const cartSummary = useMemo(() => {
    const selectedList: (RentalItem & { qty: number; subtotal: number })[] = [];
    let totalUnits = 0;
    let totalCost = 0;

    Object.entries(cart).forEach(([itemId, qty]) => {
      const item = items.find((i) => i.id === itemId);
      if (item && item.status === 'available' && qty > 0) {
        const validQty = Math.min(qty, item.stock || 1);
        const subtotal = item.pricePerDay * currentDurationObj.multiplier * validQty;
        selectedList.push({
          ...item,
          qty: validQty,
          subtotal
        });
        totalUnits += validQty;
        totalCost += subtotal;
      }
    });

    return { selectedList, totalUnits, totalCost };
  }, [cart, items, currentDurationObj]);

  const whatsappMessageText = useMemo(() => {
    if (cartSummary.selectedList.length === 0) return '';
    const lines = cartSummary.selectedList
      .map((it, idx) => `${idx + 1}. *${it.name}* (${it.qty} unit) = ${formatRp(it.subtotal)}`)
      .join('\n');

    return (
      `Halo Admin *${shop.name}*, saya ingin menyewa alat dari katalog resmi:\n\n` +
      `📅 *Tanggal Ambil:* ${startDate}\n` +
      `⏳ *Durasi Sewa:* ${currentDurationObj.label}\n\n` +
      `📦 *Rincian Unit:*\n${lines}\n\n` +
      `💰 *Total Estimasi:* ${formatRp(cartSummary.totalCost)}\n\n` +
      `Mohon konfirmasi ketersediaan unit tersebut. Terima kasih.`
    );
  }, [cartSummary, shop.name, startDate, currentDurationObj]);

  const handleOpenWhatsApp = (customText?: string) => {
    const textToSend = customText || whatsappMessageText;
    const cleanPhone = (shop.whatsapp || '6281234567890').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleStatusChange = (itemId: string, newStatus: ItemStatus) => {
    if (currentRole === 'customer') return;
    const target = items.find((i) => i.id === itemId);
    if (!target) return;

    const actorLabel = currentRole === 'owner' ? 'Owner' : 'Staf Gudang';
    const updated: RentalItem = { ...target, status: newStatus, lastUpdatedBy: actorLabel };
    if (newStatus === 'available' && updated.stock === 0) {
      updated.stock = 1;
    }
    if (newStatus === 'rented' && !updated.availableAt) {
      updated.availableAt = 'Besok, 14:00';
    }
    saveItemToCloud(updated);

    const statusLabel =
      newStatus === 'available' ? '🟢 READY' : newStatus === 'rented' ? '🔴 DISEWA' : '🟡 SERVIS';
    recordAuditLog(`Mengubah status "${target.name}" menjadi ${statusLabel}`);
    triggerToast(`Status diperbarui: ${statusLabel}`);
  };

  const handleStockChange = (itemId: string, delta: number) => {
    if (currentRole === 'customer') return;
    const target = items.find((i) => i.id === itemId);
    if (!target) return;
    const nextStock = Math.max(0, target.stock + delta);
    const nextStatus = nextStock === 0 && target.status === 'available' ? 'rented' : target.status;
    const actorLabel = currentRole === 'owner' ? 'Owner' : 'Staf Gudang';

    saveItemToCloud({
      ...target,
      stock: nextStock,
      status: nextStatus,
      lastUpdatedBy: actorLabel
    });
    recordAuditLog(`Mengubah jumlah stok "${target.name}" menjadi ${nextStock} unit`);
  };

  const handleUpdateItemField = (
    itemId: string,
    field: keyof RentalItem,
    value: RentalItem[keyof RentalItem]
  ) => {
    if (currentRole === 'customer') return;
    if (field === 'pricePerDay' && currentRole !== 'owner' && currentRole !== 'superadmin') {
      triggerToast('Hanya Owner yang memiliki izin mengubah harga sewa.');
      return;
    }
    const target = items.find((i) => i.id === itemId);
    if (!target) return;
    saveItemToCloud({ ...target, [field]: value });
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole !== 'owner' && currentRole !== 'superadmin') {
      triggerToast('Akses Ditolak: Hanya Owner yang dapat menambah unit baru.');
      return;
    }
    if (!newItemForm.name || !newItemForm.pricePerDay) return;

    const iconMap: Record<string, string> = {
      Camping: 'tent',
      'Alat Teknik/Proyek': 'hammer',
      'Kamera & Audio': 'camera'
    };

    const bgMap: Record<string, string> = {
      Camping: 'from-emerald-600 to-teal-800',
      'Alat Teknik/Proyek': 'from-amber-600 to-orange-800',
      'Kamera & Audio': 'from-indigo-600 to-purple-800'
    };

    const autoSku =
      newItemForm.sku ||
      `${shop.slug.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newItem: RentalItem = {
      id: `item-${Date.now()}`,
      shopSlug: shop.slug,
      sku: autoSku,
      name: newItemForm.name,
      category: newItemForm.category,
      iconType: iconMap[newItemForm.category] || 'tent',
      pricePerDay: Number(newItemForm.pricePerDay),
      status: 'available',
      stock: Number(newItemForm.stock) || 1,
      availableAt: '',
      renterNote: '',
      lastUpdatedBy: 'Owner',
      specs: [
        newItemForm.spec1 || 'Kondisi prima & terawat',
        newItemForm.spec2 || 'Siap pakai lengkap dengan tas/box'
      ],
      imageBg: bgMap[newItemForm.category] || 'from-emerald-600 to-teal-800'
    };

    saveItemToCloud(newItem);
    recordAuditLog(`Menambahkan unit baru "${newItem.name}" (${formatRp(newItem.pricePerDay)}/hari)`);
    setNewItemForm({
      name: '',
      sku: '',
      category: 'Camping',
      pricePerDay: '',
      stock: 1,
      spec1: '',
      spec2: ''
    });
    setShowAddModal(false);
    triggerToast('Unit baru berhasil ditambahkan ke katalog!');
  };

  const handleCreateNewShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopForm.name || !newShopForm.whatsapp) return;

    const cleanSlug =
      (newShopForm.slug || newShopForm.name)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `rental-${Math.floor(Math.random() * 999)}`;

    const createdShop: Shop = {
      slug: cleanSlug,
      name: newShopForm.name,
      tagline: newShopForm.tagline || 'Katalog Resmi Penyewaan Alat & Unit Operasional',
      categoryType: 'Umum',
      location: newShopForm.location || 'Indonesia',
      mapsUrl: 'https://maps.google.com',
      hours: newShopForm.hours || '08.00 - 21.00',
      whatsapp: newShopForm.whatsapp,
      ownerPin: newShopForm.ownerPin || '1234',
      staffPin: newShopForm.staffPin || '0000',
      isVerified: true,
      plan: 'PRO',
      ownerId: 'owner-' + cleanSlug,
      terms: [
        'Wajib meninggalkan kartu identitas asli (E-KTP) saat pengambilan unit.',
        'Pembayaran lunas saat serah terima alat.'
      ],
      partnerShop: {
        name: 'Borneo Outdoor & Teknik Rental',
        slug: 'borneo-rental'
      }
    };

    await saveShopToCloud(createdShop);

    const starterItem: RentalItem = {
      id: `item-${Date.now()}-1`,
      shopSlug: cleanSlug,
      sku: 'UNIT-001',
      name: 'Unit Perdana (Silakan Edit di Menu Owner)',
      category: 'Camping',
      iconType: 'tent',
      pricePerDay: 50000,
      status: 'available',
      stock: 2,
      availableAt: '',
      renterNote: '',
      lastUpdatedBy: 'Owner',
      specs: ['Kondisi siap pakai hari ini', 'Bisa dipesan langsung via WhatsApp'],
      imageBg: 'from-emerald-600 to-teal-800'
    };

    await saveItemToCloud(starterItem);

    setActiveShopSlug(cleanSlug);
    setCart({});
    setCurrentRole('owner');
    setViewMode('workspace');
    setWorkspaceTab('inventory');
    triggerToast(`🎉 Toko "${createdShop.name}" aktif! Anda masuk sebagai Owner.`);
  };

  const handleCopyLink = () => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://tebaralat.id';
    copyToClipboard(`${origin}/${shop.slug}`, 'Tautan katalog resmi berhasil disalin!');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-semibold tracking-wide">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          Memuat Platform TebarAlat...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-14">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-emerald-500/40 flex items-center gap-2 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Role Management Bar */}
      <RoleBar
        currentRole={currentRole}
        shopName={shop.name}
        viewMode={viewMode}
        onToggleViewMode={() =>
          setViewMode(viewMode === 'catalog' ? 'workspace' : 'catalog')
        }
        onLogout={handleLogoutRole}
      />

      {/* View Mode: SaaS Landing Page */}
      {viewMode === 'saas_home' && (
        <LandingPage
          shops={shops}
          onSelectShop={(slug) => {
            setActiveShopSlug(slug);
            setViewMode('catalog');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          newShopForm={newShopForm}
          setNewShopForm={setNewShopForm}
          onCreateNewShop={handleCreateNewShop}
        />
      )}

      {/* View Mode: Mobile-First Catalog or Workspace */}
      {viewMode !== 'saas_home' && (
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative overflow-hidden sm:border-x border-slate-200">
          {viewMode === 'catalog' && (
            <CatalogView
              shop={shop}
              shops={shops}
              items={items}
              currentRole={currentRole}
              copiedLink={copiedLink}
              onCopyLink={handleCopyLink}
              showTerms={showTerms}
              setShowTerms={setShowTerms}
              startDate={startDate}
              setStartDate={setStartDate}
              durationDays={durationDays}
              setDurationDays={setDurationDays}
              durationOptions={DURATION_OPTIONS}
              currentDurationObj={currentDurationObj}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={CATEGORIES}
              cart={cart}
              onUpdateCartQty={updateCartQty}
              onOpenWhatsApp={handleOpenWhatsApp}
              cartSummary={cartSummary}
              onOpenCheckoutModal={() => setShowWaPreviewModal(true)}
              onOpenAuthModal={() => {
                setLoginTargetRole('staff');
                setAuthError('');
                setShowAuthModal(true);
              }}
              onOpenWorkspace={() => setViewMode('workspace')}
              onSelectShop={(slug) => {
                setActiveShopSlug(slug);
                setCart({});
                window.scrollTo({ top: 0, behavior: 'smooth' });
                triggerToast(`Membuka katalog`);
              }}
              onNavigateHome={() => setViewMode('saas_home')}
              formatRp={formatRp}
            />
          )}

          {viewMode === 'workspace' && (
            <WorkspaceView
              shop={shop}
              currentRole={currentRole}
              cloudSynced={cloudSynced}
              stats={stats}
              workspaceTab={workspaceTab}
              setWorkspaceTab={setWorkspaceTab}
              shopLogs={shopLogs}
              adminSearch={adminSearch}
              setAdminSearch={setAdminSearch}
              filteredAdminItems={filteredAdminItems}
              onOpenAddModal={() => setShowAddModal(true)}
              onOpenQrModal={(item) => {
                setSelectedQrItem(item);
                setShowQrModal(true);
              }}
              onDeleteUnit={deleteItemFromCloud}
              onStatusChange={handleStatusChange}
              onStockChange={handleStockChange}
              onUpdateItemField={handleUpdateItemField}
              onSaveShopSettings={saveShopToCloud}
              onRecordAuditLog={recordAuditLog}
              triggerToast={triggerToast}
              onSwitchToOwnerLogin={() => {
                setLoginTargetRole('owner');
                setAuthError('');
                setShowAuthModal(true);
              }}
              formatRp={formatRp}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        shopName={shop.name}
        loginTargetRole={loginTargetRole}
        setLoginTargetRole={setLoginTargetRole}
        pinInput={pinInput}
        setPinInput={setPinInput}
        authError={authError}
        onSubmit={handleRoleLogin}
      />

      <WaPreviewModal
        isOpen={showWaPreviewModal}
        onClose={() => setShowWaPreviewModal(false)}
        shopName={shop.name}
        whatsappMessageText={whatsappMessageText}
        onCopy={() => copyToClipboard(whatsappMessageText, 'Format pesan disalin!')}
        onSend={() => {
          handleOpenWhatsApp();
          setShowWaPreviewModal(false);
        }}
      />

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        form={newItemForm}
        setForm={setNewItemForm}
        onSubmit={handleAddNewItem}
      />

      <QrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        shop={shop}
        selectedQrItem={selectedQrItem}
        onPrint={() => {
          window.print?.();
          triggerToast('Membuka dialog cetak stiker QR...');
          setShowQrModal(false);
        }}
      />
    </div>
  );
}
