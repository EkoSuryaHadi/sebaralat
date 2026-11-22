'use client';

import React, { useState, useRef } from 'react';
import {
  QrCode,
  Sliders,
  History,
  Settings,
  AlertCircle,
  PackagePlus,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  Wrench,
  Upload,
  X,
  Link2,
  Loader2,
  Tent,
  CalendarCheck,
  UserPlus,
  Mail,
  Sparkles,
  Lock,
  Pencil,
  MessageCircle,
  Plus,
  Percent,
  MapPin,
  FileText,
  TrendingUp,
  Download,
  Printer,
  Award,
} from 'lucide-react';
import {
  Shop,
  RentalItem,
  ActivityLog,
  Role,
  WorkspaceTab,
  ItemStatus,
  Booking,
  BookingStatus,
  ShopInvite,
  ShopMember,
  DiscountTier,
} from '../types';
import { uploadShopLogo } from '@/lib/imageUtils';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  isProPlanActive,
  normalizeWhatsapp,
  STARTER_MAX_ITEMS,
  buildBookingFollowUpWaMessage,
  normalizeDiscountTiers,
  DEFAULT_DISCOUNT_TIERS,
  computeShopAnalytics,
  buildBookingsCsv,
} from '../lib/validators';

interface WorkspaceViewProps {
  shop: Shop;
  currentRole: Role;
  cloudSynced: boolean;
  stats: {
    ready: number;
    rented: number;
    maintenance: number;
  };
  workspaceTab: WorkspaceTab;
  setWorkspaceTab: (tab: WorkspaceTab) => void;
  shopLogs: ActivityLog[];
  bookings: Booking[];
  invites: ShopInvite[];
  members?: ShopMember[];
  onUpdateBookingStatus: (bookingId: string, newStatus: BookingStatus) => Promise<void>;
  onInviteMember: (email: string, role: 'owner' | 'staff') => Promise<void>;
  onRemoveMember?: (userId: string, email: string) => Promise<void>;
  onRevokeInvite?: (inviteId: string, email: string) => Promise<void>;
  adminSearch: string;
  setAdminSearch: (val: string) => void;
  filteredAdminItems: RentalItem[];
  onOpenAddModal: () => void;
  onOpenEditModal?: (item: RentalItem) => void;
  onOpenQrModal: (item: RentalItem | null) => void;
  onOpenBookingReceipt?: (booking: Booking) => void;
  onDeleteUnit: (itemId: string, itemName: string) => void;
  onStatusChange: (itemId: string, newStatus: ItemStatus) => void;
  onStockChange: (itemId: string, delta: number) => void;
  onUpdateItemField: (itemId: string, field: keyof RentalItem, value: RentalItem[keyof RentalItem]) => void;
  onSaveShopSettings: (updatedShop: Shop) => void;
  onRecordAuditLog: (actionDesc: string) => void;
  triggerToast: (msg: string) => void;
  onSwitchToOwnerLogin: () => void;
  formatRp: (num: number) => string;
  allItemsCount?: number;
  onOpenUpgradeModal?: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  shop,
  currentRole,
  cloudSynced,
  stats,
  workspaceTab,
  setWorkspaceTab,
  shopLogs,
  bookings,
  invites,
  members = [],
  onUpdateBookingStatus,
  onInviteMember,
  onRemoveMember,
  onRevokeInvite,
  adminSearch,
  setAdminSearch,
  filteredAdminItems,
  onOpenAddModal,
  onOpenEditModal,
  onOpenQrModal,
  onOpenBookingReceipt,
  onDeleteUnit,
  onStatusChange,
  onStockChange,
  onUpdateItemField,
  onSaveShopSettings,
  onRecordAuditLog,
  triggerToast,
  onSwitchToOwnerLogin,
  formatRp,
  allItemsCount = 0,
  onOpenUpgradeModal,
}) => {
  const isPro = isProPlanActive(shop) || Boolean(shop.isVerified);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'staff' | 'owner'>('staff');
  const [isInviting, setIsInviting] = useState(false);
  const [newTierDays, setNewTierDays] = useState('3');
  const [newTierPercent, setNewTierPercent] = useState('10');
  const [newTermInput, setNewTermInput] = useState('');
  const [analyticsPeriodDays, setAnalyticsPeriodDays] = useState<number | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const analyticsSummary = computeShopAnalytics(bookings, analyticsPeriodDays);

  const handleDownloadCsv = () => {
    const csvContent = buildBookingsCsv(bookings);
    if (typeof window === 'undefined') return;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-booking-${shop.slug}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('Laporan CSV berhasil diunduh!');
  };

  // P1-1: Draft lokal untuk pengaturan profil toko (di-key berdasarkan slug) agar tidak menembakkan query DB di setiap ketikan huruf dan bebas cascading render
  const [shopEditsBySlug, setShopEditsBySlug] = useState<
    Record<
      string,
      Partial<{
        name: string;
        tagline: string;
        whatsapp: string;
        hours: string;
        location: string;
        mapsUrl: string;
        terms: string[];
        discountTiers: DiscountTier[];
      }>
    >
  >({});

  const currentShopEdit = shopEditsBySlug[shop.slug] || {};
  const shopDraft = {
    name: currentShopEdit.name ?? shop.name,
    tagline: currentShopEdit.tagline ?? (shop.tagline || ''),
    whatsapp: currentShopEdit.whatsapp ?? shop.whatsapp,
    hours: currentShopEdit.hours ?? shop.hours,
    location: currentShopEdit.location ?? shop.location,
    mapsUrl: currentShopEdit.mapsUrl ?? (shop.mapsUrl || ''),
    terms: currentShopEdit.terms ?? (shop.terms || []),
    discountTiers:
      currentShopEdit.discountTiers ??
      (shop.discountTiers ?? DEFAULT_DISCOUNT_TIERS),
  };

  const setShopDraft = (nextDraft: typeof shopDraft) => {
    setShopEditsBySlug((prev) => ({
      ...prev,
      [shop.slug]: nextDraft,
    }));
  };

  // P1-1: Draft lokal per item untuk availableAt & renterNote agar tidak memicu banjir UPDATE & audit log tiap ketikan huruf
  const [itemNoteDrafts, setItemNoteDrafts] = useState<
    Record<string, { availableAt?: string; renterNote?: string }>
  >({});

  const getDraftValue = (item: RentalItem, field: 'availableAt' | 'renterNote'): string => {
    const draft = itemNoteDrafts[item.id];
    if (draft && typeof draft[field] === 'string') {
      return draft[field]!;
    }
    return item[field] || '';
  };

  const setDraftValue = (itemId: string, field: 'availableAt' | 'renterNote', val: string) => {
    setItemNoteDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: val,
      },
    }));
  };

  const commitItemDraftField = (item: RentalItem, field: 'availableAt' | 'renterNote') => {
    const draft = itemNoteDrafts[item.id];
    if (!draft || typeof draft[field] !== 'string') return;
    const nextVal = draft[field]!.trim();
    if (nextVal !== (item[field] || '')) {
      onUpdateItemField(item.id, field, nextVal);
      triggerToast(
        field === 'availableAt'
          ? 'Estimasi jadwal kembali disimpan.'
          : 'Catatan peminjam disimpan.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-bg aurora pb-16">
     <div className="mx-auto max-w-5xl p-3 sm:p-4 space-y-4">
      {/* Header Workspace (Non-Sticky agar layar lega & tidak bertumpuk) */}
      <div className="bento bg-surface border-line p-3 sm:p-4 animate-rise">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-line-strong bg-surface-2 flex items-center justify-center">
              {shop.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={shop.logoUrl}
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-accent to-accent-strong flex items-center justify-center">
                  <Tent className="w-6 h-6 text-accent-fg" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`chip uppercase tracking-wider text-[10px]! font-extrabold ${
                    currentRole === 'owner'
                      ? 'bg-accent-soft! text-accent-text! border-accent/30!'
                      : 'bg-warn-soft! text-warn-text! border-warn/30!'
                  }`}
                >
                  {currentRole === 'owner'
                    ? '👑 Akses Penuh Owner'
                    : '👷 Mode Operasional Staf Gudang'}
                </span>
              </div>
              <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-fg truncate mt-1">{shop.name}</h2>
              <p className="text-[11px] text-muted font-mono truncate">
                /{shop.slug} • {cloudSynced ? 'Cloud Tersinkronisasi' : 'Penyimpanan Aktif'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <button
              onClick={() => onOpenQrModal(null)}
              className="btn-glass px-3 py-2 text-xs shrink-0"
            >
              <QrCode className="w-4 h-4 text-accent-text" />
              <span>QR Toko</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Status Inventaris Real-Time (Bento Tiles) */}
        <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-line text-center">
          <div className="bento p-2 sm:p-2.5 border-accent/30 bg-accent-soft/40">
            <span className="font-display text-lg sm:text-2xl font-extrabold text-accent-text block leading-tight">{stats.ready}</span>
            <span className="text-[10px] text-muted font-bold block">🟢 Ready</span>
          </div>
          <div className="bento p-2 sm:p-2.5 border-danger/30 bg-danger-soft/40">
            <span className="font-display text-lg sm:text-2xl font-extrabold text-danger-text block leading-tight">{stats.rented}</span>
            <span className="text-[10px] text-muted font-bold block">🔴 Disewa</span>
          </div>
          <div className="bento p-2 sm:p-2.5 border-warn/30 bg-warn-soft/40">
            <span className="font-display text-lg sm:text-2xl font-extrabold text-warn-text block leading-tight">{stats.maintenance}</span>
            <span className="text-[10px] text-muted font-bold block">🟡 Servis</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigasi Internal Sticky (5 Tab: Stok, Booking, Omzet, Log, Profil) */}
      <nav
        aria-label="Navigasi Workspace"
        className="sticky top-12 z-30 bg-surface/95 backdrop-blur-md border border-line-strong shadow-sm grid grid-cols-5 gap-1 p-1 rounded-2xl"
      >
        <button
          onClick={() => setWorkspaceTab('inventory')}
          className={`py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
            workspaceTab === 'inventory'
              ? 'bg-accent text-accent-fg shadow-xs font-extrabold'
              : 'text-muted hover:text-fg hover:bg-surface-2'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Stok</span>
        </button>

        <button
          onClick={() => setWorkspaceTab('bookings')}
          className={`py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
            workspaceTab === 'bookings'
              ? 'bg-accent text-accent-fg shadow-xs font-extrabold'
              : 'text-muted hover:text-fg hover:bg-surface-2'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Booking ({bookings.length})</span>
        </button>

        <button
          onClick={() => {
            if (currentRole !== 'owner') {
              triggerToast('Terbatas: Laporan Omzet hanya untuk Owner.');
              return;
            }
            setWorkspaceTab('analytics');
          }}
          className={`py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition ${
            workspaceTab === 'analytics'
              ? 'bg-accent text-accent-fg shadow-xs font-extrabold cursor-pointer'
              : currentRole !== 'owner'
              ? 'text-subtle cursor-not-allowed opacity-50'
              : 'text-muted hover:text-fg hover:bg-surface-2 cursor-pointer'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Omzet</span>
        </button>

        <button
          onClick={() => setWorkspaceTab('logs')}
          className={`py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
            workspaceTab === 'logs'
              ? 'bg-accent text-accent-fg shadow-xs font-extrabold'
              : 'text-muted hover:text-fg hover:bg-surface-2'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Log ({shopLogs.length})</span>
        </button>

        <button
          onClick={() => {
            if (currentRole !== 'owner') {
              triggerToast('Terbatas: Pengaturan Toko hanya untuk Owner.');
              return;
            }
            setWorkspaceTab('settings');
          }}
          className={`py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition ${
            workspaceTab === 'settings'
              ? 'bg-accent text-accent-fg shadow-xs font-extrabold cursor-pointer'
              : currentRole !== 'owner'
              ? 'text-subtle cursor-not-allowed opacity-50'
              : 'text-muted hover:text-fg hover:bg-surface-2 cursor-pointer'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Profil</span>
        </button>
      </nav>

      {/* SUB-TAB 1: KONTROL INVENTARIS & STATUS 1-TAP */}
      {workspaceTab === 'inventory' && (
        <div className="space-y-3">
          {/* Info Hak Akses untuk Staf Gudang */}
          {currentRole === 'staff' && (
            <div className="bento p-3 bg-warn-soft/50 border-warn/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-warn-text">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Anda login sebagai <strong>Staf Gudang</strong>. Anda dapat memperbarui status unit &amp; stok keluar/masuk.
                </span>
              </div>
              <button
                onClick={onSwitchToOwnerLogin}
                className="shrink-0 text-[11px] font-bold text-warn-text underline cursor-pointer"
              >
                Buka Mode Owner
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Tombol Tambah Alat Hanya Muncul untuk Owner */}
            {currentRole === 'owner' && (
              <button
                onClick={onOpenAddModal}
                className="btn-brutal px-3.5 py-2 text-xs shrink-0"
              >
                <PackagePlus className="w-4 h-4" />
                <span>+ Tambah Unit</span>
              </button>
            )}

            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama unit atau kode SKU..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="field pl-8 pr-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Kuota & Status Inventaris Paket */}
          <div className="flex items-center justify-between text-xs px-1 py-0.5">
            {!isPro ? (
              <>
                <span className="text-[11px] font-bold text-muted">
                  Katalog:{' '}
                  <strong className={allItemsCount >= STARTER_MAX_ITEMS ? 'text-warn-text' : 'text-fg'}>
                    {allItemsCount} / {STARTER_MAX_ITEMS} Unit
                  </strong>{' '}
                  (Starter)
                </span>
                {allItemsCount >= STARTER_MAX_ITEMS ? (
                  <button
                    type="button"
                    onClick={onOpenUpgradeModal}
                    className="text-[11px] font-extrabold text-accent-text hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-warn-text" />
                    <span>Upgrade Unlimited PRO</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-subtle">
                    Sisa kuota: {Math.max(0, STARTER_MAX_ITEMS - allItemsCount)} unit
                  </span>
                )}
              </>
            ) : (
              <span className="text-[11px] font-extrabold text-accent-text flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Katalog: {allItemsCount} Unit (Bisnis PRO Unlimited)</span>
              </span>
            )}
          </div>

          {/* Daftar Kartu Kontrol Unit */}
          {filteredAdminItems.map((item) => (
            <div
              key={item.id}
              className="bento p-3.5 sm:p-4 border-line space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-surface-2 border border-line">
                    {item.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-linear-to-br ${item.imageBg} flex items-center justify-center text-[9px] text-white font-bold`}
                      >
                        {item.sku ? item.sku.substring(0, 3) : 'UNIT'}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="chip text-[10px] font-mono font-bold py-0.5">
                        {item.sku || 'UNIT'}
                      </span>
                      <span className="text-[10px] font-bold text-muted uppercase">
                        {item.category}
                      </span>
                    </div>
                    <h4 className="font-display text-sm font-extrabold text-fg mt-0.5 truncate">{item.name}</h4>
                    <p className="text-xs font-bold text-accent-text">
                      {formatRp(item.pricePerDay)} / hari
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onOpenQrModal(item)}
                    className="btn-glass p-2 rounded-xl text-fg-soft"
                    title="Label QR Fisik Unit"
                  >
                    <QrCode className="w-4 h-4 text-accent-text" />
                  </button>

                  {/* Hanya Owner yang bisa mengedit & menghapus unit */}
                  {currentRole === 'owner' && onOpenEditModal && (
                    <button
                      onClick={() => onOpenEditModal(item)}
                      className="btn-glass p-2 rounded-xl text-fg-soft"
                      title="Edit Detail Unit (Khusus Owner)"
                    >
                      <Pencil className="w-4 h-4 text-accent-text" />
                    </button>
                  )}

                  {currentRole === 'owner' && (
                    <button
                      onClick={() => onDeleteUnit(item.id, item.name)}
                      className="p-2 text-danger-text hover:bg-danger-soft rounded-xl border border-danger/30 transition cursor-pointer"
                      title="Hapus Unit (Khusus Owner)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 1-TAP STATUS SWITCH */}
              <div className="grid grid-cols-3 gap-1.5 bg-surface-2 p-1 rounded-2xl border border-line">
                <button
                  onClick={() => onStatusChange(item.id, 'available')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    item.status === 'available'
                      ? 'bg-accent text-accent-fg shadow-xs font-extrabold'
                      : 'text-muted hover:text-fg'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </button>

                <button
                  onClick={() => onStatusChange(item.id, 'rented')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    item.status === 'rented'
                      ? 'bg-danger text-white shadow-xs font-extrabold'
                      : 'text-muted hover:text-fg'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Disewa</span>
                </button>

                <button
                  onClick={() => onStatusChange(item.id, 'maintenance')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                    item.status === 'maintenance'
                      ? 'bg-warn text-[#0c110f] shadow-xs font-extrabold'
                      : 'text-muted hover:text-fg'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Servis</span>
                </button>
              </div>

              {item.status === 'available' && (
                <div className="flex items-center justify-between bg-accent-soft/40 border border-accent/20 rounded-2xl px-3.5 py-2">
                  <span className="text-xs font-bold text-accent-text">
                    Stok Fisik Tersedia:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onStockChange(item.id, -1)}
                      className="btn-glass w-7 h-7 rounded-lg text-fg font-bold"
                      aria-label="Kurangi stok"
                    >
                      -
                    </button>
                    <span className="font-display text-sm font-extrabold text-fg w-5 text-center">
                      {item.stock}
                    </span>
                    <button
                      onClick={() => onStockChange(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-accent text-accent-fg hover:bg-accent-strong flex items-center justify-center font-bold shadow-xs cursor-pointer"
                      aria-label="Tambah stok"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {(item.status === 'rented' || item.status === 'maintenance') && (
                <div className="bg-danger-soft/40 border border-danger/30 rounded-2xl p-3 space-y-2">
                  <div>
                    <label className="block text-[10px] font-extrabold text-danger-text uppercase mb-1">
                      ⏰ Estimasi Kembali (Tampil ke Pelanggan)
                    </label>
                    <input
                      type="text"
                      value={getDraftValue(item, 'availableAt')}
                      onChange={(e) =>
                        setDraftValue(item.id, 'availableAt', e.target.value)
                      }
                      onBlur={() => commitItemDraftField(item, 'availableAt')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="Contoh: Minggu, 1 Nov (14:00)"
                      className="field text-xs bg-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-muted uppercase mb-1">
                      🔒 Catatan Peminjam (Internal Gudang &amp; Owner)
                    </label>
                    <input
                      type="text"
                      value={getDraftValue(item, 'renterNote')}
                      onChange={(e) =>
                        setDraftValue(item.id, 'renterNote', e.target.value)
                      }
                      onBlur={() => commitItemDraftField(item, 'renterNote')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="Contoh: Disewa Pak Budi - KTP ditahan"
                      className="field text-xs bg-surface"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-subtle pt-1 border-t border-line">
                <span>Diperbarui oleh: {item.lastUpdatedBy || 'Owner'}</span>
                {currentRole === 'owner' && (
                  <span>Tarif: {formatRp(item.pricePerDay)}/hr</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB BOOKING: DAFTAR PESANAN & JADWAL SEWA */}
      {workspaceTab === 'bookings' && (
        <div className="bento p-4 sm:p-5 border-line space-y-3">
          <div className="border-b border-line pb-2.5">
            <h3 className="font-display text-sm font-extrabold text-fg">
              Jadwal Booking &amp; Ketersediaan Tanggal
            </h3>
            <p className="text-[11px] text-muted">
              Booking yang berstatus Confirmed atau Picked Up otomatis mengurangi stok pada tanggal terkait.
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted bento bg-surface-2/60 border-line">
              Belum ada pengajuan booking tercatat untuk toko ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {bookings.map((bk) => (
                <div
                  key={bk.id}
                  className="p-3.5 rounded-2xl bg-surface-2 border border-line space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="chip text-[10px] font-mono font-extrabold bg-accent-soft text-accent-text border-accent/30 py-0.5">
                        {bk.code}
                      </span>
                      <h4 className="font-display text-xs font-extrabold text-fg mt-1">
                        {bk.customerName} ({bk.customerPhone})
                      </h4>
                      <p className="text-[11px] text-muted">
                        📅 {bk.startDate} s/d {bk.endDate} ({bk.durationDays} hari)
                      </p>
                    </div>
                    <span className="font-display text-xs sm:text-sm font-extrabold text-accent-text">
                      {formatRp(bk.totalAmount)}
                    </span>
                  </div>

                  {bk.lines && bk.lines.length > 0 && (
                    <ul className="text-[11px] text-muted bg-surface rounded-xl p-2.5 border border-line space-y-1">
                      {bk.lines.map((ln) => (
                        <li key={ln.id} className="flex justify-between">
                          <span>
                            • {ln.itemName} × {ln.qty}
                          </span>
                          <span className="font-semibold text-fg">{formatRp(ln.subtotal)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {bk.notes && (
                    <p className="text-[11px] text-muted italic">Catatan: {bk.notes}</p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const cleanPhone = normalizeWhatsapp(bk.customerPhone);
                          const followUpText = buildBookingFollowUpWaMessage(bk, shop.name);
                          const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
                            followUpText
                          )}`;
                          window.open(waUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className="btn-glass px-3 py-1.5 text-[11px] font-bold text-accent-text flex items-center gap-1.5"
                        title="Kirim pesan WhatsApp konfirmasi / pengingat ke penyewa"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-accent-text" />
                        <span>Chat WA Penyewa</span>
                      </button>

                      {onOpenBookingReceipt && (
                        <button
                          type="button"
                          onClick={() => onOpenBookingReceipt(bk)}
                          className="btn-glass px-2.5 py-1.5 text-[11px] font-bold text-fg-soft flex items-center gap-1"
                          title="Lihat & Cetak Nota Booking"
                        >
                          <Printer className="w-3.5 h-3.5 text-accent-text" />
                          <span>Nota</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-muted">
                        Status:
                      </span>
                      <select
                        value={bk.status}
                        onChange={(e) =>
                          onUpdateBookingStatus(bk.id, e.target.value as BookingStatus)
                        }
                        className="field text-xs font-bold py-1 px-2.5 w-auto"
                      >
                        <option value="pending">⏳ Pending (Menunggu DP)</option>
                        <option value="confirmed">✅ Confirmed (Kunci Stok)</option>
                        <option value="picked_up">📦 Picked Up (Barang Diambil)</option>
                        <option value="returned">🏁 Returned (Selesai Kembali)</option>
                        <option value="cancelled">❌ Cancelled (Batal)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB OMZET: MINI DASHBOARD ANALITIK & ALAT TERLARIS (KHUSUS OWNER PRO) */}
      {workspaceTab === 'analytics' && currentRole === 'owner' && (
        <div className="bento p-4 sm:p-5 border-line space-y-4">
          {!isPro ? (
            <div className="bento border-line-strong p-6 text-center text-fg space-y-3 bg-surface-2 aurora">
              <div className="w-11 h-11 rounded-2xl bg-warn-soft border border-warn/30 text-warn-text flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="chip uppercase tracking-wider text-[10px] font-extrabold text-warn-text bg-warn-soft border-warn/30">
                  Fitur Eksklusif Bisnis PRO
                </span>
                <h3 className="font-display text-base font-extrabold text-fg mt-2">
                  Dashboard Analitik Omzet, AOV &amp; Alat Paling Laris
                </h3>
                <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                  Pantau total pendapatan sewa terealisasi, potensi booking yang menunggu DP, peringkat unit penyumbang omzet tertinggi, dan unduh rekap CSV untuk pembukuan.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="btn-brutal px-5 py-3 text-xs"
              >
                Buka Laporan Omzet (Upgrade PRO Mulai Rp 23rb)
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-line pb-3">
                <div>
                  <h3 className="font-display text-sm sm:text-base font-extrabold text-fg flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-accent-text" />
                    <span>Ringkasan Omzet &amp; Performa Unit</span>
                  </h3>
                  <p className="text-[11px] text-muted">
                    Dihitung otomatis dari transaksi berstatus Confirmed, Picked Up, dan Returned.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: 'Semua', days: null },
                    { label: '30 Hari', days: 30 },
                    { label: '7 Hari', days: 7 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setAnalyticsPeriodDays(p.days)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                        analyticsPeriodDays === p.days
                          ? 'bg-accent text-accent-fg shadow-xs'
                          : 'btn-glass text-muted'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="btn-glass px-3 py-1 text-[11px] font-bold text-accent-text flex items-center gap-1"
                    title="Unduh rekap transaksi ke file CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh CSV</span>
                  </button>
                </div>
              </div>

              {/* 4 Kartu KPI Utama */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bento p-3 bg-accent-soft/50 border-accent/30 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-muted block">
                    Omzet Terealisasi
                  </span>
                  <span className="font-display text-base sm:text-lg font-black text-accent-text block">
                    {formatRp(analyticsSummary.realizedRevenue)}
                  </span>
                  <span className="text-[10px] text-muted block">
                    {analyticsSummary.activeOrCompletedCount} booking sukses
                  </span>
                </div>

                <div className="bento p-3 bg-warn-soft/40 border-warn/30 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-muted block">
                    Potensi Menunggu DP
                  </span>
                  <span className="font-display text-base sm:text-lg font-black text-warn-text block">
                    {formatRp(analyticsSummary.pendingRevenue)}
                  </span>
                  <span className="text-[10px] text-muted block">
                    {analyticsSummary.pendingCount} booking pending
                  </span>
                </div>

                <div className="bento p-3 bg-surface-2 border-line space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-muted block">
                    Rata-rata Sewa (AOV)
                  </span>
                  <span className="font-display text-base sm:text-lg font-black text-fg block">
                    {formatRp(analyticsSummary.averageOrderValue)}
                  </span>
                  <span className="text-[10px] text-muted block">
                    per transaksi sukses
                  </span>
                </div>

                <div className="bento p-3 bg-surface-2 border-line space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-muted block">
                    Rasio Konversi
                  </span>
                  <span className="font-display text-base sm:text-lg font-black text-fg block">
                    {analyticsSummary.conversionRate}%
                  </span>
                  <span className="text-[10px] text-muted block">
                    dari total {analyticsSummary.totalBookings} pengajuan
                  </span>
                </div>
              </div>

              {/* Peringkat Alat Paling Laris */}
              <div className="p-3.5 rounded-2xl bg-surface-2 border border-line space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-fg flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-accent-text" />
                    <span>Peringkat Unit Penyumbang Omzet Tertinggi</span>
                  </span>
                  <span className="text-[10px] font-bold text-muted">
                    Top {analyticsSummary.topItems.length} Unit
                  </span>
                </div>

                {analyticsSummary.topItems.length === 0 ? (
                  <p className="text-xs text-muted py-4 text-center">
                    Belum ada unit dengan booking terkonfirmasi pada periode ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {analyticsSummary.topItems.slice(0, 5).map((top, idx) => {
                      const maxRev = analyticsSummary.topItems[0]?.totalRevenue || 1;
                      const barPct = Math.max(8, Math.round((top.totalRevenue / maxRev) * 100));
                      return (
                        <div
                          key={top.itemId}
                          className="bg-surface border border-line rounded-xl p-2.5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="chip text-[10px] font-mono font-extrabold bg-accent-soft text-accent-text border-accent/30 py-0.5">
                                #{idx + 1}
                              </span>
                              <span className="font-bold text-fg truncate">{top.itemName}</span>
                            </div>
                            <span className="font-display font-extrabold text-accent-text shrink-0">
                              {formatRp(top.totalRevenue)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent rounded-full"
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted font-semibold shrink-0">
                              {top.totalQtyRented} unit tersewa ({top.bookingCount}x order)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* SUB-TAB 2: LOG RIWAYAT AKTIVITAS (AUDIT TRAIL) */}
      {workspaceTab === 'logs' && (
        <div className="bento p-4 sm:p-5 border-line space-y-3">
          {!isPro ? (
            <div className="bento border-line-strong p-6 text-center text-fg space-y-3 bg-surface-2 aurora">
              <div className="w-11 h-11 rounded-2xl bg-warn-soft border border-warn/30 text-warn-text flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="chip uppercase tracking-wider text-[10px] font-extrabold text-warn-text bg-warn-soft border-warn/30">
                  Fitur Bisnis PRO
                </span>
                <h3 className="font-display text-base font-extrabold text-fg mt-2">
                  Audit Trail Log Aktivitas Operasional
                </h3>
                <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                  Pantau jam berapa staf gudang mengubah status unit, mencatat nama peminjam, atau mengupdate profil inventaris dengan akurat.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="btn-brutal px-5 py-3 text-xs"
              >
                Buka Akses Log (Upgrade PRO Mulai Rp 23rb)
              </button>
            </div>
          ) : (
            <>
              <div className="border-b border-line pb-2.5">
                <h3 className="font-display text-sm font-extrabold text-fg">
                  Riwayat Perubahan Status &amp; Stok
                </h3>
                <p className="text-[11px] text-muted">
                  Memantau aktivitas Staf Gudang &amp; Owner secara transparan
                </p>
              </div>

              <div className="space-y-2.5">
                {shopLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-surface-2 border border-line flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <span
                        className={`chip text-[9px] font-extrabold uppercase py-0.5 ${
                          log.actorRole.includes('Owner')
                            ? 'bg-accent-soft text-accent-text border-accent/30'
                            : 'bg-warn-soft text-warn-text border-warn/30'
                        }`}
                      >
                        {log.actorRole}
                      </span>
                      <p className="text-xs font-semibold text-fg">{log.action}</p>
                    </div>
                    <span className="text-[10px] text-subtle whitespace-nowrap">
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PENGATURAN TOKO & UNDANGAN TIM */}
      {workspaceTab === 'settings' && currentRole === 'owner' && (
        <div className="bento p-4 sm:p-5 border-line space-y-4">
          <div className="border-b border-line pb-2.5">
            <h3 className="font-display text-sm font-extrabold text-fg">
              Pengaturan Profil &amp; Akses Anggota Tim
            </h3>
            <p className="text-[11px] text-muted">
              Hanya Owner yang dapat mengubah informasi bisnis dan mengundang Staf Gudang via email.
            </p>
          </div>

          {/* Status Paket & Langganan Toko */}
          <div className="p-4 rounded-2xl bento bg-surface-2 border border-line space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPro ? 'bg-accent-soft text-accent-text border border-accent/30' : 'bg-surface-3 text-muted'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-xs font-extrabold text-fg">
                      {isPro ? 'Paket Bisnis PRO' : 'Paket Starter (Gratis)'}
                    </span>
                    <span className={`chip text-[9px] uppercase font-extrabold py-0.5 ${isPro ? 'bg-accent text-accent-fg' : 'bg-surface-3 text-muted'}`}>
                      {isPro ? 'Aktif' : 'Gratis'}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted mt-0.5">
                    {isPro
                      ? `Unlimited stok • Bebas watermark • Staf & Log aktif${shop.billingCycle ? ` (${shop.billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'})` : ''}`
                      : `Maksimal 8 unit alat (${allItemsCount}/8 terpakai)`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className={isPro ? 'btn-glass px-3 py-1.5 text-xs' : 'btn-brutal px-3.5 py-2 text-xs'}
              >
                {isPro ? 'Info Paket PRO' : 'Upgrade ke PRO'}
              </button>
            </div>
          </div>

          {/* Upload Logo Usaha / Brand Toko */}
          <div className="p-3.5 rounded-2xl bg-surface-2 border border-line space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-fg">Logo Usaha / Brand Toko</span>
                <p className="text-[10px] text-muted">
                  Akan tampil di header katalog publik, QR toko, dan dashboard
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUrlMode(!isUrlMode)}
                className="text-[10px] font-bold text-accent-text hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Link2 className="w-3 h-3" />
                <span>{isUrlMode ? 'Upload File' : 'Gunakan Link URL'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-line bg-surface flex items-center justify-center relative">
                {shop.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={shop.logoUrl}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-accent to-accent-strong flex items-center justify-center">
                    <Tent className="w-7 h-7 text-accent-fg" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                {isUrlMode ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      placeholder="https://contoh.com/logo.png"
                      value={logoUrlInput}
                      onChange={(e) => setLogoUrlInput(e.target.value)}
                      className="field flex-1 text-xs py-1.5"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (logoUrlInput.trim()) {
                          onSaveShopSettings({ ...shop, logoUrl: logoUrlInput.trim() });
                          onRecordAuditLog('Memperbarui logo toko via URL');
                          triggerToast('Logo usaha berhasil diperbarui!');
                          setIsUrlMode(false);
                        }
                      }}
                      className="btn-brutal px-3 py-1.5 text-[11px] shrink-0"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="btn-glass text-[11px] px-3 py-2 flex items-center gap-1.5"
                    >
                      {isUploadingLogo ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-text" />
                          <span>Mengompres...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-accent-text" />
                          <span>{shop.logoUrl ? 'Ganti Logo' : 'Pilih Logo Usaha'}</span>
                        </>
                      )}
                    </button>

                    {shop.logoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          onSaveShopSettings({ ...shop, logoUrl: '' });
                          onRecordAuditLog('Menghapus logo toko');
                          triggerToast('Logo dihapus, kembali ke ikon default.');
                          setLogoUrlInput('');
                        }}
                        className="text-[11px] font-bold text-danger-text hover:underline px-2 py-1.5 flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Hapus
                      </button>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-subtle">
                  Format: JPG, PNG, WebP (Otomatis dikompres &amp; proporsional)
                </p>
              </div>
            </div>

            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setIsUploadingLogo(true);
                  const uploadedLogo = await uploadShopLogo(file, shop.slug);
                  onSaveShopSettings({ ...shop, logoUrl: uploadedLogo });
                  onRecordAuditLog('Memperbarui logo toko');
                  triggerToast('Logo usaha berhasil diunggah!');
                } catch (err) {
                  console.error('Gagal upload logo:', err);
                  triggerToast('Gagal memproses gambar logo');
                } finally {
                  setIsUploadingLogo(false);
                  if (logoInputRef.current) logoInputRef.current.value = '';
                }
              }}
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-fg-soft mb-1">
                Nama Resmi Usaha Rental
              </label>
              <input
                type="text"
                value={shopDraft.name}
                onChange={(e) => setShopDraft({ ...shopDraft, name: e.target.value })}
                className="field text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-fg-soft mb-1">
                Tagline / Deskripsi Singkat Header
              </label>
              <input
                type="text"
                value={shopDraft.tagline}
                onChange={(e) => setShopDraft({ ...shopDraft, tagline: e.target.value })}
                className="field text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-fg-soft mb-1">
                  Nomor WhatsApp Admin
                </label>
                <input
                  type="text"
                  value={shopDraft.whatsapp}
                  onChange={(e) => setShopDraft({ ...shopDraft, whatsapp: e.target.value })}
                  className="field text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-fg-soft mb-1">
                  Jam Operasional
                </label>
                <input
                  type="text"
                  value={shopDraft.hours}
                  onChange={(e) => setShopDraft({ ...shopDraft, hours: e.target.value })}
                  className="field text-xs"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-fg-soft mb-1">
                  Alamat Lengkap Toko / Gudang
                </label>
                <input
                  type="text"
                  value={shopDraft.location}
                  onChange={(e) => setShopDraft({ ...shopDraft, location: e.target.value })}
                  className="field text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-fg-soft mb-1">
                  Link Titik Google Maps (Opsional)
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://maps.app.goo.gl/..."
                    value={shopDraft.mapsUrl}
                    onChange={(e) => setShopDraft({ ...shopDraft, mapsUrl: e.target.value })}
                    className="field pl-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Editor Aturan Diskon Durasi Sewa (Milik Owner) */}
            <div className="p-3.5 rounded-2xl bg-surface-2 border border-line space-y-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-[11px] font-extrabold text-fg flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-accent-text" />
                    Aturan Diskon Durasi Sewa (Ditentukan Pemilik Toko)
                  </span>
                  <p className="text-[10px] text-muted mt-0.5">
                    Atur potongan harga untuk penyewaan beberapa hari. Hapus semua tier jika tidak ingin memberikan diskon otomatis di katalog.
                  </p>
                </div>
                {shopDraft.discountTiers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShopDraft({ ...shopDraft, discountTiers: [] })}
                    className="text-[10px] font-bold text-danger-text hover:underline cursor-pointer"
                  >
                    Matikan Semua Diskon (0%)
                  </button>
                )}
              </div>

              {shopDraft.discountTiers.length === 0 ? (
                <div className="p-3 rounded-xl bg-surface border border-line text-[11px] text-muted flex items-center justify-between gap-2">
                  <span>Tidak ada diskon durasi otomatis (Tarif = Harga Harian × Jumlah Hari).</span>
                  <button
                    type="button"
                    onClick={() =>
                      setShopDraft({
                        ...shopDraft,
                        discountTiers: DEFAULT_DISCOUNT_TIERS,
                      })
                    }
                    className="text-[10px] font-bold text-accent-text hover:underline shrink-0 cursor-pointer"
                  >
                    + Gunakan Template (3 &amp; 7 Hari)
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {shopDraft.discountTiers.map((tier, idx) => (
                    <div
                      key={`${tier.minDays}-${idx}`}
                      className="flex items-center justify-between gap-2 bg-surface border border-line rounded-xl px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-fg">
                          Sewa &ge; {tier.minDays} Hari
                        </span>
                        <span className="chip bg-accent-soft text-accent-text border-accent/30 text-[10px] font-extrabold">
                          Diskon {tier.discountPercent}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={90}
                          value={tier.discountPercent}
                          onChange={(e) => {
                            const nextPct = Math.max(
                              0,
                              Math.min(90, Number(e.target.value) || 0)
                            );
                            const nextTiers = shopDraft.discountTiers.map((t, i) =>
                              i === idx ? { ...t, discountPercent: nextPct } : t
                            );
                            setShopDraft({ ...shopDraft, discountTiers: nextTiers });
                          }}
                          className="field w-16 text-xs py-1 px-2 text-center font-bold"
                          aria-label={`Persentase diskon untuk minimal ${tier.minDays} hari`}
                        />
                        <span className="text-xs font-bold text-muted">%</span>
                        <button
                          type="button"
                          onClick={() => {
                            const nextTiers = shopDraft.discountTiers.filter(
                              (_, i) => i !== idx
                            );
                            setShopDraft({ ...shopDraft, discountTiers: nextTiers });
                          }}
                          className="p-1.5 text-danger-text hover:bg-danger-soft rounded-lg transition cursor-pointer"
                          title="Hapus tier diskon ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-[11px] font-bold text-muted whitespace-nowrap">
                    Min. Hari:
                  </span>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={newTierDays}
                    onChange={(e) => setNewTierDays(e.target.value)}
                    className="field text-xs py-1.5 px-2.5 w-20"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-[11px] font-bold text-muted whitespace-nowrap">
                    Diskon (%):
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={newTierPercent}
                    onChange={(e) => setNewTierPercent(e.target.value)}
                    className="field text-xs py-1.5 px-2.5 w-20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const minDays = Math.floor(Number(newTierDays));
                    const discountPercent = Math.round(Number(newTierPercent));
                    if (minDays < 2 || minDays > 60) {
                      triggerToast('Minimal hari tier diskon harus antara 2 s/d 60 hari.');
                      return;
                    }
                    if (discountPercent < 1 || discountPercent > 90) {
                      triggerToast('Persentase diskon harus antara 1% s/d 90%.');
                      return;
                    }
                    const merged = normalizeDiscountTiers([
                      ...shopDraft.discountTiers.filter((t) => t.minDays !== minDays),
                      { minDays, discountPercent },
                    ]);
                    setShopDraft({ ...shopDraft, discountTiers: merged });
                  }}
                  className="btn-glass text-xs px-3 py-1.5 font-bold text-accent-text shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tier</span>
                </button>
              </div>
            </div>

            {/* Editor Ketentuan & Jaminan Sewa (terms) */}
            <div className="p-3.5 rounded-2xl bg-surface-2 border border-line space-y-2.5">
              <div>
                <span className="text-[11px] font-extrabold text-fg flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-accent-text" />
                  Ketentuan &amp; Jaminan Sewa (Tampil di Header Katalog)
                </span>
                <p className="text-[10px] text-muted mt-0.5">
                  Cantumkan syarat kartu identitas (E-KTP), aturan DP, atau denda keterlambatan toko Anda.
                </p>
              </div>

              <div className="space-y-1.5">
                {shopDraft.terms.map((term, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => {
                        const nextTerms = shopDraft.terms.map((t, i) =>
                          i === idx ? e.target.value : t
                        );
                        setShopDraft({ ...shopDraft, terms: nextTerms });
                      }}
                      className="field text-xs py-1.5 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nextTerms = shopDraft.terms.filter((_, i) => i !== idx);
                        setShopDraft({ ...shopDraft, terms: nextTerms });
                      }}
                      className="p-1.5 text-danger-text hover:bg-danger-soft rounded-lg transition cursor-pointer"
                      title="Hapus poin ketentuan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Tambah poin ketentuan sewa baru..."
                  value={newTermInput}
                  onChange={(e) => setNewTermInput(e.target.value)}
                  className="field text-xs py-1.5 flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newTermInput.trim()) return;
                    setShopDraft({
                      ...shopDraft,
                      terms: [...shopDraft.terms, newTermInput.trim()],
                    });
                    setNewTermInput('');
                  }}
                  className="btn-glass text-xs px-3 py-1.5 font-bold text-accent-text shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Poin</span>
                </button>
              </div>
            </div>

            {/* Manajemen Anggota & Undangan Email Staf Gudang */}
            <div className="p-3.5 rounded-2xl bg-surface-2 border border-line space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-fg flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-accent-text" />
                    Undang Staf Gudang / Co-Owner via Email
                  </span>
                  <p className="text-[10px] text-muted mt-0.5">
                    Staf yang diundang cukup login dengan alamat emailnya menggunakan Magic Link / OTP untuk langsung mendapatkan akses operasional gudang.
                  </p>
                </div>
                {!isPro && (
                  <span className="chip uppercase text-[9px] font-extrabold text-warn-text bg-warn-soft border-warn/30">
                    Fitur PRO
                  </span>
                )}
              </div>

              {!isPro ? (
                <div className="bg-warn-soft/50 border border-warn/30 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="text-xs text-warn-text flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Upgrade ke <strong>Bisnis PRO</strong> untuk mendelegasikan kontrol staf gudang via email.</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenUpgradeModal}
                    className="btn-brutal text-[11px] px-3 py-1.5 shrink-0"
                  >
                    Buka Akses Staf
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        placeholder="staf.gudang@email.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="field pl-8 text-xs py-2"
                      />
                    </div>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'staff' | 'owner')}
                      className="field text-xs font-bold py-2 w-auto"
                    >
                      <option value="staff">Staf Gudang</option>
                      <option value="owner">Co-Owner</option>
                    </select>
                    <button
                      type="button"
                      disabled={isInviting || !inviteEmail.trim()}
                      onClick={async () => {
                        setIsInviting(true);
                        try {
                          await onInviteMember(inviteEmail.trim(), inviteRole);
                          setInviteEmail('');
                        } finally {
                          setIsInviting(false);
                        }
                      }}
                      className="btn-brutal text-xs px-3.5 py-2 shrink-0"
                    >
                      {isInviting ? 'Mengundang...' : 'Undang'}
                    </button>
                  </div>

                  {/* Daftar Anggota Tim Aktif */}
                  {members.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase text-subtle">
                        Anggota Tim Aktif ({members.length})
                      </span>
                      {members.map((m) => (
                        <div
                          key={`${m.shopSlug}-${m.userId}`}
                          className="flex items-center justify-between gap-2 text-[11px] bg-surface border border-line rounded-xl px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-fg-soft truncate">
                              {m.email || m.userId}
                            </span>
                            <span className="chip text-[9px] font-bold uppercase">
                              {m.role === 'owner' ? '👑 Owner' : '👷 Staf Gudang'}
                            </span>
                          </div>
                          {m.role !== 'owner' && onRemoveMember && (
                            <button
                              type="button"
                              onClick={() => onRemoveMember(m.userId, m.email)}
                              className="text-[10px] font-bold text-danger-text hover:underline shrink-0 cursor-pointer"
                            >
                              Cabut Akses
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {invites.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase text-subtle">
                        Daftar Undangan Akses ({invites.length})
                      </span>
                      {invites.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between gap-2 text-[11px] bg-surface border border-line rounded-xl px-2.5 py-1.5"
                        >
                          <span className="font-mono text-fg-soft truncate">{inv.email}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="chip text-[10px] font-bold uppercase">
                              {inv.role} • {inv.acceptedAt ? 'Aktif' : 'Menunggu Login'}
                            </span>
                            {onRevokeInvite && (
                              <button
                                type="button"
                                onClick={() => onRevokeInvite(inv.id, inv.email)}
                                className="text-[10px] font-bold text-danger-text hover:underline cursor-pointer"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => {
                const cleanName = shopDraft.name.trim();
                const cleanWa = normalizeWhatsapp(shopDraft.whatsapp);
                if (cleanName.length < 2) {
                  triggerToast('Nama usaha minimal 2 karakter.');
                  return;
                }
                if (!/^62[0-9]{8,13}$/.test(cleanWa)) {
                  triggerToast('Nomor WhatsApp harus valid (contoh: 08123456789).');
                  return;
                }
                const cleanTerms = shopDraft.terms
                  .map((t) => t.trim())
                  .filter((t) => t.length > 0);
                const cleanDiscountTiers = normalizeDiscountTiers(shopDraft.discountTiers);
                onSaveShopSettings({
                  ...shop,
                  name: cleanName,
                  tagline: shopDraft.tagline.trim(),
                  whatsapp: cleanWa,
                  hours: shopDraft.hours.trim() || shop.hours,
                  location: shopDraft.location.trim() || shop.location,
                  mapsUrl: shopDraft.mapsUrl.trim(),
                  terms: cleanTerms,
                  discountTiers: cleanDiscountTiers,
                });
                onRecordAuditLog('Memperbarui pengaturan profil, S&K, dan aturan diskon toko');
                triggerToast('Pengaturan toko berhasil disimpan!');
              }}
              className="btn-brutal w-full py-3 text-xs"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
