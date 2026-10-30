'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  MapPin,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Share2,
  Plus,
  Minus,
  MessageCircle,
  QrCode,
  Sliders,
  Eye,
  CheckCircle2,
  XCircle,
  Wrench,
  Calendar,
  Sparkles,
  Copy,
  Check,
  PackagePlus,
  Trash2,
  Printer,
  ArrowRight,
  Tent,
  Zap,
  Camera,
  Hammer,
  Radio,
  ShoppingBag,
  ExternalLink,
  Users,
  Store,
  Cloud,
  Settings,
  Lock,
  LogOut,
  ShieldCheck,
  UserCheck,
  History,
  BadgeCheck,
  Building2,
  KeyRound,
  AlertCircle,
  ChevronRight,
  BarChart3,
  FileText
} from 'lucide-react';

// --- CLOUD STORAGE & REALTIME DATABASE (FIRESTORE) ---
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

let db = null;
let auth = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'tebaralat-prod-v1';

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    const firebaseConfig = JSON.parse(__firebase_config);
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (err) {
  console.error('Firebase init fallback to memory:', err);
}

// --- DATA AWAL DEFAULT (SEED DATA) ---
const DEFAULT_SHOPS = [
  {
    slug: 'borneo-rental',
    name: 'Borneo Outdoor & Teknik Rental',
    tagline: 'Pusat Sewa Alat Camping & Proyek Terlengkap di Balikpapan',
    categoryType: 'Outdoor & Teknik',
    location: 'Jl. MT Haryono, Balikpapan Selatan',
    mapsUrl: 'https://maps.google.com',
    hours: '08.00 - 21.00 WITA',
    whatsapp: '6281234567890',
    ownerPin: '1234', // PIN Pemilik Toko (Full Akses)
    staffPin: '0000', // PIN Staf Gudang (Hanya Ubah Status Ready/Disewa)
    isVerified: true,
    plan: 'PRO',
    ownerId: 'demo-owner',
    terms: [
      'Wajib meninggalkan E-KTP asli domisili aktif sebagai jaminan.',
      'Pelunasan dilakukan saat pengambilan unit (Tersedia QRIS & Transfer Bank).',
      'Keterlambatan pengembalian dikenakan denda 10% per jam dari tarif harian.',
      'Segala bentuk kerusakan akibat kelalaian pemakaian menjadi tanggung jawab penyewa.'
    ],
    partnerShop: {
      name: 'Kaltim Pro Kamera & Multimedia',
      slug: 'kaltim-kamera'
    }
  },
  {
    slug: 'kaltim-kamera',
    name: 'Kaltim Pro Kamera & Multimedia',
    tagline: 'Sewa Kamera Mirrorless, Lensa, Lighting & Gimbal Profesional',
    categoryType: 'Kamera & Multimedia',
    location: 'Balikpapan Tengah, Kalimantan Timur',
    mapsUrl: 'https://maps.google.com',
    hours: '09.00 - 22.00 WITA',
    whatsapp: '6281298765432',
    ownerPin: '1234',
    staffPin: '0000',
    isVerified: true,
    plan: 'PRO',
    ownerId: 'demo-owner-2',
    terms: [
      'Wajib menunjukkan minimal 2 identitas aktif yang sesuai (E-KTP + SIM/NPWP/ID Kerja).',
      'Booking jadwal tanggal wajib DP minimal 30% melalui QRIS resmi toko.'
    ],
    partnerShop: {
      name: 'Borneo Outdoor & Teknik Rental',
      slug: 'borneo-rental'
    }
  }
];

const DEFAULT_ITEMS = [
  {
    id: 'item-1',
    shopSlug: 'borneo-rental',
    sku: 'BRN-TND-01',
    name: 'Tenda Eiger Kapasitas 4-5 Orang',
    category: 'Camping',
    iconType: 'tent',
    pricePerDay: 55000,
    status: 'available',
    stock: 4,
    availableAt: '',
    renterNote: '',
    lastUpdatedBy: 'Owner',
    specs: ['Double layer waterproof tahan badai', 'Frame alloy ringan + pasak lengkap', 'Dimensi 210 x 240 cm + Vestibule'],
    imageBg: 'from-emerald-600 to-teal-800'
  },
  {
    id: 'item-2',
    shopSlug: 'borneo-rental',
    sku: 'BRN-GNS-02',
    name: 'Genset Silent Inverter 2200W',
    category: 'Alat Teknik/Proyek',
    iconType: 'zap',
    pricePerDay: 175000,
    status: 'rented',
    stock: 0,
    availableAt: 'Minggu, 1 Nov (14:00)',
    renterNote: 'Pak Budi - Proyek Ruko MT Haryono',
    lastUpdatedBy: 'Staf Gudang',
    specs: ['Tipe Silent (Suara sangat halus)', 'BBM Bensin Murni (Hemat konsumsi)', 'Output stabil aman untuk alat elektronik'],
    imageBg: 'from-amber-600 to-orange-800'
  },
  {
    id: 'item-3',
    shopSlug: 'borneo-rental',
    sku: 'BRN-JCK-03',
    name: 'Jackhammer / Mesin Bobok Beton PH65',
    category: 'Alat Teknik/Proyek',
    iconType: 'hammer',
    pricePerDay: 120000,
    status: 'available',
    stock: 2,
    availableAt: '',
    renterNote: '',
    lastUpdatedBy: 'Owner',
    specs: ['Daya 1240W impact tinggi', 'Termasuk 2 mata pahat baja (lancip & pipih)', 'Koper besi + kabel ekstensi 10 meter'],
    imageBg: 'from-slate-700 to-slate-900'
  },
  {
    id: 'item-4',
    shopSlug: 'borneo-rental',
    sku: 'BRN-CAM-04',
    name: 'Kamera Mirrorless Sony A6400 + Kit',
    category: 'Kamera & Audio',
    iconType: 'camera',
    pricePerDay: 150000,
    status: 'available',
    stock: 1,
    availableAt: '',
    renterNote: '',
    lastUpdatedBy: 'Owner',
    specs: ['Sensor 24MP & Perekaman 4K HDR', 'Include 2 Baterai + SD Card 64GB Extreme', 'Tas pelindung + Charger dual slot'],
    imageBg: 'from-indigo-600 to-purple-800'
  },
  {
    id: 'item-5',
    shopSlug: 'borneo-rental',
    sku: 'BRN-HT-05',
    name: 'Paket 4 Unit HT (Handy Talky) Event',
    category: 'Kamera & Audio',
    iconType: 'radio',
    pricePerDay: 80000,
    status: 'available',
    stock: 3,
    availableAt: '',
    renterNote: '',
    lastUpdatedBy: 'Owner',
    specs: ['1 Paket berisi 4 unit HT + Earpiece', 'Jangkauan 2-3 KM area terbuka', 'Baterai awet hingga 18 jam operasional'],
    imageBg: 'from-blue-600 to-cyan-800'
  },
  {
    id: 'item-6',
    shopSlug: 'borneo-rental',
    sku: 'BRN-KMP-06',
    name: 'Kompor Portable Windproof + Gas',
    category: 'Camping',
    iconType: 'tent',
    pricePerDay: 30000,
    status: 'maintenance',
    stock: 0,
    availableAt: 'Pengecekan katup pengaman',
    renterNote: 'Inspeksi rutin bulanan di gudang',
    lastUpdatedBy: 'Staf Gudang',
    specs: ['Kelopak pelindung angin terintegrasi', 'Sudah termasuk 1 kaleng gas baru', 'Box koper plastik keras'],
    imageBg: 'from-rose-600 to-red-800'
  },
  {
    id: 'item-7',
    shopSlug: 'kaltim-kamera',
    sku: 'KLT-SNY-01',
    name: 'Sony A7III Fullframe + Tamron 28-75mm',
    category: 'Kamera & Audio',
    iconType: 'camera',
    pricePerDay: 275000,
    status: 'available',
    stock: 2,
    availableAt: '',
    renterNote: '',
    lastUpdatedBy: 'Owner',
    specs: ['Full Frame Sensor 24MP Lowlight', 'Lensa bukaan konstan f/2.8 tajam', '2 Baterai FZ100 + SD Card 128GB'],
    imageBg: 'from-indigo-600 to-violet-900'
  },
  {
    id: 'item-8',
    shopSlug: 'kaltim-kamera',
    sku: 'KLT-DJI-02',
    name: 'Stabilizer Gimbal DJI RS3 Mini',
    category: 'Kamera & Audio',
    iconType: 'zap',
    pricePerDay: 110000,
    status: 'available',
    stock: 1,
    availableAt: '',
    renterNote: '',
    lastUpdatedBy: 'Owner',
    specs: ['Native Vertical & Horizontal Shooting', 'Beban maksimal 2 Kg', 'Baterai tahan 10 jam'],
    imageBg: 'from-cyan-600 to-blue-900'
  }
];

const DURATION_OPTIONS = [
  { days: 1, label: '1 Hari (24 Jam)', multiplier: 1, discountTag: null },
  { days: 2, label: '2 Hari', multiplier: 2, discountTag: null },
  { days: 3, label: '3 Hari (Hemat 10%)', multiplier: 2.7, discountTag: 'Hemat 10%' },
  { days: 7, label: '1 Minggu (Hemat 25%)', multiplier: 5.25, discountTag: 'Hemat 25%' }
];

const CATEGORIES = ['Semua', '🟢 Ready Saja', 'Camping', 'Alat Teknik/Proyek', 'Kamera & Audio'];

/**
 * SISTEM MANAJEMEN ROLE (RBAC):
 * 1. 'customer'     -> Pengunjung Publik / Penyewa (Hanya bisa melihat katalog, hitung sewa, checkout WA)
 * 2. 'staff'        -> Staf Gudang / Operator (Hanya bisa ubah status Ready/Disewa/Servis & stok, tidak bisa hapus alat atau ubah harga/pengaturan toko)
 * 3. 'owner'        -> Pemilik Usaha Rental (Akses penuh: CRUD Alat, Ubah Harga, Pengaturan WA Toko, Cetak QR, Lihat Audit Log)
 * 4. 'superadmin'   -> Pengelola Platform TebarAlat (Bisa melihat metrik seluruh mitra toko & direktori)
 */

export default function App() {
  // --- HYDRATION GUARD ---
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [cloudSynced, setCloudSynced] = useState(false);

  // --- ROLE & VIEW ROUTING ---
  // viewMode: 'saas_home' (Landing Page Komersial Utama) | 'catalog' (Toko Publik) | 'workspace' (Dashboard Internal)
  const [viewMode, setViewMode] = useState('saas_home');
  const [currentRole, setCurrentRole] = useState('customer'); // 'customer' | 'staff' | 'owner' | 'superadmin'
  const [workspaceTab, setWorkspaceTab] = useState('inventory'); // 'inventory' | 'logs' | 'settings'
  const [openFaq, setOpenFaq] = useState(0);

  // --- MULTI-TOKO & INVENTARIS ---
  const [shops, setShops] = useState(DEFAULT_SHOPS);
  const [activeShopSlug, setActiveShopSlug] = useState('borneo-rental');
  const [allItems, setAllItems] = useState(DEFAULT_ITEMS);
  const [activityLogs, setActivityLogs] = useState([
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

  // --- STATE LOGIN MODAL (AUTH PIN PER ROLE) ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginTargetRole, setLoginTargetRole] = useState('owner'); // 'staff' | 'owner' | 'superadmin'
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');

  // --- STATE KATALOG PENYEWA ---
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('2026-10-31');
  const [durationDays, setDurationDays] = useState(2);
  const [showTerms, setShowTerms] = useState(false);
  const [cart, setCart] = useState({});
  const [showWaPreviewModal, setShowWaPreviewModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // --- STATE WORKSPACE INTERNAL ---
  const [adminSearch, setAdminSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedQrItem, setSelectedQrItem] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Form Tambah Alat Baru (Hanya Owner)
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    sku: '',
    category: 'Camping',
    pricePerDay: '',
    stock: 1,
    spec1: '',
    spec2: ''
  });

  // Form Pendaftaran Mitra Toko Baru (SaaS Onboarding)
  const [newShopForm, setNewShopForm] = useState({
    name: '',
    tagline: '',
    slug: '',
    whatsapp: '628',
    location: 'Balikpapan',
    hours: '08.00 - 21.00 WITA',
    ownerPin: '1234',
    staffPin: '0000'
  });

  // Deteksi otomatis URL Slug jika dibuka pada rute /[slug]
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const pathSlug = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (pathSlug && pathSlug !== 'dashboard' && pathSlug !== 'login') {
        const matched = DEFAULT_SHOPS.find((s) => s.slug === pathSlug);
        if (matched) {
          setActiveShopSlug(matched.slug);
          setViewMode('catalog');
        }
      }
    }
  }, []);

  // --- KONEKSI FIREBASE AUTH & FIRESTORE REALTIME ---
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error('Auth error:', e);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const shopsRef = collection(db, 'artifacts', appId, 'public', 'data', 'tebaralat_shops');
    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'tebaralat_items');

    const unsubShops = onSnapshot(
      shopsRef,
      (snap) => {
        if (snap.empty) {
          DEFAULT_SHOPS.forEach((s) => {
            setDoc(doc(shopsRef, s.slug), s).catch(() => {});
          });
        } else {
          const loaded = snap.docs.map((d) => d.data());
          setShops(loaded);
          setCloudSynced(true);
        }
      },
      (err) => console.error('Shops snapshot error:', err)
    );

    const unsubItems = onSnapshot(
      itemsRef,
      (snap) => {
        if (snap.empty) {
          DEFAULT_ITEMS.forEach((it) => {
            setDoc(doc(itemsRef, it.id), it).catch(() => {});
          });
        } else {
          const loaded = snap.docs.map((d) => d.data());
          setAllItems(loaded);
          setCloudSynced(true);
        }
      },
      (err) => console.error('Items snapshot error:', err)
    );

    return () => {
      unsubShops();
      unsubItems();
    };
  }, [user]);

  // Data toko yang sedang dibuka
  const shop = useMemo(() => {
    return shops.find((s) => s.slug === activeShopSlug) || shops[0] || DEFAULT_SHOPS[0];
  }, [shops, activeShopSlug]);

  const items = useMemo(() => {
    return allItems.filter((i) => i.shopSlug === shop.slug);
  }, [allItems, shop.slug]);

  const shopLogs = useMemo(() => {
    return activityLogs.filter((l) => l.shopSlug === shop.slug);
  }, [activityLogs, shop.slug]);

  // Catat Log Aktivitas Audit
  const recordAuditLog = (actionDesc) => {
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
    const newLog = {
      id: `log-${Date.now()}`,
      shopSlug: shop.slug,
      actorRole: roleLabel,
      action: actionDesc,
      time: `Hari ini, ${nowStr}`
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 29)]);
  };

  // Simpan perubahan item ke Cloud + State Lokal
  const saveItemToCloud = async (updatedItem) => {
    setAllItems((prev) => {
      const exists = prev.some((i) => i.id === updatedItem.id);
      return exists
        ? prev.map((i) => (i.id === updatedItem.id ? updatedItem : i))
        : [updatedItem, ...prev];
    });
    if (user && db) {
      try {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'tebaralat_items', updatedItem.id);
        await setDoc(ref, updatedItem);
      } catch (e) {
        console.error('Save item error:', e);
      }
    }
  };

  const deleteItemFromCloud = async (itemId, itemName) => {
    if (currentRole !== 'owner' && currentRole !== 'superadmin') {
      triggerToast('Akses Ditolak: Hanya Owner yang dapat menghapus aset.');
      return;
    }
    setAllItems((prev) => prev.filter((i) => i.id !== itemId));
    recordAuditLog(`Menghapus unit "${itemName}" dari inventaris`);
    triggerToast(`Unit "${itemName}" dihapus dari katalog`);
    if (user && db) {
      try {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'tebaralat_items', itemId);
        await deleteDoc(ref);
      } catch (e) {
        console.error('Delete item error:', e);
      }
    }
  };

  // Simpan perubahan toko ke Cloud + State Lokal
  const saveShopToCloud = async (updatedShop) => {
    setShops((prev) => {
      const exists = prev.some((s) => s.slug === updatedShop.slug);
      return exists
        ? prev.map((s) => (s.slug === updatedShop.slug ? updatedShop : s))
        : [...prev, updatedShop];
    });
    if (user && db) {
      try {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'tebaralat_shops', updatedShop.slug);
        await setDoc(ref, updatedShop);
      } catch (e) {
        console.error('Save shop error:', e);
      }
    }
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const copyToClipboard = (text, successMsg = 'Berhasil disalin!') => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      triggerToast(successMsg);
    } catch (e) {
      navigator.clipboard?.writeText(text);
      triggerToast(successMsg);
    }
  };

  const formatRp = (num) => {
    return 'Rp' + Math.round(num).toLocaleString('id-ID');
  };

  const renderItemIcon = (type, className = 'w-8 h-8 text-white') => {
    switch (type) {
      case 'tent':
        return <Tent className={className} />;
      case 'zap':
        return <Zap className={className} />;
      case 'hammer':
        return <Hammer className={className} />;
      case 'camera':
        return <Camera className={className} />;
      case 'radio':
        return <Radio className={className} />;
      default:
        return <ShoppingBag className={className} />;
    }
  };

  // --- AUTENTIKASI PIN BERDASARKAN ROLE ---
  const handleRoleLogin = (e) => {
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
        setAuthError('PIN Owner tidak sesuai. (Demo PIN: 1234)');
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
        setAuthError('PIN Staf Gudang salah. (Demo PIN: 0000)');
      }
    } else if (loginTargetRole === 'superadmin') {
      if (pinInput === '9999') {
        setCurrentRole('superadmin');
        setViewMode('saas_home');
        setShowAuthModal(false);
        setPinInput('');
        triggerToast('Mode Super Admin Platform Aktif');
      } else {
        setAuthError('PIN Super Admin salah. (Demo PIN: 9999)');
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

  const filteredCatalogItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.specs && item.specs.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));
      if (!matchSearch) return false;

      if (selectedCategory === 'Semua') return true;
      if (selectedCategory === '🟢 Ready Saja') return item.status === 'available' && item.stock > 0;
      return item.category === selectedCategory;
    });
  }, [items, searchQuery, selectedCategory]);

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

  // Operasi Keranjang Sewa Pelanggan
  const updateCartQty = (itemId, delta, maxStock) => {
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
    const selectedList = [];
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

  const handleOpenWhatsApp = (customText = null) => {
    const textToSend = customText || whatsappMessageText;
    const cleanPhone = (shop.whatsapp || '6281234567890').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // --- FUNGSI OPERASIONAL GUDANG & OWNER (1-TAP TOGGLE) ---
  const handleStatusChange = (itemId, newStatus) => {
    if (currentRole === 'customer') return;
    const target = items.find((i) => i.id === itemId);
    if (!target) return;

    const actorLabel = currentRole === 'owner' ? 'Owner' : 'Staf Gudang';
    const updated = { ...target, status: newStatus, lastUpdatedBy: actorLabel };
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

  const handleStockChange = (itemId, delta) => {
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

  const handleUpdateItemField = (itemId, field, value) => {
    if (currentRole === 'customer') return;
    // Hanya Owner yang boleh mengubah harga sewa
    if (field === 'pricePerDay' && currentRole !== 'owner' && currentRole !== 'superadmin') {
      triggerToast('Hanya Owner yang memiliki izin mengubah harga sewa.');
      return;
    }
    const target = items.find((i) => i.id === itemId);
    if (!target) return;
    saveItemToCloud({ ...target, [field]: value });
  };

  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (currentRole !== 'owner' && currentRole !== 'superadmin') {
      triggerToast('Akses Ditolak: Hanya Owner yang dapat menambah unit baru.');
      return;
    }
    if (!newItemForm.name || !newItemForm.pricePerDay) return;

    const iconMap = {
      Camping: 'tent',
      'Alat Teknik/Proyek': 'hammer',
      'Kamera & Audio': 'camera'
    };

    const bgMap = {
      Camping: 'from-emerald-600 to-teal-800',
      'Alat Teknik/Proyek': 'from-amber-600 to-orange-800',
      'Kamera & Audio': 'from-indigo-600 to-purple-800'
    };

    const autoSku =
      newItemForm.sku ||
      `${shop.slug.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newItem = {
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

  // Pendaftaran Mitra Toko Baru (SaaS Onboarding)
  const handleCreateNewShop = async (e) => {
    e.preventDefault();
    if (!newShopForm.name || !newShopForm.whatsapp) return;

    const cleanSlug =
      (newShopForm.slug || newShopForm.name)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `rental-${Math.floor(Math.random() * 999)}`;

    const createdShop = {
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
      ownerId: user?.uid || 'anon',
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

    const starterItem = {
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
      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl border border-emerald-500/40 flex items-center gap-2 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* =========================================================
          ROLE BAR (HANYA MUNCUL JIKA LOGIN SEBAGAI STAFF / OWNER / SUPERADMIN)
          Pengunjung biasa (Customer) TIDAK melihat bar ini sehingga tampilan 100% bersih profesional.
         ========================================================= */}
      {currentRole !== 'customer' && (
        <div className="sticky top-0 z-40 bg-slate-950 text-white border-b border-slate-800 px-3 py-2 shadow-md">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                  currentRole === 'owner'
                    ? 'bg-emerald-500 text-slate-950'
                    : currentRole === 'staff'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-indigo-500 text-white'
                }`}
              >
                {currentRole === 'owner' && <ShieldCheck className="w-3 h-3" />}
                {currentRole === 'staff' && <UserCheck className="w-3 h-3" />}
                {currentRole === 'superadmin' && <Building2 className="w-3 h-3" />}
                {currentRole === 'owner'
                  ? 'Owner Toko'
                  : currentRole === 'staff'
                  ? 'Staf Gudang'
                  : 'Super Admin'}
              </span>
              <span className="text-xs font-bold text-slate-200 truncate">{shop.name}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() =>
                  setViewMode(viewMode === 'catalog' ? 'workspace' : 'catalog')
                }
                className="text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1 transition"
              >
                {viewMode === 'catalog' ? (
                  <>
                    <Sliders className="w-3 h-3" />
                    <span>Panel Kerja</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Lihat Katalog</span>
                  </>
                )}
              </button>

              <button
                onClick={handleLogoutRole}
                className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition"
                title="Keluar dari Mode Pengelola"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          LANDING PAGE KOMERSIAL UTAMA (SAAS HOME - RESPONSIVE DESKTOP & MOBILE)
         ========================================================= */}
      {viewMode === 'saas_home' && (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500 selection:text-slate-950">
          {/* NAVBAR LANDING PAGE */}
          <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center font-black text-base shadow-lg shadow-emerald-500/20">
                  ⚡
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-tight text-white">
                    Tebar<span className="text-emerald-400">Alat</span>
                  </span>
                  <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                    Micro-SaaS Katalog Rental
                  </span>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
                <a href="#masalah" className="hover:text-emerald-400 transition">Solusi</a>
                <a href="#fitur" className="hover:text-emerald-400 transition">Fitur & Role</a>
                <a href="#demo" className="hover:text-emerald-400 transition">Live Demo</a>
                <a href="#harga" className="hover:text-emerald-400 transition">Harga</a>
              </nav>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveShopSlug('borneo-rental');
                    setViewMode('catalog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-bold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Coba Demo Toko</span>
                </button>
                <a
                  href="#daftar-toko"
                  className="hidden sm:inline-flex text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition"
                >
                  Buat Katalog Gratis
                </a>
              </div>
            </div>
          </header>

          {/* HERO SECTION */}
          <section className="relative overflow-hidden pt-10 pb-16 sm:py-20 border-b border-slate-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Platform Katalog Sewa #1 untuk WhatsApp & Instagram</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15] text-white">
                  Ubah Pertanyaan{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                    &ldquo;Alat Ini Ready Kak?&rdquo;
                  </span>{' '}
                  Jadi Booking Otomatis di WhatsApp.
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  Berhenti mengirim PDF berat atau membalas chat satu per satu. Buat tautan katalog rental resmi lengkap dengan indikator status{' '}
                  <strong className="text-emerald-400">🟢 Ready</strong>,{' '}
                  <strong className="text-rose-400">🔴 Disewa</strong>, kalkulator durasi otomatis, dan sistem PIN khusus untuk staf gudang Anda.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#daftar-toko"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition"
                  >
                    <span>Buat Katalog Rental Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => {
                      setActiveShopSlug('borneo-rental');
                      setViewMode('catalog');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold text-xs sm:text-sm px-5 py-3.5 rounded-2xl flex items-center gap-2 transition"
                  >
                    <Store className="w-4 h-4 text-emerald-400" />
                    <span>Lihat Contoh Katalog Live</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 max-w-lg">
                  <div>
                    <p className="text-lg sm:text-2xl font-black text-white">30 Detik</p>
                    <p className="text-[11px] text-slate-400">Setup Toko Baru</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-black text-emerald-400">3 Role</p>
                    <p className="text-[11px] text-slate-400">Pelanggan, Staf & Owner</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-black text-white">100% WA</p>
                    <p className="text-[11px] text-slate-400">Checkout Tanpa Komisi</p>
                  </div>
                </div>
              </div>

              {/* PREVIEW MOCKUP INTERAKTIF DI KANAN HERO */}
              <div className="lg:col-span-5">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[11px] font-mono text-slate-400 ml-2">
                        tebaralat.id/borneo-rental
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                      Live Preview
                    </span>
                  </div>

                  {/* Mockup Card Item */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-emerald-400 uppercase">
                          🟢 TERSEDIA HARI INI (4 UNIT)
                        </span>
                        <h3 className="text-sm font-bold text-white mt-0.5">
                          Tenda Eiger Kapasitas 4-5 Orang
                        </h3>
                        <p className="text-xs text-slate-400">Rp55.000 / hari • Double Layer</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                        <Tent className="w-6 h-6 text-emerald-400" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900 rounded-xl p-2.5 border border-slate-800">
                      <div>
                        <span className="text-[10px] font-extrabold text-rose-400 uppercase">
                          🔴 SEDANG DISEWA
                        </span>
                        <h4 className="text-xs font-bold text-slate-200">
                          Genset Silent Inverter 2200W
                        </h4>
                        <p className="text-[11px] text-rose-300">
                          ⏰ Ready kembali: Minggu, 14:00 WITA
                        </p>
                      </div>
                      <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                    </div>

                    <button
                      onClick={() => {
                        setActiveShopSlug('borneo-rental');
                        setViewMode('catalog');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <span>Klik untuk Uji Katalog Interaktif</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* BAGIAN PERBANDINGAN CARA LAMA VS TEBARALAT */}
          <section id="masalah" className="py-16 bg-slate-900/60 border-b border-slate-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Mengapa Pengusaha Rental Beralih?
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Tinggalkan Cara Manual yang Membuat Admin Kewalahan
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-950 border border-rose-500/25 rounded-3xl p-6 space-y-4">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full">
                    <XCircle className="w-4 h-4" />
                    <span>Cara Lama (Manual via Chat & PDF)</span>
                  </div>
                  <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <span className="text-rose-400 font-bold">✕</span>
                      <span>Pelanggan terus bertanya &ldquo;Barang X ready gak kak?&rdquo; di jam sibuk.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-rose-400 font-bold">✕</span>
                      <span>Kirim brosur PDF/Gambar ukuran besar yang malas dibuka pelanggan.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-rose-400 font-bold">✕</span>
                      <span>Staf gudang salah info stok karena catatan di grup WA tertumpuk.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-rose-400 font-bold">✕</span>
                      <span>Rawan salah hitung diskon sewa 3 hari atau mingguan.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-6 space-y-4 shadow-lg shadow-emerald-500/5">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cara Baru dengan TebarAlat</span>
                  </div>
                  <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Pelanggan langsung tahu unit mana yang Ready & kapan unit yang disewa kembali.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Staf gudang cukup tekan 1 tombol di HP saat barang keluar/masuk.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Kalkulator sewa otomatis menghitung total harga & mengirim rincian rapi ke WA.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Tersedia cetak stiker QR fisik untuk ditempel di bodi alat sebagai promosi gratis.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* FITUR PEMISAHAN 3 ROLE PROFESIONAL */}
          <section id="fitur" className="py-16 border-b border-slate-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Arsitektur Kelas Bisnis
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Satu Aplikasi, 3 Hak Akses Berbeda (RBAC)
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Aman didelegasikan ke karyawan atau penjaga toko tanpa takut harga atau inventaris Anda terhapus.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    1. Role Pelanggan (Publik)
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    Katalog Bersih Tanpa Login
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pelanggan membuka link di bio IG atau grup WA, melihat stok real-time, memilih durasi sewa, dan langsung mengirim pesanan ke WhatsApp admin.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                    2. Role Staf Gudang (PIN Khusus)
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    Remote Kontrol Stok Keluar/Masuk
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Staf hanya bisa menekan tombol Ready/Disewa/Servis dan mencatat nama peminjam. Tidak bisa menghapus unit, menambah barang, atau mengubah nomor WA toko.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                    3. Role Owner (Full Akses)
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    Kendali Penuh & Audit Log
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Owner dapat menambah/menghapus unit, mengatur tarif sewa, mencetak label QR per unit, serta memantau riwayat perubahan status yang dilakukan staf gudang.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* PAKET HARGA (PRICING) */}
          <section id="harga" className="py-16 bg-slate-900/50 border-b border-slate-900">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  Investasi Super Ringan
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Harga Seharga Segelas Es Kopi per Bulan
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Mulai gratis selamanya, upgrade ke PRO kapan saja saat bisnis rental Anda berkembang.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Paket Starter Gratis */}
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold uppercase text-slate-400">Starter</span>
                      <h3 className="text-2xl font-black text-white mt-1">Rp 0</h3>
                      <p className="text-xs text-slate-400">Gratis selamanya untuk usaha rental rintisan</p>
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Maksimal 8 unit alat di katalog</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Indikator Status 🟢 Ready / 🔴 Disewa Real-Time</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Kalkulator Durasi & Checkout langsung ke WhatsApp</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href="#daftar-toko"
                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-center text-xs font-extrabold transition"
                  >
                    Mulai Gratis Sekarang
                  </a>
                </div>

                {/* Paket PRO */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-emerald-500/10">
                  <span className="absolute -top-3 right-6 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                    Paling Laris
                  </span>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold uppercase text-emerald-400">Bisnis PRO</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <h3 className="text-2xl sm:text-3xl font-black text-white">Rp 19.000</h3>
                        <span className="text-xs text-slate-400">/ bulan</span>
                      </div>
                      <p className="text-xs text-emerald-300/90">Atau hemat Rp 149.000 / tahun</p>
                    </div>
                    <ul className="space-y-2.5 text-xs text-slate-200">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>Unlimited</strong> unit alat & kategori sewa</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>Akses Multi-Role:</strong> PIN Staf Gudang & PIN Owner terpisah</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>Generator Label QR Fisik</strong> siap cetak untuk bodi unit</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>Audit Trail Log:</strong> Pantau jam berapa staf mengubah stok</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Lencana <strong>Official Partner</strong> & Bebas Watermark</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href="#daftar-toko"
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-center text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition"
                  >
                    Buka Toko PRO (Uji Coba Gratis)
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION REGISTRASI TOKO BARU & DEMO MITRA LIVE */}
          <section id="daftar-toko" className="py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-10 items-start">
              {/* Form Buat Katalog */}
              <div className="lg:col-span-7 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
                    Onboarding 30 Detik
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                    Buka Katalog Usaha Rental Anda Sekarang
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Langsung aktif dan siap ditempel ke bio Instagram atau dibagikan ke WhatsApp.
                  </p>
                </div>

                <form onSubmit={handleCreateNewShop} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Usaha Rental *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Samarinda Kamera & Multimedia"
                      value={newShopForm.name}
                      onChange={(e) => {
                        const nameVal = e.target.value;
                        const autoSlug = nameVal
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '-')
                          .replace(/-+/g, '-')
                          .replace(/^-|-$/g, '');
                        setNewShopForm({ ...newShopForm, name: nameVal, slug: autoSlug });
                      }}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tautan Katalog Resmi (Slug URL)
                    </label>
                    <div className="flex items-center bg-slate-100 border border-slate-300 rounded-xl overflow-hidden px-3.5 py-2.5">
                      <span className="text-xs text-slate-400 font-mono">tebaralat.id/</span>
                      <input
                        type="text"
                        required
                        placeholder="samarinda-kamera"
                        value={newShopForm.slug}
                        onChange={(e) => setNewShopForm({ ...newShopForm, slug: e.target.value })}
                        className="w-full text-xs font-bold font-mono bg-transparent text-emerald-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor WhatsApp Admin *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="628123456789"
                        value={newShopForm.whatsapp}
                        onChange={(e) =>
                          setNewShopForm({ ...newShopForm, whatsapp: e.target.value })
                        }
                        className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Kota / Alamat Singkat
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Balikpapan"
                        value={newShopForm.location}
                        onChange={(e) =>
                          setNewShopForm({ ...newShopForm, location: e.target.value })
                        }
                        className="w-full text-xs border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Buat PIN Owner (Full Akses)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={newShopForm.ownerPin}
                        onChange={(e) =>
                          setNewShopForm({ ...newShopForm, ownerPin: e.target.value })
                        }
                        className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Buat PIN Staf Gudang
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={newShopForm.staffPin}
                        onChange={(e) =>
                          setNewShopForm({ ...newShopForm, staffPin: e.target.value })
                        }
                        className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl px-3.5 py-2 text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Luncurkan Katalog & Masuk sebagai Owner</span>
                  </button>
                </form>
              </div>

              {/* Direktori Demo Mitra Terdaftar & FAQ */}
              <div id="demo" className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                        Live Showcase
                      </span>
                      <h3 className="text-base font-extrabold text-white">
                        Klik untuk Mencoba Katalog Mitra ({shops.length})
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {shops.map((s) => (
                      <div
                        key={s.slug}
                        onClick={() => {
                          setActiveShopSlug(s.slug);
                          setViewMode('catalog');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-emerald-500 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                              {s.name}
                            </p>
                            <BadgeCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            <span>{s.location}</span>
                            <span>•</span>
                            <span className="font-mono text-emerald-400">/{s.slug}</span>
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                          Buka →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mini FAQ */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
                  <h3 className="text-sm font-extrabold text-white">Pertanyaan Umum (FAQ)</h3>
                  {[
                    {
                      q: 'Apakah penyewa perlu download aplikasi atau login?',
                      a: 'Tidak sama sekali. Penyewa cukup klik link katalog di WhatsApp atau bio Instagram, pilih unit, dan langsung terhubung ke chat WhatsApp admin.'
                    },
                    {
                      q: 'Bagaimana cara membedakan akses Owner dan Staf Gudang?',
                      a: 'Di bagian bawah katalog terdapat menu Login Internal. Staf masuk dengan PIN Staf (hanya bisa ubah status Ready/Disewa), sedangkan Owner masuk dengan PIN Owner (bisa ubah harga, tambah unit, dan lihat log).'
                    },
                    {
                      q: 'Apakah ada potongan komisi dari transaksi sewa?',
                      a: 'Rp 0 (Bebas komisi). Seluruh pembayaran sewa dilakukan langsung antara penyewa dan rekening/QRIS toko Anda.'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="border-b border-slate-800 last:border-none pb-2.5">
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                        className="w-full text-left text-xs font-bold text-slate-200 flex items-center justify-between py-1"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition ${
                            openFaq === idx ? 'rotate-180 text-emerald-400' : ''
                          }`}
                        />
                      </button>
                      {openFaq === idx && (
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                          {item.a}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER LANDING PAGE */}
          <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">
                  ⚡
                </span>
                <span className="font-bold text-slate-300">TebarAlat Indonesia</span>
              </div>
              <p>© 2026 TebarAlat SaaS. Solusi Katalog Instan UMKM & B2B Rental.</p>
            </div>
          </footer>
        </div>
      )}

      {/* CONTAINER MOBILE-FIRST UNTUK KATALOG PUBLIK & WORKSPACE TOKO */}
      {viewMode !== 'saas_home' && (
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative overflow-hidden sm:border-x border-slate-200">
        {/* =========================================================
            MODE 1: KATALOG PUBLIK (TAMPILAN MURNI UNTUK PELANGGAN)
           ========================================================= */}
        {viewMode === 'catalog' && (
          <div className="pb-28 bg-slate-50 min-h-screen">
            {/* HEADER RESMI TOKO RENTAL */}
            <div className="bg-slate-900 text-white p-5 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shrink-0 shadow-lg border border-white/15">
                    <Tent className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <BadgeCheck className="w-3 h-3 text-emerald-400" />
                        Official Partner
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Live Stok
                      </span>
                    </div>
                    <h1 className="text-lg font-extrabold leading-snug mt-1 text-white">
                      {shop.name}
                    </h1>
                    <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                      {shop.tagline || 'Katalog Resmi Penyewaan Alat & Unit Operasional'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 transition shrink-0"
                  title="Bagikan Katalog"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Bar Lokasi & Jam Operasional */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{shop.location}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{shop.hours}</span>
                </span>
              </div>

              {/* Syarat & Ketentuan Sewa */}
              <div className="mt-3 bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowTerms(!showTerms)}
                  className="w-full px-3.5 py-2 flex items-center justify-between text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    Ketentuan & Jaminan Sewa
                  </span>
                  {showTerms ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {showTerms && (
                  <ul className="px-4 pb-3 pt-1.5 text-[11px] text-slate-300 space-y-1.5 border-t border-slate-700/80 list-disc list-inside">
                    {(shop.terms || []).map((term, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {term}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* BAR KALKULATOR TANGGAL & DURASI SEWA */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 shadow-sm sticky top-0 z-30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Pilih Jadwal & Durasi Sewa
                </span>
                {currentDurationObj.discountTag && (
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Promo {currentDurationObj.discountTag}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                    Tanggal Ambil
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                    Durasi Paket
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full text-xs font-bold bg-emerald-50/70 border border-emerald-300 rounded-xl px-3 py-2 text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt.days} value={opt.days}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SEARCH & FILTER KATEGORI */}
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari unit atau spesifikasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* DAFTAR ITEM KATALOG */}
            <div className="px-4 space-y-3">
              {filteredCatalogItems.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                  <p className="text-sm font-bold text-slate-700">Unit tidak ditemukan</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan gunakan kata kunci lain atau ubah filter kategori.
                  </p>
                </div>
              ) : (
                filteredCatalogItems.map((item) => {
                  const isAvailable = item.status === 'available' && item.stock > 0;
                  const isRented =
                    item.status === 'rented' || (item.status === 'available' && item.stock === 0);
                  const calculatedPrice = item.pricePerDay * currentDurationObj.multiplier;
                  const inCartQty = cart[item.id] || 0;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-sm ${
                        inCartQty > 0
                          ? 'border-emerald-500 ring-1 ring-emerald-500'
                          : 'border-slate-200/90'
                      }`}
                    >
                      <div className="p-3.5 flex gap-3.5">
                        <div
                          className={`w-20 h-24 rounded-xl bg-gradient-to-br ${item.imageBg} flex flex-col items-center justify-center shrink-0 relative shadow-inner`}
                        >
                          {renderItemIcon(item.iconType, 'w-8 h-8 text-white/95')}
                          <span className="text-[9px] text-white/90 font-bold mt-1.5 px-1.5 py-0.5 bg-black/25 rounded">
                            {item.sku || item.category.split('/')[0]}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            {isAvailable && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                TERSEDIA ({item.stock} unit)
                              </span>
                            )}
                            {isRented && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                SEDANG DISEWA
                              </span>
                            )}
                            {item.status === 'maintenance' && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                                <Wrench className="w-2.5 h-2.5" />
                                DALAM PERAWATAN
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-sm text-slate-900 leading-snug">
                            {item.name}
                          </h3>

                          <ul className="mt-1.5 space-y-0.5">
                            {(item.specs || []).map((spec, idx) => (
                              <li
                                key={idx}
                                className="text-[11px] text-slate-500 flex items-start gap-1.5"
                              >
                                <span className="text-emerald-500 font-bold">•</span>
                                <span className="truncate">{spec}</span>
                              </li>
                            ))}
                          </ul>

                          {isRented && item.availableAt && (
                            <div className="mt-2 bg-rose-50/80 border border-rose-200 rounded-lg px-2.5 py-1 text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                              <span>
                                Tersedia kembali: <strong>{item.availableAt}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-50/80 px-3.5 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-extrabold text-slate-900">
                              {formatRp(calculatedPrice)}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              / {durationDays} Hari
                            </span>
                          </div>
                          {durationDays > 1 && (
                            <p className="text-[10px] text-slate-400">
                              Tarif harian: {formatRp(item.pricePerDay)}/hari
                            </p>
                          )}
                        </div>

                        {isAvailable ? (
                          inCartQty === 0 ? (
                            <button
                              onClick={() => updateCartQty(item.id, 1, item.stock)}
                              className="bg-slate-900 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Pilih Unit</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 rounded-xl p-1">
                              <button
                                onClick={() => updateCartQty(item.id, -1, item.stock)}
                                className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-sm"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-extrabold text-emerald-900 px-1.5">
                                {inCartQty}
                              </span>
                              <button
                                onClick={() => updateCartQty(item.id, 1, item.stock)}
                                className="w-7 h-7 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )
                        ) : (
                          <button
                            onClick={() =>
                              handleOpenWhatsApp(
                                `Halo Admin ${shop.name}, saya ingin menanyakan jadwal ketersediaan unit *${item.name}* untuk tanggal lain.`
                              )
                            }
                            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Booking Jadwal Lain</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* REKANAN RENTAL TERPERCAYA (OPSIONAL ANTAR MITRA) */}
            {shop.partnerShop && (
              <div className="mx-4 mt-5 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Mitra Rekanan Resmi
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    Cari perlengkapan kategori lain?
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Lihat katalog <strong>{shop.partnerShop.name}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    const targetPartner = shops.find((s) => s.slug === shop.partnerShop.slug);
                    if (targetPartner) {
                      setActiveShopSlug(targetPartner.slug);
                      setCart({});
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      triggerToast(`Membuka katalog ${targetPartner.name}`);
                    }
                  }}
                  className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition"
                >
                  <span>Buka Katalog</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* FOOTER PROFESIONAL + AKSES PORTAL PENGELOLA (TERSEMBUNYI RAPI) */}
            <div className="mt-10 mb-6 px-4 text-center space-y-3">
              <div className="border-t border-slate-200 pt-5 flex flex-col items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span className="w-5 h-5 rounded-md bg-slate-900 text-emerald-400 flex items-center justify-center text-[10px]">
                    ⚡
                  </span>
                  <span>Powered by TebarAlat</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sistem Katalog & Manajemen Status Inventaris Real-Time
                </p>

                <div className="flex items-center justify-center gap-3 mt-2">
                  {currentRole === 'customer' ? (
                    <button
                      onClick={() => {
                        setLoginTargetRole('staff');
                        setAuthError('');
                        setShowAuthModal(true);
                      }}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Login Staf / Owner</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setViewMode('workspace')}
                      className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200"
                    >
                      Buka Panel Kerja ({currentRole.toUpperCase()}) →
                    </button>
                  )}

                  <span className="text-slate-300">•</span>

                  <button
                    onClick={() => setViewMode('saas_home')}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition"
                  >
                    Daftarkan Usaha Rental Anda
                  </button>
                </div>
              </div>
            </div>

            {/* STICKY BOTTOM CHECKOUT BAR */}
            {cartSummary.totalUnits > 0 && (
              <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3.5 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <div>
                    <span className="text-xs font-extrabold text-slate-900">
                      {cartSummary.totalUnits} Unit Dipilih ({durationDays} Hari)
                    </span>
                    <button
                      onClick={() => setShowWaPreviewModal(true)}
                      className="block text-[11px] text-emerald-600 font-semibold hover:underline"
                    >
                      Lihat rincian pesanan
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      Total Estimasi
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      {formatRp(cartSummary.totalCost)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowWaPreviewModal(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>AJUKAN SEWA VIA WHATSAPP</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            MODE 2: WORKSPACE INTERNAL (ROLE: STAF GUDANG & OWNER TOKO)
           ========================================================= */}
        {viewMode === 'workspace' && (
          <div className="p-4 space-y-4 pb-16 bg-slate-50 min-h-screen">
            {/* Banner Header Workspace Sesuai Role */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                        currentRole === 'owner'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {currentRole === 'owner'
                        ? '👑 Akses Penuh Owner'
                        : '👷 Mode Operasional Staf Gudang'}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold truncate mt-1.5">{shop.name}</h2>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    /{shop.slug} • {cloudSynced ? 'Cloud Tersinkronisasi' : 'Penyimpanan Aktif'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedQrItem(null);
                    setShowQrModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR Toko</span>
                </button>
              </div>

              {/* Ringkasan Status Inventaris Real-Time */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-center">
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl py-2">
                  <span className="text-lg font-extrabold text-emerald-400">{stats.ready}</span>
                  <span className="block text-[10px] text-slate-300 font-medium">🟢 Ready</span>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl py-2">
                  <span className="text-lg font-extrabold text-rose-400">{stats.rented}</span>
                  <span className="block text-[10px] text-slate-300 font-medium">🔴 Disewa</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl py-2">
                  <span className="text-lg font-extrabold text-amber-400">{stats.maintenance}</span>
                  <span className="block text-[10px] text-slate-300 font-medium">🟡 Servis</span>
                </div>
              </div>

              {/* Sub-Navigasi Internal Berdasarkan Hak Akses Role */}
              <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl mt-3.5">
                <button
                  onClick={() => setWorkspaceTab('inventory')}
                  className={`py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                    workspaceTab === 'inventory'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3 h-3" />
                  <span>Stok & Status</span>
                </button>

                <button
                  onClick={() => setWorkspaceTab('logs')}
                  className={`py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                    workspaceTab === 'logs'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <History className="w-3 h-3" />
                  <span>Log ({shopLogs.length})</span>
                </button>

                <button
                  onClick={() => {
                    if (currentRole !== 'owner' && currentRole !== 'superadmin') {
                      triggerToast('Terbatas: Pengaturan Toko hanya untuk Owner.');
                      return;
                    }
                    setWorkspaceTab('settings');
                  }}
                  className={`py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                    workspaceTab === 'settings'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : currentRole !== 'owner'
                      ? 'text-slate-500 cursor-not-allowed'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Settings className="w-3 h-3" />
                  <span>Pengaturan</span>
                </button>
              </div>
            </div>

            {/* SUB-TAB 1: KONTROL INVENTARIS & STATUS 1-TAP */}
            {workspaceTab === 'inventory' && (
              <div className="space-y-3">
                {/* Info Hak Akses untuk Staf Gudang */}
                {currentRole === 'staff' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Anda login sebagai <strong>Staf Gudang</strong>. Anda dapat memperbarui status unit & stok keluar/masuk.
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setLoginTargetRole('owner');
                        setAuthError('');
                        setShowAuthModal(true);
                      }}
                      className="shrink-0 text-[11px] font-bold text-amber-900 underline"
                    >
                      Buka Mode Owner
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Tombol Tambah Alat Hanya Muncul untuk Owner */}
                  {(currentRole === 'owner' || currentRole === 'superadmin') && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 shrink-0"
                    >
                      <PackagePlus className="w-4 h-4" />
                      <span>+ Tambah Unit</span>
                    </button>
                  )}

                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama unit atau kode SKU..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Daftar Kartu Kontrol Unit */}
                {filteredAdminItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {item.sku || 'UNIT'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {item.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{item.name}</h4>
                        <p className="text-xs font-semibold text-emerald-700">
                          {formatRp(item.pricePerDay)} / hari
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedQrItem(item);
                            setShowQrModal(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
                          title="Label QR Fisik Unit"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* Hanya Owner yang bisa menghapus unit */}
                        {(currentRole === 'owner' || currentRole === 'superadmin') && (
                          <button
                            onClick={() => deleteItemFromCloud(item.id, item.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition"
                            title="Hapus Unit (Khusus Owner)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 1-TAP STATUS SWITCH */}
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => handleStatusChange(item.id, 'available')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                          item.status === 'available'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-white/60'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(item.id, 'rented')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                          item.status === 'rented'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-white/60'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Disewa</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(item.id, 'maintenance')}
                        className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${
                          item.status === 'maintenance'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-600 hover:bg-white/60'
                        }`}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Servis</span>
                      </button>
                    </div>

                    {item.status === 'available' && (
                      <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3 py-2">
                        <span className="text-xs font-semibold text-emerald-950">
                          Stok Fisik Tersedia:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStockChange(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white border border-emerald-300 flex items-center justify-center text-slate-700 font-bold shadow-sm"
                          >
                            -
                          </button>
                          <span className="text-sm font-extrabold text-emerald-900 w-5 text-center">
                            {item.stock}
                          </span>
                          <button
                            onClick={() => handleStockChange(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    {(item.status === 'rented' || item.status === 'maintenance') && (
                      <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-2.5 space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold text-rose-800 uppercase mb-0.5">
                            ⏰ Estimasi Kembali (Tampil ke Pelanggan)
                          </label>
                          <input
                            type="text"
                            value={item.availableAt}
                            onChange={(e) =>
                              handleUpdateItemField(item.id, 'availableAt', e.target.value)
                            }
                            placeholder="Contoh: Minggu, 1 Nov (14:00)"
                            className="w-full text-xs bg-white border border-rose-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            🔒 Catatan Peminjam (Internal Gudang & Owner)
                          </label>
                          <input
                            type="text"
                            value={item.renterNote}
                            onChange={(e) =>
                              handleUpdateItemField(item.id, 'renterNote', e.target.value)
                            }
                            placeholder="Contoh: Disewa Pak Budi - KTP ditahan"
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Diperbarui oleh: {item.lastUpdatedBy || 'Owner'}</span>
                      {currentRole === 'owner' && (
                        <span>Tarif: {formatRp(item.pricePerDay)}/hr</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUB-TAB 2: LOG RIWAYAT AKTIVITAS (AUDIT TRAIL) */}
            {workspaceTab === 'logs' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Riwayat Perubahan Status & Stok
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Memantau aktivitas Staf Gudang & Owner secara transparan
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {shopLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <span
                          className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            log.actorRole.includes('Owner')
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.actorRole}
                        </span>
                        <p className="text-xs font-semibold text-slate-800">{log.action}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {log.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB 3: PENGATURAN TOKO & PIN KEAMANAN ROLE (KHUSUS OWNER) */}
            {workspaceTab === 'settings' &&
              (currentRole === 'owner' || currentRole === 'superadmin') && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-sm">
                  <div className="border-b border-slate-100 pb-2.5">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Pengaturan Profil & Keamanan Role
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Hanya Owner yang dapat mengubah informasi bisnis dan PIN staf.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Resmi Usaha Rental
                      </label>
                      <input
                        type="text"
                        value={shop.name}
                        onChange={(e) => saveShopToCloud({ ...shop, name: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tagline / Deskripsi Singkat Header
                      </label>
                      <input
                        type="text"
                        value={shop.tagline || ''}
                        onChange={(e) => saveShopToCloud({ ...shop, tagline: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nomor WhatsApp Admin
                        </label>
                        <input
                          type="text"
                          value={shop.whatsapp}
                          onChange={(e) => saveShopToCloud({ ...shop, whatsapp: e.target.value })}
                          className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Jam Operasional
                        </label>
                        <input
                          type="text"
                          value={shop.hours}
                          onChange={(e) => saveShopToCloud({ ...shop, hours: e.target.value })}
                          className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Alamat Lengkap Toko / Gudang
                      </label>
                      <input
                        type="text"
                        value={shop.location}
                        onChange={(e) => saveShopToCloud({ ...shop, location: e.target.value })}
                        className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                      />
                    </div>

                    {/* Pengaturan PIN Akses Role */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                        Manajemen PIN Akses Role
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            PIN Owner (Full Akses)
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={shop.ownerPin || '1234'}
                            onChange={(e) => saveShopToCloud({ ...shop, ownerPin: e.target.value })}
                            className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            PIN Staf Gudang (Terbatas)
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            value={shop.staffPin || '0000'}
                            onChange={(e) => saveShopToCloud({ ...shop, staffPin: e.target.value })}
                            className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        recordAuditLog('Memperbarui pengaturan profil & keamanan toko');
                        triggerToast('Pengaturan toko berhasil disimpan!');
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
      )}

      {/* =========================================================
          MODAL AUTENTIKASI ROLE (PIN STAF GUDANG / OWNER TOKO)
         ========================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Portal Internal Toko</h3>
                  <p className="text-[11px] text-slate-500">{shop.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Pilihan Role Login */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setLoginTargetRole('staff');
                  setAuthError('');
                }}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  loginTargetRole === 'staff'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Staf Gudang</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginTargetRole('owner');
                  setAuthError('');
                }}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  loginTargetRole === 'owner'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Owner Toko</span>
              </button>
            </div>

            <form onSubmit={handleRoleLogin} className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                {loginTargetRole === 'staff' ? (
                  <>
                    <strong>Hak Akses Staf Gudang:</strong> Hanya dapat mengubah indikator status (Ready/Disewa/Servis) dan stok fisik. Tidak dapat menghapus unit atau mengubah harga.
                  </>
                ) : (
                  <>
                    <strong>Hak Akses Owner:</strong> Akses penuh manajemen unit baru, perubahan harga sewa, cetak QR, audit log, dan pengaturan nomor WhatsApp toko.
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Masukkan Kode PIN {loginTargetRole === 'owner' ? 'Owner' : 'Staf Gudang'}
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full text-center text-lg tracking-[0.5em] font-mono font-extrabold border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1 text-center">
                  PIN Demo {loginTargetRole === 'owner' ? 'Owner: 1234' : 'Staf Gudang: 0000'}
                </p>
              </div>

              {authError && (
                <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-center">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow-md transition"
              >
                Masuk ke Workspace
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL PREVIEW RINCIAN & CHAT WHATSAPP (PENYEWA)
         ========================================================= */}
      {showWaPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Konfirmasi Pengajuan Sewa</h3>
                <p className="text-xs text-slate-500">Pesan terformat otomatis ke Admin {shop.name}</p>
              </div>
              <button
                onClick={() => setShowWaPreviewModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1"
              >
                Tutup ✕
              </button>
            </div>

            <div className="bg-[#DCF8C6]/60 border border-emerald-200 rounded-2xl p-3.5 text-xs text-slate-800 font-mono whitespace-pre-line max-h-60 overflow-y-auto shadow-inner">
              {whatsappMessageText}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(whatsappMessageText, 'Format pesan disalin!')}
                className="px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>Salin</span>
              </button>

              <button
                onClick={() => {
                  handleOpenWhatsApp();
                  setShowWaPreviewModal(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Kirim ke WhatsApp Resmi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL TAMBAH ALAT BARU (KHUSUS OWNER)
         ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleAddNewItem}
            className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-base font-extrabold text-slate-900">+ Tambah Unit Inventaris</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Batal ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Unit *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Proyektor Epson EB-X500"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode SKU</label>
                <input
                  type="text"
                  placeholder="PRJ-01"
                  value={newItemForm.sku}
                  onChange={(e) => setNewItemForm({ ...newItemForm, sku: e.target.value })}
                  className="w-full text-xs font-mono border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={newItemForm.category}
                  onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 bg-white"
                >
                  <option value="Camping">Camping</option>
                  <option value="Alat Teknik/Proyek">Alat Teknik/Proyek</option>
                  <option value="Kamera & Audio">Kamera & Audio</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tarif Sewa / Hari (Rp) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="100000"
                  value={newItemForm.pricePerDay}
                  onChange={(e) => setNewItemForm({ ...newItemForm, pricePerDay: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Spesifikasi Utama
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 3600 ANSI Lumens + HDMI"
                  value={newItemForm.spec1}
                  onChange={(e) => setNewItemForm({ ...newItemForm, spec1: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Stok</label>
                <input
                  type="number"
                  min="1"
                  value={newItemForm.stock}
                  onChange={(e) => setNewItemForm({ ...newItemForm, stock: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition"
            >
              Simpan ke Katalog
            </button>
          </form>
        </div>
      )}

      {/* =========================================================
          MODAL GENERATOR STIKER QR FISIK
         ========================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl text-center">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                🏷️ Label QR Inventaris
              </span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Tutup ✕
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-800 rounded-2xl p-4 bg-slate-50 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                {selectedQrItem ? `ASSET TAG • ${selectedQrItem.sku || 'UNIT'}` : 'OFFICIAL RENTAL CATALOG'}
              </p>
              <h4 className="text-sm font-black text-slate-900">
                {selectedQrItem ? selectedQrItem.name : shop.name}
              </h4>

              <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl border border-slate-300 shadow-inner flex flex-col items-center justify-center">
                <QrCode className="w-28 h-28 text-slate-900 stroke-[1.5]" />
              </div>

              <p className="text-xs font-bold text-emerald-700">
                Scan untuk Cek Ketersediaan & Booking WA
              </p>
              <p className="text-[10px] font-mono text-slate-500">tebaralat.id/{shop.slug}</p>
            </div>

            <button
              onClick={() => {
                window.print?.();
                triggerToast('Membuka dialog cetak stiker QR...');
                setShowQrModal(false);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Label QR</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}