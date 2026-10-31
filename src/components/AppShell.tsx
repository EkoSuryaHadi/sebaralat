'use client';

import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { Sparkles, AlertTriangle, ArrowLeft } from 'lucide-react';
import {
  RentalItem,
  ViewMode,
  WorkspaceTab,
  ItemStatus,
  Role,
} from '@/types';
import { DURATION_OPTIONS } from '@/data/mockData';
import {
  formatRp,
  getTodayIsoDate,
  addDaysToIsoDate,
  calculateCartSummary,
  buildWhatsappCheckoutMessage,
  NewShopSchema,
  NewItemSchema,
  CreateBookingSchema,
  InviteMemberSchema,
  canAddRentalItem,
  isProPlanActive,
  STARTER_MAX_ITEMS,
} from '@/lib/validators';
import { useToast } from '@/hooks/useToast';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useShopData } from '@/hooks/useShopData';
import { RoleBar } from '@/components/RoleBar';
import { LandingPage, NewShopFormState } from '@/components/LandingPage';
import { CatalogView } from '@/components/CatalogView';
import { WorkspaceView } from '@/components/WorkspaceView';
import { AuthModal } from '@/components/AuthModal';
import { WaPreviewModal } from '@/components/WaPreviewModal';
import { AddItemModal, NewItemFormState } from '@/components/AddItemModal';
import { QrModal } from '@/components/QrModal';
import { UpgradeModal } from '@/components/UpgradeModal';

export interface AppShellProps {
  initialShopSlug?: string;
}

export function AppShell({ initialShopSlug }: AppShellProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { toastMsg, triggerToast } = useToast();

  // Routing & View Mode
  const [viewMode, setViewMode] = useState<ViewMode>(
    initialShopSlug ? 'catalog' : 'saas_home'
  );
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('inventory');
  const [activeShopSlug, setActiveShopSlug] = useState<string>(
    initialShopSlug || 'borneo-rental'
  );

  // Jadwal & Keranjang Katalog (tanggal dihitung setelah mount di klien untuk mematuhi Next.js 16 Cache Components prerendering)
  const todayIso = mounted ? getTodayIsoDate() : '';
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const startDate = selectedStartDate || todayIso;
  const setStartDate = setSelectedStartDate;
  const [durationDays, setDurationDays] = useState<number>(2);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showWaPreviewModal, setShowWaPreviewModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auth & Role dari Supabase Auth + shop_members
  const [showAuthModal, setShowAuthModal] = useState(false);
  const {
    user,
    memberships,
    currentRole,
    authLoading,
    sendEmailOtp,
    verifyEmailOtp,
    signOut,
    refreshMemberships,
    setDevSimulatedRole,
  } = useAuthSession(activeShopSlug);

  // Data Toko, Inventaris, Booking, dan Realtime Terfilter
  const {
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
    updateShopPlanLocally,
    createShopAtomically,
    createBookingOrder,
    updateBookingStatus,
    inviteShopMember,
    appendLocalAuditLog,
  } = useShopData({
    activeShopSlug,
    currentRole,
    startDate,
    durationDays,
    triggerToast,
  });

  // Workspace State
  const [adminSearch, setAdminSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedQrItem, setSelectedQrItem] = useState<RentalItem | null>(null);

  const [newItemForm, setNewItemForm] = useState<NewItemFormState>({
    name: '',
    sku: '',
    category: 'Camping',
    pricePerDay: '',
    stock: 1,
    spec1: '',
    spec2: '',
    imageUrl: '',
  });

  const [newShopForm, setNewShopForm] = useState<NewShopFormState>({
    name: '',
    tagline: '',
    slug: '',
    whatsapp: '628',
    location: 'Balikpapan',
    hours: '08.00 - 21.00 WITA',
  });

  // Sinkronisasi navigasi URL dengan pushState & popstate
  const navigateToShopCatalog = (slug: string) => {
    setActiveShopSlug(slug);
    setCart({});
    setViewMode('catalog');
    if (typeof window !== 'undefined') {
      window.history.pushState({ slug, viewMode: 'catalog' }, '', `/${slug}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToLandingHome = () => {
    setViewMode('saas_home');
    if (typeof window !== 'undefined') {
      window.history.pushState({ viewMode: 'saas_home' }, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get('view');
      if (viewParam === 'workspace') {
        setViewMode('workspace');
      }
      const storedDevRole = window.sessionStorage?.getItem('sebaraja_dev_role');
      if (storedDevRole === 'owner' || storedDevRole === 'staff') {
        setDevSimulatedRole(storedDevRole);
      }
    }

    const handlePopState = () => {
      const pathSlug = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (!pathSlug) {
        setViewMode('saas_home');
      } else {
        setActiveShopSlug(pathSlug);
        setViewMode('catalog');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setDevSimulatedRole]);

  // Jika user sudah terautentikasi dan memiliki toko terdaftar saat membuka root (/), langsung alihkan ke panel tokonya
  useEffect(() => {
    if (!initialShopSlug && !authLoading && user && memberships.length > 0) {
      const targetSlug = memberships[0].shopSlug;
      if (typeof window !== 'undefined') {
        window.location.replace(`/${targetSlug}?view=workspace`);
      }
    }
  }, [initialShopSlug, authLoading, user, memberships]);

  const currentDurationObj = useMemo(() => {
    return (
      DURATION_OPTIONS.find((d) => d.days === Number(durationDays)) || DURATION_OPTIONS[0]
    );
  }, [durationDays]);

  const filteredAdminItems = useMemo(() => {
    const q = adminSearch.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q))
    );
  }, [items, adminSearch]);

  const selectableCategories = useMemo(() => {
    const defaultList = ['Camping', 'Alat Teknik/Proyek', 'Kamera & Audio'];
    const fromItems = items
      .map((item) => item.category?.trim())
      .filter(
        (cat): cat is string =>
          Boolean(cat) && cat !== 'Semua' && cat !== '🟢 Ready Saja'
      );
    return Array.from(new Set([...defaultList, ...fromItems]));
  }, [items]);

  const catalogCategories = useMemo(() => {
    return ['Semua', '🟢 Ready Saja', ...selectableCategories];
  }, [selectableCategories]);

  const stats = useMemo(() => {
    return {
      ready: items.filter((i) => i.status === 'available').length,
      rented: items.filter((i) => i.status === 'rented').length,
      maintenance: items.filter((i) => i.status === 'maintenance').length,
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
        triggerToast(`Maksimal stok tersedia ${maxStock} unit untuk tanggal tersebut.`);
        return prev;
      }
      return { ...prev, [itemId]: nextQty };
    });
  };

  const cartSummary = useMemo(() => {
    return calculateCartSummary(cart, items, currentDurationObj, availabilityMap);
  }, [cart, items, currentDurationObj, availabilityMap]);

  const endDateIso = useMemo(
    () => addDaysToIsoDate(startDate, durationDays),
    [startDate, durationDays]
  );

  const whatsappMessageText = useMemo(() => {
    if (!shop) return '';
    return buildWhatsappCheckoutMessage({
      shopName: shop.name,
      startDate,
      endDate: endDateIso,
      durationLabel: currentDurationObj.label,
      cartSummary,
    });
  }, [cartSummary, shop, startDate, endDateIso, currentDurationObj]);

  const copyToClipboard = async (text: string, successMsg = 'Berhasil disalin!') => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        triggerToast(successMsg);
        return;
      }
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (!ok) {
        throw new Error('Clipboard gagal');
      }
      triggerToast(successMsg);
    } catch {
      triggerToast('Gagal menyalin otomatis. Silakan salin teks secara manual.');
    }
  };

  const handleOpenWhatsApp = (customText?: string) => {
    if (!shop) return;
    const textToSend = customText || whatsappMessageText;
    const cleanPhone = (shop.whatsapp || '6281234567890').replace(/[^0-9]/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
      textToSend
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCreateBookingAndOpenWa = async (customer: {
    customerName: string;
    customerPhone: string;
    notes: string;
  }) => {
    if (!shop) return;
    const parsed = CreateBookingSchema.safeParse({
      customerName: customer.customerName,
      customerPhone: customer.customerPhone,
      startDate,
      durationDays,
      notes: customer.notes,
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Input booking tidak valid.');
    }

    const booking = await createBookingOrder({
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.customerPhone,
      notes: parsed.data.notes,
      multiplier: currentDurationObj.multiplier,
      selectedList: cartSummary.selectedList,
    });

    const msgWithCode = buildWhatsappCheckoutMessage({
      shopName: shop.name,
      bookingCode: booking.code,
      customerName: booking.customerName,
      startDate: booking.startDate,
      endDate: booking.endDate,
      durationLabel: currentDurationObj.label,
      cartSummary,
      notes: booking.notes,
    });

    setShowWaPreviewModal(false);
    setCart({});
    triggerToast(`Kode Booking ${booking.code} berhasil dibuat!`);
    handleOpenWhatsApp(msgWithCode);
  };

  const handleStatusChange = async (itemId: string, newStatus: ItemStatus) => {
    if (currentRole === 'customer') return;
    const target = items.find((i) => i.id === itemId);
    if (!target) return;

    const actorLabel = currentRole === 'owner' ? 'Owner' : 'Staf Gudang';
    const updated: RentalItem = {
      ...target,
      status: newStatus,
      lastUpdatedBy: actorLabel,
    };
    if (newStatus === 'available' && updated.stock === 0) {
      updated.stock = 1;
    }

    const ok = await saveItemToCloud(updated);
    if (!ok) return;

    const statusLabel =
      newStatus === 'available'
        ? '🟢 READY'
        : newStatus === 'rented'
        ? '🔴 DISEWA'
        : '🟡 SERVIS';
    appendLocalAuditLog(`Mengubah status "${target.name}" menjadi ${statusLabel}`);
    triggerToast(`Status diperbarui: ${statusLabel}`);
  };

  const handleUpdateItemField = async (
    itemId: string,
    field: keyof RentalItem,
    value: RentalItem[keyof RentalItem]
  ) => {
    if (currentRole === 'customer') return;
    if (field === 'pricePerDay' && currentRole !== 'owner') {
      triggerToast('Hanya Owner yang memiliki izin mengubah harga sewa.');
      return;
    }
    const target = items.find((i) => i.id === itemId);
    if (!target) return;
    await saveItemToCloud({ ...target, [field]: value });
  };

  const handleAddNewItem = async (formData: NewItemFormState) => {
    if (!shop) {
      throw new Error('Data profil toko tidak ditemukan.');
    }
    if (currentRole !== 'owner') {
      throw new Error('Akses Ditolak: Hanya Owner yang dapat menambah unit baru.');
    }

    if (!canAddRentalItem(shop, items.length)) {
      setShowAddModal(false);
      setShowUpgradeModal(true);
      throw new Error(`Batas paket Starter tercapai (maksimal ${STARTER_MAX_ITEMS} unit alat). Silakan upgrade ke Bisnis PRO.`);
    }

    const parsed = NewItemSchema.safeParse(formData);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Periksa kembali data unit baru.');
    }

    const finalCategory = parsed.data.category;
    const getIconForCategory = (cat: string) => {
      const lower = cat.toLowerCase();
      if (lower.includes('camp') || lower.includes('outdoor') || lower.includes('tenda'))
        return 'tent';
      if (
        lower.includes('teknik') ||
        lower.includes('proyek') ||
        lower.includes('alat') ||
        lower.includes('bor') ||
        lower.includes('mesin')
      )
        return 'hammer';
      if (
        lower.includes('kamera') ||
        lower.includes('foto') ||
        lower.includes('video') ||
        lower.includes('lensa')
      )
        return 'camera';
      if (
        lower.includes('listrik') ||
        lower.includes('genset') ||
        lower.includes('power') ||
        lower.includes('baterai')
      )
        return 'zap';
      if (
        lower.includes('audio') ||
        lower.includes('sound') ||
        lower.includes('mic') ||
        lower.includes('radio') ||
        lower.includes('ht')
      )
        return 'radio';
      return 'shopping-bag';
    };

    const getBgForCategory = (cat: string) => {
      const lower = cat.toLowerCase();
      if (lower.includes('camp') || lower.includes('outdoor'))
        return 'from-emerald-600 to-teal-800';
      if (lower.includes('teknik') || lower.includes('proyek'))
        return 'from-amber-600 to-orange-800';
      if (lower.includes('kamera') || lower.includes('foto') || lower.includes('video'))
        return 'from-indigo-600 to-purple-800';
      if (lower.includes('listrik') || lower.includes('genset'))
        return 'from-yellow-600 to-amber-800';
      if (lower.includes('audio') || lower.includes('sound'))
        return 'from-violet-600 to-fuchsia-800';
      return 'from-cyan-600 to-blue-800';
    };

    const uniqueSuffix =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 4).toUpperCase()
        : String(Math.floor(1000 + Math.random() * 9000));

    const autoSku =
      parsed.data.sku ||
      `${shop.slug.substring(0, 3).toUpperCase()}-${uniqueSuffix}`;

    const newItem: RentalItem = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `item-${Date.now()}`,
      shopSlug: shop.slug,
      sku: autoSku,
      name: parsed.data.name,
      category: finalCategory,
      iconType: getIconForCategory(finalCategory),
      pricePerDay: parsed.data.pricePerDay,
      status: 'available',
      stock: parsed.data.stock,
      availableAt: '',
      renterNote: '',
      lastUpdatedBy: 'Owner',
      specs: [
        parsed.data.spec1 || 'Kondisi prima & terawat',
        parsed.data.spec2 || 'Siap pakai lengkap dengan tas/box',
      ],
      imageBg: getBgForCategory(finalCategory),
      imageUrl: parsed.data.imageUrl || undefined,
    };

    const ok = await saveItemToCloud(newItem);
    if (!ok) {
      throw new Error('Gagal menyimpan unit ke database cloud.');
    }

    appendLocalAuditLog(
      `Menambahkan unit baru "${newItem.name}" (${formatRp(newItem.pricePerDay)}/hari) - Kategori: ${newItem.category}`
    );
    setNewItemForm({
      name: '',
      sku: '',
      category: 'Camping',
      pricePerDay: '',
      stock: 1,
      spec1: '',
      spec2: '',
      imageUrl: '',
    });
    setShowAddModal(false);
    triggerToast('Unit baru berhasil ditambahkan ke katalog!');
  };

  const handleCreateNewShop = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = NewShopSchema.safeParse({
      ...newShopForm,
      slug: newShopForm.slug || newShopForm.name,
    });

    if (!parsed.success) {
      triggerToast(parsed.error.issues[0]?.message || 'Periksa kembali formulir pendaftaran toko.');
      return;
    }

    const createdShop = await createShopAtomically(parsed.data);
    if (!createdShop) return;

    await refreshMemberships();
    setDevSimulatedRole('owner');
    setActiveShopSlug(createdShop.slug);
    setCart({});
    setViewMode('workspace');
    setWorkspaceTab('inventory');
    if (typeof window !== 'undefined') {
      window.history.pushState({ slug: createdShop.slug, viewMode: 'workspace' }, '', `/${createdShop.slug}`);
    }
    triggerToast(`🎉 Toko "${createdShop.name}" aktif! Anda masuk sebagai Owner.`);
  };

  const handleInviteMember = async (email: string, role: 'owner' | 'staff') => {
    const parsed = InviteMemberSchema.safeParse({ email, role });
    if (!parsed.success) {
      triggerToast(parsed.error.issues[0]?.message || 'Email tidak valid.');
      return;
    }
    await inviteShopMember(parsed.data.email, parsed.data.role);
  };

  const handleCopyLink = () => {
    if (!shop) return;
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://sebaraja.com';
    copyToClipboard(`${origin}/${shop.slug}`, 'Tautan katalog resmi berhasil disalin!');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleVerifyOtpInApp = async (email: string, token: string) => {
    const res = await verifyEmailOtp(email, token);
    if (!res.error) {
      setShowAuthModal(false);
      const userShop = res.memberships?.[0]?.shopSlug || activeShopSlug;
      if (userShop) {
        setActiveShopSlug(userShop);
      }
      setViewMode('workspace');
      setWorkspaceTab('inventory');
      triggerToast('Login berhasil! Selamat datang di Panel Pengelola.');
    }
    return res;
  };

  const handleLogoutRole = async () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage?.removeItem('sebaraja_dev_role');
    }
    setDevSimulatedRole('customer');
    await signOut();
    if (initialShopSlug) {
      setViewMode('catalog');
      triggerToast('Berhasil keluar. Kembali ke tampilan Katalog Publik.');
    } else {
      setViewMode('saas_home');
      triggerToast('Berhasil keluar.');
    }
  };

  const handleSwitchRole = (role: Role) => {
    setDevSimulatedRole(role);
    if (typeof window !== 'undefined') {
      window.sessionStorage?.setItem('sebaraja_dev_role', role);
    }
    setViewMode('workspace');
    setWorkspaceTab('inventory');
    triggerToast(
      `Mode Demo: Masuk ke Workspace sebagai ${
        role === 'owner' ? 'Owner Toko' : 'Staf Gudang'
      }`
    );
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-semibold tracking-wide">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          Memuat Platform Sebaraja...
        </div>
      </div>
    );
  }

  // Tampilan transisi loading jika user sudah login dan sedang dialihkan ke tokonya dari root
  if (!initialShopSlug && user && memberships.length > 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 text-white">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center animate-spin">
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-300">
          Mengalihkan ke Panel Toko <span className="font-mono text-emerald-400 font-bold">/{memberships[0].shopSlug}</span>...
        </p>
      </div>
    );
  }

  // Tampilan 404 ketika pengguna mengakses slug toko yang tidak terdaftar
  if (viewMode !== 'saas_home' && !shop) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-extrabold">Katalog Toko Tidak Ditemukan (404)</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tautan katalog <span className="font-mono text-emerald-400">/{activeShopSlug}</span>{' '}
            belum terdaftar atau sudah tidak aktif.
          </p>
          <button
            onClick={navigateToLandingHome}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda Sebaraja</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-14">
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-100 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-emerald-500/40 flex items-center gap-2 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {shop && (
        <RoleBar
          currentRole={currentRole}
          shopName={shop.name}
          shopSlug={shop.slug}
          userEmail={user?.email}
          viewMode={viewMode}
          onToggleViewMode={() =>
            setViewMode(viewMode === 'catalog' ? 'workspace' : 'catalog')
          }
          onLogout={handleLogoutRole}
          onSwitchRole={handleSwitchRole}
        />
      )}

      {viewMode === 'saas_home' && (
        <LandingPage
          shops={shops}
          onSelectShop={navigateToShopCatalog}
          newShopForm={newShopForm}
          setNewShopForm={setNewShopForm}
          onCreateNewShop={handleCreateNewShop}
          userEmail={user?.email}
          onOpenAuthModal={() => setShowAuthModal(true)}
        />
      )}

      {viewMode !== 'saas_home' && shop && (
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
              minDate={todayIso}
              setStartDate={(val) => {
                if (val < todayIso) {
                  triggerToast('Tanggal ambil tidak boleh di masa lalu.');
                  setStartDate(todayIso);
                  return;
                }
                setStartDate(val);
              }}
              durationDays={durationDays}
              setDurationDays={setDurationDays}
              durationOptions={DURATION_OPTIONS}
              currentDurationObj={currentDurationObj}
              availabilityMap={availabilityMap}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={catalogCategories}
              cart={cart}
              onUpdateCartQty={updateCartQty}
              onOpenWhatsApp={handleOpenWhatsApp}
              cartSummary={cartSummary}
              onOpenCheckoutModal={() => setShowWaPreviewModal(true)}
              onOpenAuthModal={() => setShowAuthModal(true)}
              onOpenWorkspace={() => setViewMode('workspace')}
              onSelectShop={(slug) => {
                navigateToShopCatalog(slug);
                triggerToast('Membuka katalog mitra...');
              }}
              onNavigateHome={navigateToLandingHome}
              formatRp={formatRp}
              onSwitchRole={handleSwitchRole}
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
              bookings={bookings}
              invites={invites}
              onUpdateBookingStatus={updateBookingStatus}
              onInviteMember={handleInviteMember}
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
              onStockChange={adjustItemStock}
              onUpdateItemField={handleUpdateItemField}
              onSaveShopSettings={(updated) => {
                saveShopToCloud(updated);
              }}
              onRecordAuditLog={appendLocalAuditLog}
              triggerToast={triggerToast}
              onSwitchToOwnerLogin={() => setShowAuthModal(true)}
              formatRp={formatRp}
              allItemsCount={items.length}
              onOpenUpgradeModal={() => setShowUpgradeModal(true)}
            />
          )}
        </div>
      )}

      {shop && (
        <>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            shopName={shop.name}
            userEmail={user?.email}
            onSendEmailOtp={sendEmailOtp}
            onVerifyEmailOtp={handleVerifyOtpInApp}
            onDevSimulateRole={(role) => {
              setDevSimulatedRole(role);
              if (typeof window !== 'undefined') {
                window.sessionStorage?.setItem('sebaraja_dev_role', role);
              }
              setViewMode('workspace');
              setWorkspaceTab('inventory');
              triggerToast(
                `Mode Pratinjau: Masuk sebagai ${
                  role === 'owner' ? 'Owner Toko' : 'Staf Gudang'
                }`
              );
            }}
          />

          <WaPreviewModal
            isOpen={showWaPreviewModal}
            onClose={() => setShowWaPreviewModal(false)}
            shopName={shop.name}
            whatsappMessageText={whatsappMessageText}
            onCopy={() => copyToClipboard(whatsappMessageText, 'Format pesan disalin!')}
            onSubmitBookingAndSend={handleCreateBookingAndOpenWa}
          />

          <AddItemModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            form={newItemForm}
            setForm={setNewItemForm}
            onSubmit={handleAddNewItem}
            categories={selectableCategories}
            shopSlug={shop.slug}
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

          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            shop={shop}
            onSimulateUpgrade={async (cycle) => {
              if (updateShopPlanLocally) {
                const days = cycle === 'yearly' ? 365 : 30;
                const expires = new Date(Date.now() + days * 86400000).toISOString();
                updateShopPlanLocally(shop.slug, 'PRO', cycle, expires);
                triggerToast('⚡ Mode Demo: Paket PRO berhasil diaktifkan untuk toko ini!');
              }
            }}
          />
        </>
      )}
    </div>
  );
}
