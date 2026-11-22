'use client';

import React, { useState, useMemo, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, AlertTriangle, ArrowLeft } from 'lucide-react';
import {
  RentalItem,
  ViewMode,
  WorkspaceTab,
  ItemStatus,
  Role,
  Booking,
  DeliveryMode,
} from '@/types';
import { DURATION_OPTIONS } from '@/data/mockData';
import {
  formatRp,
  getTodayIsoDate,
  addDaysToIsoDate,
  calculateCartSummary,
  buildWhatsappCheckoutMessage,
  buildShopDurationOptions,
  getPublicSiteOrigin,
  NewShopSchema,
  NewItemSchema,
  CreateBookingSchema,
  InviteMemberSchema,
  canAddRentalItem,
  STARTER_MAX_ITEMS,
} from '@/lib/validators';
import { useToast } from '@/hooks/useToast';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useShopData } from '@/hooks/useShopData';
import { RoleBar } from '@/components/RoleBar';
import { isSupabaseConfigured } from '@/lib/supabase';
import { trackAnalyticsEvent } from '@/lib/analytics';
import { LandingPage, NewShopFormState } from '@/components/LandingPage';
import { CatalogView } from '@/components/CatalogView';
import { WorkspaceView } from '@/components/WorkspaceView';
import { AuthModal } from '@/components/AuthModal';
import { WaPreviewModal } from '@/components/WaPreviewModal';
import { AddItemModal, NewItemFormState } from '@/components/AddItemModal';
import { ItemDetailModal } from '@/components/ItemDetailModal';
import { BookingStatusModal } from '@/components/BookingStatusModal';
import { WalkInBookingModal } from '@/components/WalkInBookingModal';
import { QrModal } from '@/components/QrModal';
import { UpgradeModal } from '@/components/UpgradeModal';

export interface AppShellProps {
  initialShopSlug?: string;
}

export function AppShell({ initialShopSlug }: AppShellProps) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { toastMsg, triggerToast } = useToast();

  // Routing & View Mode (mendukung query ?view=workspace dan ?item=id tanpa setState sinkron di useEffect)
  const [manualViewMode, setViewMode] = useState<ViewMode | null>(null);
  const urlViewParam =
    mounted && typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('view')
      : null;
  const viewMode: ViewMode =
    manualViewMode ??
    (urlViewParam === 'workspace' ? 'workspace' : initialShopSlug ? 'catalog' : 'saas_home');

  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('inventory');
  const [activeShopSlug, setActiveShopSlug] = useState<string>(
    initialShopSlug || 'borneo-rental'
  );

  // Jadwal & Keranjang Katalog (tanggal dihitung setelah mount di klien untuk mematuhi Next.js 16 Cache Components prerendering)
  const todayIso = mounted ? getTodayIsoDate() : '';
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const startDate = selectedStartDate || todayIso;
  const setStartDate = setSelectedStartDate;
  const [durationDays, setDurationDays] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [bundleCart, setBundleCart] = useState<Record<string, number>>({});
  const [pickupTime, setPickupTime] = useState<string>('09:00');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('pickup');
  const [showWaPreviewModal, setShowWaPreviewModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [detailItem, setDetailItem] = useState<RentalItem | null>(null);
  const [manualHighlightedItemId, setHighlightedItemId] = useState<string | null | undefined>(
    undefined
  );
  const urlItemParam =
    mounted && typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('item')
      : null;
  const highlightedItemId: string | null =
    manualHighlightedItemId !== undefined ? manualHighlightedItemId : urlItemParam;

  const urlBookingParam =
    mounted && typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('booking')
      : null;
  const [manualBookingModalOpen, setBookingModalOpen] = useState<boolean | null>(null);
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);
  const [lookupInitialCode, setLookupInitialCode] = useState<string>('');
  const showBookingStatusModal =
    manualBookingModalOpen !== null ? manualBookingModalOpen : Boolean(urlBookingParam);

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
    members,
    availabilityMap,
    saveItemToCloud,
    deleteItemFromCloud,
    adjustItemStock,
    saveShopToCloud,
    updateShopPlanLocally,
    createShopAtomically,
    createBookingOrder,
    createWalkInBooking,
    updateBookingStatus,
    updateBookingHandover,
    lookupBookingByCode,
    sendTestShopNotification,
    inviteShopMember,
    removeShopMember,
    revokeShopInvite,
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
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RentalItem | null>(null);
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
    spec3: '',
    imageUrl: '',
  });

  const [newShopForm, setNewShopForm] = useState<NewShopFormState>(() => {
    const defaultDraft: NewShopFormState = {
      name: '',
      tagline: '',
      slug: '',
      whatsapp: '628',
      location: 'Balikpapan',
      hours: '08.00 - 21.00 WIB',
    };
    if (typeof window !== 'undefined') {
      try {
        const saved = window.sessionStorage?.getItem('sebaraja_draft_shop_form');
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<NewShopFormState>;
          return { ...defaultDraft, ...parsed };
        }
      } catch {
        // Abaikan jika JSON tidak valid
      }
    }
    return defaultDraft;
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
  }, []);

  // Jika user sudah terautentikasi dan memiliki toko terdaftar saat membuka root (/), langsung alihkan ke panel tokonya
  useEffect(() => {
    if (!initialShopSlug && !authLoading && user && memberships.length > 0) {
      const targetSlug = memberships[0].shopSlug;
      if (typeof window !== 'undefined') {
        window.location.replace(`/${targetSlug}?view=workspace`);
      }
    }
  }, [initialShopSlug, authLoading, user, memberships]);

  const shopDurationOptions = useMemo(() => {
    return buildShopDurationOptions(shop?.discountTiers, durationDays);
  }, [shop?.discountTiers, durationDays]);

  const currentDurationObj = useMemo(() => {
    return (
      shopDurationOptions.find((d) => d.days === Number(durationDays)) ||
      shopDurationOptions[0] ||
      DURATION_OPTIONS[0]
    );
  }, [shopDurationOptions, durationDays]);

  const filteredAdminItems = useMemo(() => {
    const q = adminSearch.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q))
    );
  }, [items, adminSearch]);

  const itemCategories = useMemo(() => {
    const fromItems = items
      .map((item) => item.category?.trim())
      .filter(
        (cat): cat is string =>
          Boolean(cat) && cat !== 'Semua' && cat !== '🟢 Ready Saja'
      );
    return Array.from(new Set(fromItems));
  }, [items]);

  const selectableCategories = useMemo(() => {
    const defaultList = ['Camping', 'Alat Teknik/Proyek', 'Kamera & Audio'];
    return itemCategories.length > 0 ? itemCategories : defaultList;
  }, [itemCategories]);

  const catalogCategories = useMemo(() => {
    return ['Semua', '🟢 Ready Saja', ...itemCategories];
  }, [itemCategories]);

  const effectiveSelectedCategory = catalogCategories.includes(selectedCategory)
    ? selectedCategory
    : 'Semua';

  const stats = useMemo(() => {
    return {
      ready: items.filter((i) => i.status === 'available').length,
      rented: items.filter((i) => i.status === 'rented').length,
      maintenance: items.filter((i) => i.status === 'maintenance').length,
    };
  }, [items]);

  const updateCartQty = (itemId: string, delta: number, maxStock: number) => {
    const currentBefore = cart[itemId] || 0;
    if (delta > 0 && currentBefore === 0 && maxStock > 0 && shop) {
      void trackAnalyticsEvent({
        eventType: 'add_to_cart',
        path: `/${shop.slug}`,
        shopSlug: shop.slug,
      });
    }
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

  const updateBundleCartQty = (bundleId: string, delta: number, maxAvail: number) => {
    const currentBefore = bundleCart[bundleId] || 0;
    if (delta > 0 && currentBefore === 0 && maxAvail > 0 && shop) {
      void trackAnalyticsEvent({
        eventType: 'add_to_cart',
        path: `/${shop.slug}`,
        shopSlug: shop.slug,
      });
    }
    setBundleCart((prev) => {
      const currentQty = prev[bundleId] || 0;
      const nextQty = currentQty + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[bundleId];
        return copy;
      }
      if (nextQty > maxAvail) {
        triggerToast(`Maksimal kuota paket bundling tersedia ${maxAvail} paket.`);
        return prev;
      }
      return { ...prev, [bundleId]: nextQty };
    });
  };

  const cartSummary = useMemo(() => {
    return calculateCartSummary(
      cart,
      items,
      currentDurationObj,
      availabilityMap,
      shop?.discountTiers,
      bundleCart,
      shop?.bundles
    );
  }, [cart, items, currentDurationObj, availabilityMap, shop?.discountTiers, bundleCart, shop?.bundles]);

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
      pickupTime,
      deliveryMode,
    });
  }, [cartSummary, shop, startDate, endDateIso, currentDurationObj, pickupTime, deliveryMode]);

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
    pickupTime: string;
    deliveryMode: DeliveryMode;
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
      pickupTime: customer.pickupTime,
      deliveryMode: customer.deliveryMode,
      multiplier: currentDurationObj.multiplier,
      selectedList: cartSummary.selectedList,
      selectedBundles: cartSummary.selectedBundles,
    });

    const origin = getPublicSiteOrigin();
    const trackingUrl = `${origin}/${shop.slug}?booking=${encodeURIComponent(booking.code)}`;

    const msgWithCode = buildWhatsappCheckoutMessage({
      shopName: shop.name,
      bookingCode: booking.code,
      customerName: booking.customerName,
      startDate: booking.startDate,
      endDate: booking.endDate,
      durationLabel: currentDurationObj.label,
      cartSummary,
      notes: booking.notes,
      trackingUrl,
      pickupTime: customer.pickupTime,
      deliveryMode: customer.deliveryMode,
    });

    setShowWaPreviewModal(false);
    setCart({});
    setBundleCart({});
    void trackAnalyticsEvent({
      eventType: 'booking_created',
      path: `/${shop.slug}`,
      shopSlug: shop.slug,
    });
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

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setNewItemForm({
      name: '',
      sku: '',
      category: selectableCategories[0] || 'Umum',
      pricePerDay: '',
      stock: 1,
      spec1: '',
      spec2: '',
      spec3: '',
      imageUrl: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: RentalItem) => {
    setEditingItem(item);
    setNewItemForm({
      name: item.name,
      sku: item.sku || '',
      category: item.category || 'Camping',
      pricePerDay: String(item.pricePerDay),
      stock: item.stock,
      spec1: item.specs?.[0] || '',
      spec2: item.specs?.[1] || '',
      spec3: item.specs?.[2] || '',
      imageUrl: item.imageUrl || '',
    });
    setShowAddModal(true);
  };

  const handleAddNewItem = async (formData: NewItemFormState) => {
    if (!shop) {
      throw new Error('Data profil toko tidak ditemukan.');
    }
    if (currentRole !== 'owner') {
      throw new Error('Akses Ditolak: Hanya Owner yang dapat menambah atau mengedit unit.');
    }

    if (!editingItem && !canAddRentalItem(shop, items.length)) {
      setShowAddModal(false);
      setShowUpgradeModal(true);
      throw new Error(`Batas paket Starter tercapai (maksimal ${STARTER_MAX_ITEMS} unit alat). Silakan upgrade ke Bisnis PRO.`);
    }

    const parsed = NewItemSchema.safeParse(formData);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || 'Periksa kembali data unit.');
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
      editingItem?.sku ||
      `${shop.slug.substring(0, 3).toUpperCase()}-${uniqueSuffix}`;

    const customSpecs = [
      parsed.data.spec1,
      parsed.data.spec2,
      parsed.data.spec3,
    ]
      .map((s) => (s || '').trim())
      .filter((s) => s.length > 0);

    const finalSpecs =
      customSpecs.length > 0
        ? customSpecs
        : ['Kondisi prima & terawat', 'Siap pakai lengkap dengan tas/box'];

    const itemPayload: RentalItem = {
      id:
        editingItem?.id ||
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `item-${Date.now()}`),
      shopSlug: shop.slug,
      sku: autoSku,
      name: parsed.data.name,
      category: finalCategory,
      iconType: getIconForCategory(finalCategory),
      pricePerDay: parsed.data.pricePerDay,
      status: editingItem?.status || 'available',
      stock: parsed.data.stock,
      availableAt: editingItem?.availableAt || '',
      renterNote: editingItem?.renterNote || '',
      lastUpdatedBy: 'Owner',
      specs: finalSpecs,
      imageBg: getBgForCategory(finalCategory),
      imageUrl: parsed.data.imageUrl || undefined,
    };

    const ok = await saveItemToCloud(itemPayload);
    if (!ok) {
      throw new Error('Gagal menyimpan unit ke database cloud.');
    }

    appendLocalAuditLog(
      editingItem
        ? `Memperbarui detail unit "${itemPayload.name}" (${formatRp(itemPayload.pricePerDay)}/hari)`
        : `Menambahkan unit baru "${itemPayload.name}" (${formatRp(itemPayload.pricePerDay)}/hari) - Kategori: ${itemPayload.category}`
    );
    setNewItemForm({
      name: '',
      sku: '',
      category: 'Camping',
      pricePerDay: '',
      stock: 1,
      spec1: '',
      spec2: '',
      spec3: '',
      imageUrl: '',
    });
    setEditingItem(null);
    setShowAddModal(false);
    triggerToast(
      editingItem
        ? 'Perubahan detail unit berhasil disimpan!'
        : 'Unit baru berhasil ditambahkan ke katalog!'
    );
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

    if (isSupabaseConfigured && !user) {
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage?.setItem(
            'sebaraja_draft_shop_form',
            JSON.stringify(newShopForm)
          );
        } catch {
          // Abaikan error storage
        }
        triggerToast('Simpan sementara! Silakan login dengan email untuk meluncurkan toko Anda.');
        router.push('/login?redirect=/#daftar-toko');
      }
      return;
    }

    const createdShop = await createShopAtomically(parsed.data);
    if (!createdShop) return;

    void trackAnalyticsEvent({
      eventType: 'shop_created',
      path: '/',
      shopSlug: createdShop.slug,
    });

    if (typeof window !== 'undefined') {
      window.sessionStorage?.removeItem('sebaraja_draft_shop_form');
    }

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
    const origin = getPublicSiteOrigin();
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
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-accent-text text-xs font-semibold tracking-wide">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
          Memuat Platform Sebaraja...
        </div>
      </div>
    );
  }

  // Tampilan transisi loading jika user sudah login dan sedang dialihkan ke tokonya dari root
  if (!initialShopSlug && user && memberships.length > 0) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center space-y-3 text-fg">
        <div className="w-10 h-10 rounded-2xl bg-accent-soft border border-accent/30 text-accent-text flex items-center justify-center animate-spin">
          <Sparkles className="w-5 h-5" />
        </div>
        <p className="text-xs text-muted">
          Mengalihkan ke Panel Toko <span className="font-mono text-accent-text font-bold">/{memberships[0].shopSlug}</span>...
        </p>
      </div>
    );
  }

  // Tampilan 404 ketika pengguna mengakses slug toko yang tidak terdaftar
  if (viewMode !== 'saas_home' && !shop) {
    return (
      <div className="min-h-screen bg-bg aurora text-fg flex items-center justify-center p-6">
        <div className="max-w-sm w-full glass-strong rounded-bento p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-warn-soft border border-warn/30 text-warn-text flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="font-display text-lg font-extrabold tracking-tight">Katalog Toko Tidak Ditemukan (404)</h1>
          <p className="text-xs text-muted leading-relaxed">
            Tautan katalog <span className="font-mono text-accent-text">/{activeShopSlug}</span>{' '}
            belum terdaftar atau sudah tidak aktif.
          </p>
          <button
            onClick={navigateToLandingHome}
            className="btn-brutal w-full py-3 text-xs flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda Sebaraja</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg font-sans pb-14 selection:bg-pop selection:text-[#0c110f]">
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-100 glass-strong text-fg px-4 py-2.5 rounded-full shadow-2xl border border-accent/40 flex items-center gap-2 text-xs font-semibold animate-rise">
          <Sparkles className="w-4 h-4 text-accent-text shrink-0" />
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
        <div className={`mx-auto min-h-screen transition-all ${viewMode === 'catalog' ? 'max-w-md sm:max-w-xl bg-surface sm:border-x border-line shadow-xl' : 'max-w-5xl'}`}>
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
              endDate={endDateIso}
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
              durationOptions={shopDurationOptions}
              currentDurationObj={currentDurationObj}
              availabilityMap={availabilityMap}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={effectiveSelectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={catalogCategories}
              cart={cart}
              onUpdateCartQty={updateCartQty}
              bundleCart={bundleCart}
              onUpdateBundleCartQty={updateBundleCartQty}
              onOpenWhatsApp={handleOpenWhatsApp}
              cartSummary={cartSummary}
              onOpenCheckoutModal={() => {
                if (shop) {
                  void trackAnalyticsEvent({
                    eventType: 'wa_checkout_click',
                    path: `/${shop.slug}`,
                    shopSlug: shop.slug,
                  });
                }
                setShowWaPreviewModal(true);
              }}
              onOpenAuthModal={() => setShowAuthModal(true)}
              onOpenWorkspace={() => setViewMode('workspace')}
              onSelectShop={(slug) => {
                navigateToShopCatalog(slug);
                triggerToast('Membuka katalog mitra...');
              }}
              onNavigateHome={navigateToLandingHome}
              formatRp={formatRp}
              onSwitchRole={handleSwitchRole}
              highlightedItemId={highlightedItemId}
              onClearHighlightedItem={() => {
                setHighlightedItemId(null);
                if (typeof window !== 'undefined' && shop) {
                  window.history.replaceState({}, '', `/${shop.slug}`);
                }
              }}
              onSelectItemDetail={(item) => {
                if (shop) {
                  void trackAnalyticsEvent({
                    eventType: 'item_detail_view',
                    path: `/${shop.slug}`,
                    shopSlug: shop.slug,
                  });
                }
                setDetailItem(item);
              }}
              onOpenBookingLookup={() => {
                setSelectedReceiptBooking(null);
                setLookupInitialCode(urlBookingParam || '');
                setBookingModalOpen(true);
              }}
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
              members={members}
              onUpdateBookingStatus={updateBookingStatus}
              onUpdateBookingHandover={updateBookingHandover}
              onOpenWalkInModal={() => setShowWalkInModal(true)}
              onSendTestNotification={sendTestShopNotification}
              onInviteMember={handleInviteMember}
              onRemoveMember={removeShopMember}
              onRevokeInvite={revokeShopInvite}
              adminSearch={adminSearch}
              setAdminSearch={setAdminSearch}
              filteredAdminItems={filteredAdminItems}
              onOpenAddModal={handleOpenCreateModal}
              onOpenEditModal={handleOpenEditModal}
              onOpenQrModal={(item) => {
                setSelectedQrItem(item);
                setShowQrModal(true);
              }}
              onOpenBookingReceipt={(bk) => {
                setSelectedReceiptBooking(bk);
                setLookupInitialCode(bk.code);
                setBookingModalOpen(true);
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
            shopQrisUrl={shop.qrisUrl}
            whatsappMessageText={whatsappMessageText}
            pickupTime={pickupTime}
            setPickupTime={setPickupTime}
            deliveryMode={deliveryMode}
            setDeliveryMode={setDeliveryMode}
            onCopy={() => copyToClipboard(whatsappMessageText, 'Format pesan disalin!')}
            onSubmitBookingAndSend={handleCreateBookingAndOpenWa}
          />

          <WalkInBookingModal
            isOpen={showWalkInModal}
            onClose={() => setShowWalkInModal(false)}
            items={items}
            discountTiers={shop.discountTiers}
            availabilityMap={availabilityMap}
            formatRp={formatRp}
            onSubmitWalkIn={async (params) => {
              const created = await createWalkInBooking(params);
              setSelectedReceiptBooking(created);
              setLookupInitialCode(created.code);
              setBookingModalOpen(true);
            }}
          />

          <AddItemModal
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setEditingItem(null);
            }}
            form={newItemForm}
            setForm={setNewItemForm}
            onSubmit={handleAddNewItem}
            categories={selectableCategories}
            shopSlug={shop.slug}
            isLimitReached={!canAddRentalItem(shop, items.length)}
            onOpenUpgradeModal={() => setShowUpgradeModal(true)}
            editingItem={editingItem}
          />

          <ItemDetailModal
            item={detailItem}
            onClose={() => setDetailItem(null)}
            shopName={shop.name}
            durationDays={durationDays}
            currentDurationObj={currentDurationObj}
            effectiveStock={
              detailItem
                ? availabilityMap && typeof availabilityMap[detailItem.id] === 'number'
                  ? availabilityMap[detailItem.id]
                  : detailItem.status === 'available'
                  ? detailItem.stock
                  : 0
                : 0
            }
            inCartQty={detailItem ? cart[detailItem.id] || 0 : 0}
            onUpdateCartQty={updateCartQty}
            onOpenWhatsApp={handleOpenWhatsApp}
            formatRp={formatRp}
          />

          <BookingStatusModal
            isOpen={showBookingStatusModal}
            onClose={() => {
              setBookingModalOpen(false);
              setSelectedReceiptBooking(null);
            }}
            shop={shop}
            initialBooking={selectedReceiptBooking}
            initialCode={lookupInitialCode || urlBookingParam || ''}
            onLookupByCode={lookupBookingByCode}
            demoSampleCodes={bookings.slice(0, 3).map((b) => b.code)}
            formatRp={formatRp}
            onOpenWhatsApp={handleOpenWhatsApp}
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
