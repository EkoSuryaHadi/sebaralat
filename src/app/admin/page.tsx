'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Store,
  TrendingUp,
  Package,
  CalendarCheck,
  QrCode,
  Bell,
  Search,
  Download,
  ExternalLink,
  BadgeCheck,
  Sparkles,
  ArrowLeft,
  Loader2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PlatformAnalyticsPayload, PlatformShopAnalyticsRow } from '@/types';
import { buildPlatformShopsCsv, formatRp } from '@/lib/validators';
import { DEFAULT_SHOPS, DEFAULT_ITEMS, DEFAULT_BOOKINGS } from '@/data/mockData';
import { ThemeToggle } from '@/components/ThemeToggle';

function buildDemoAnalyticsPayload(): PlatformAnalyticsPayload {
  const shops: PlatformShopAnalyticsRow[] = DEFAULT_SHOPS.map((s) => {
    const shopItems = DEFAULT_ITEMS.filter((i) => i.shopSlug === s.slug);
    const shopBookings = DEFAULT_BOOKINGS.filter((b) => b.shopSlug === s.slug);
    const gmv = shopBookings
      .filter((b) => b.status === 'confirmed' || b.status === 'picked_up' || b.status === 'returned')
      .reduce((acc, b) => acc + b.totalAmount, 0);
    return {
      slug: s.slug,
      name: s.name,
      location: s.location,
      whatsapp: s.whatsapp,
      plan: s.plan || 'FREE',
      is_verified: Boolean(s.isVerified),
      pro_expires_at: null,
      billing_cycle: null,
      created_at: '2026-11-01T08:00:00Z',
      has_qris: Boolean(s.qrisUrl),
      has_telegram: Boolean(s.notifyTelegramChatId),
      item_count: shopItems.length,
      booking_count: shopBookings.length,
      gmv,
      member_count: 1,
    };
  });

  const confirmed = DEFAULT_BOOKINGS.filter(
    (b) => b.status === 'confirmed' || b.status === 'picked_up' || b.status === 'returned'
  );
  const pending = DEFAULT_BOOKINGS.filter((b) => b.status === 'pending');

  return {
    summary: {
      total_shops: shops.length,
      pro_shops: shops.filter((s) => s.plan === 'PRO').length,
      free_shops: shops.filter((s) => s.plan !== 'PRO').length,
      verified_shops: shops.filter((s) => s.is_verified).length,
      qris_adopted_shops: shops.filter((s) => s.has_qris).length,
      telegram_adopted_shops: shops.filter((s) => s.has_telegram).length,
      total_items: DEFAULT_ITEMS.length,
      total_bookings: DEFAULT_BOOKINGS.length,
      walkin_bookings: 0,
      confirmed_bookings: confirmed.length,
      total_gmv: confirmed.reduce((s, b) => s + b.totalAmount, 0),
      pending_gmv: pending.reduce((s, b) => s + b.totalAmount, 0),
      total_members: shops.length,
    },
    shops,
    recent_bookings: DEFAULT_BOOKINGS.map((b) => ({
      id: b.id,
      shop_slug: b.shopSlug,
      shop_name: DEFAULT_SHOPS.find((s) => s.slug === b.shopSlug)?.name || b.shopSlug,
      code: b.code,
      customer_name: b.customerName,
      total_amount: b.totalAmount,
      status: b.status,
      source: b.source || 'catalog',
      payment_status: b.paymentStatus || 'unpaid',
      created_at: b.createdAt,
    })),
  };
}

export default function SuperAdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [payload, setPayload] = useState<PlatformAnalyticsPayload | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'PRO' | 'FREE' | 'VERIFIED'>('ALL');
  const [updatingSlug, setUpdatingSlug] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  };

  const fetchPlatformAnalytics = useCallback(async () => {
    setLoading(true);
    setAccessError(null);

    if (!supabase || !isSupabaseConfigured) {
      setPayload(buildDemoAnalyticsPayload());
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user ?? null;
    setUserEmail(user?.email ?? null);

    if (!user) {
      setAccessError('UNAUTHENTICATED');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc('get_platform_analytics');
    if (error || !data) {
      setAccessError(error?.message || 'Akses ditolak: akun Anda belum terdaftar sebagai Super Admin.');
      setLoading(false);
      return;
    }

    setPayload(data as PlatformAnalyticsPayload);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      await Promise.resolve();
      if (cancelled) return;
      await fetchPlatformAnalytics();
    }
    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, [fetchPlatformAnalytics]);

  const filteredShops = useMemo(() => {
    if (!payload) return [];
    const q = searchQuery.trim().toLowerCase();
    return payload.shops.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (planFilter === 'PRO') return s.plan === 'PRO';
      if (planFilter === 'FREE') return s.plan !== 'PRO';
      if (planFilter === 'VERIFIED') return s.is_verified;
      return true;
    });
  }, [payload, searchQuery, planFilter]);

  const handleAdminPlanChange = async (
    shop: PlatformShopAnalyticsRow,
    nextPlan: 'FREE' | 'PRO',
    nextVerified: boolean,
    billingCycle: 'monthly' | 'yearly' = 'monthly',
    days = 30
  ) => {
    if (!supabase || !isSupabaseConfigured) {
      setPayload((prev) =>
        prev
          ? {
              ...prev,
              shops: prev.shops.map((s) =>
                s.slug === shop.slug
                  ? { ...s, plan: nextPlan, is_verified: nextVerified, billing_cycle: billingCycle }
                  : s
              ),
            }
          : prev
      );
      showToast(`Demo: Paket ${shop.name} diperbarui ke ${nextPlan}.`);
      return;
    }

    setUpdatingSlug(shop.slug);
    try {
      const { error } = await supabase.rpc('admin_update_shop_plan', {
        p_shop_slug: shop.slug,
        p_plan: nextPlan,
        p_is_verified: nextVerified,
        p_billing_cycle: nextPlan === 'PRO' ? billingCycle : null,
        p_duration_days: nextPlan === 'PRO' ? days : 0,
      });
      if (error) {
        showToast(`Gagal mengubah paket: ${error.message}`);
        return;
      }
      showToast(`Paket ${shop.name} berhasil diubah ke ${nextPlan}!`);
      await fetchPlatformAnalytics();
    } finally {
      setUpdatingSlug(null);
    }
  };

  const handleDownloadCsv = () => {
    if (!payload) return;
    const csv = buildPlatformShopsCsv(filteredShops);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sebaraja-platform-shops-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Rekap seluruh mitra toko (CSV) berhasil diunduh!');
  };

  return (
    <div className="min-h-screen bg-bg aurora text-fg pb-16">
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass-strong px-4 py-2.5 rounded-full shadow-2xl border border-accent/40 flex items-center gap-2 text-xs font-semibold animate-rise">
          <Sparkles className="w-4 h-4 text-accent-text shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Super Admin */}
      <header className="sticky top-0 z-30 px-3 sm:px-6 pt-3">
        <div className="glass max-w-6xl mx-auto rounded-2xl px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image
                src="/logo.svg"
                alt="Sebaraja"
                width={120}
                height={32}
                className="h-6 sm:h-7 w-auto object-contain dark:hidden"
              />
              <Image
                src="/logo-dark.svg"
                alt="Sebaraja"
                width={120}
                height={32}
                className="h-6 sm:h-7 w-auto object-contain hidden dark:block"
              />
            </Link>
            <span className="chip bg-accent-soft text-accent-text border-accent/30 text-[10px] font-extrabold uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Super Admin Analytics
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchPlatformAnalytics()}
              className="btn-glass px-3 py-1.5 text-xs"
              title="Muat ulang data terbaru"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link href="/" className="btn-glass px-3 py-1.5 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Beranda</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-6 space-y-6">
        {loading ? (
          <div className="bento p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent-text mx-auto" />
            <p className="text-xs text-muted font-semibold">
              Memuat analitik menyeluruh platform Sebaraja...
            </p>
          </div>
        ) : accessError === 'UNAUTHENTICATED' ? (
          <div className="bento max-w-md mx-auto p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-warn-soft border border-warn/30 text-warn-text flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-display text-xl font-extrabold text-fg">
              Login Super Admin Diperlukan
            </h1>
            <p className="text-xs text-muted leading-relaxed">
              Masuk dengan akun email Super Admin yang terdaftar di tabel{' '}
              <code className="font-mono text-accent-text">public.platform_admins</code> untuk melihat analitik seluruh platform.
            </p>
            <Link href="/login?redirect=/admin" className="btn-brutal w-full py-3 text-xs">
              Masuk sebagai Super Admin
            </Link>
          </div>
        ) : accessError || !payload ? (
          <div className="bento max-w-lg mx-auto p-6 sm:p-8 space-y-4 border-danger/30">
            <div className="flex items-center gap-2.5 text-danger-text">
              <Lock className="w-5 h-5 shrink-0" />
              <h1 className="font-display text-lg font-extrabold">
                Akses Khusus Super Admin Sebaraja
              </h1>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Akun <strong>{userEmail}</strong> belum terdaftar di{' '}
              <code className="font-mono text-accent-text">public.platform_admins</code> (atau migrasi{' '}
              <code className="font-mono">0009_platform_admin_analytics.sql</code> belum dijalankan).
            </p>
            {userEmail && (
              <div className="bg-surface-2 border border-line rounded-xl p-3 text-[11px] font-mono text-fg-soft overflow-x-auto">
                INSERT INTO public.platform_admins (user_id)
                <br />
                SELECT id FROM auth.users WHERE email = &apos;{userEmail}&apos;
                <br />
                ON CONFLICT DO NOTHING;
              </div>
            )}
            <p className="text-[11px] text-danger-text">{accessError}</p>
          </div>
        ) : (
          <>
            {/* 6 Kartu KPI Utama Platform */}
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bento p-4 space-y-1 bg-surface">
                <span className="text-[10px] font-extrabold uppercase text-muted flex items-center gap-1">
                  <Store className="w-3 h-3 text-accent-text" /> Total Mitra Toko
                </span>
                <p className="font-display text-2xl font-black text-fg">
                  {payload.summary.total_shops}
                </p>
                <span className="text-[10px] text-accent-text font-bold block">
                  {payload.summary.pro_shops} PRO • {payload.summary.free_shops} Starter
                </span>
              </div>

              <div className="bento p-4 space-y-1 bg-accent-soft/40 border-accent/30">
                <span className="text-[10px] font-extrabold uppercase text-muted flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-accent-text" /> Total GMV Platform
                </span>
                <p className="font-display text-xl font-black text-accent-text">
                  {formatRp(payload.summary.total_gmv)}
                </p>
                <span className="text-[10px] text-muted block">
                  Pending: {formatRp(payload.summary.pending_gmv)}
                </span>
              </div>

              <div className="bento p-4 space-y-1 bg-surface">
                <span className="text-[10px] font-extrabold uppercase text-muted flex items-center gap-1">
                  <CalendarCheck className="w-3 h-3 text-accent-text" /> Total Booking
                </span>
                <p className="font-display text-2xl font-black text-fg">
                  {payload.summary.total_bookings}
                </p>
                <span className="text-[10px] text-muted block">
                  {payload.summary.confirmed_bookings} sukses • {payload.summary.walkin_bookings} walk-in
                </span>
              </div>

              <div className="bento p-4 space-y-1 bg-surface">
                <span className="text-[10px] font-extrabold uppercase text-muted flex items-center gap-1">
                  <Package className="w-3 h-3 text-accent-text" /> Total Unit Alat
                </span>
                <p className="font-display text-2xl font-black text-fg">
                  {payload.summary.total_items}
                </p>
                <span className="text-[10px] text-muted block">
                  {payload.summary.total_members} pengelola aktif
                </span>
              </div>

              <div className="bento p-4 space-y-1 bg-surface">
                <span className="text-[10px] font-extrabold uppercase text-muted flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-accent-text" /> Adopsi QRIS
                </span>
                <p className="font-display text-2xl font-black text-fg">
                  {payload.summary.qris_adopted_shops}
                </p>
                <span className="text-[10px] text-muted block">
                  dari {payload.summary.total_shops} toko
                </span>
              </div>

              <div className="bento p-4 space-y-1 bg-surface">
                <span className="text-[10px] font-extrabold uppercase text-muted flex items-center gap-1">
                  <Bell className="w-3 h-3 text-accent-text" /> Alert Telegram
                </span>
                <p className="font-display text-2xl font-black text-fg">
                  {payload.summary.telegram_adopted_shops}
                </p>
                <span className="text-[10px] text-muted block">
                  toko aktifkan alert
                </span>
              </div>
            </section>

            {/* Daftar Lengkap Mitra Toko & Kontrol Paket PRO */}
            <section className="bento p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-base sm:text-lg font-extrabold text-fg">
                    Direktori &amp; Performa Mitra Toko ({filteredShops.length})
                  </h2>
                  <p className="text-xs text-muted">
                    Pantau pertumbuhan mitra dan aktifkan paket Bisnis PRO atau lencana Verified langsung dari sini.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="btn-glass px-3 py-2 text-xs font-bold text-accent-text"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh CSV Mitra</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama toko, slug, atau kota..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="field pl-9 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['ALL', 'PRO', 'FREE', 'VERIFIED'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPlanFilter(f)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        planFilter === f
                          ? 'bg-accent text-accent-fg shadow-xs'
                          : 'btn-glass text-muted'
                      }`}
                    >
                      {f === 'ALL'
                        ? 'Semua'
                        : f === 'PRO'
                        ? 'Bisnis PRO'
                        : f === 'FREE'
                        ? 'Starter'
                        : 'Verified'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredShops.map((s) => (
                  <div
                    key={s.slug}
                    className="p-3.5 sm:p-4 rounded-2xl bg-surface-2 border border-line flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-sm font-extrabold text-fg">
                          {s.name}
                        </span>
                        {s.is_verified && (
                          <span className="chip bg-accent-soft text-accent-text border-accent/30 text-[10px] font-extrabold py-0.5">
                            <BadgeCheck className="w-3 h-3" /> Verified
                          </span>
                        )}
                        <span
                          className={`chip text-[10px] font-extrabold py-0.5 ${
                            s.plan === 'PRO'
                              ? 'bg-accent text-accent-fg'
                              : 'bg-surface text-muted border-line'
                          }`}
                        >
                          {s.plan}
                        </span>
                        <Link
                          href={`/${s.slug}`}
                          target="_blank"
                          className="text-[11px] font-mono text-accent-text hover:underline inline-flex items-center gap-1"
                        >
                          /{s.slug}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <p className="text-[11px] text-muted">
                        📍 {s.location} • 📱 +{s.whatsapp} • 📦 {s.item_count} Unit • 📅{' '}
                        {s.booking_count} Booking • 💰 GMV:{' '}
                        <strong className="text-fg">{formatRp(s.gmv)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      <button
                        type="button"
                        disabled={updatingSlug === s.slug}
                        onClick={() =>
                          void handleAdminPlanChange(s, 'PRO', true, 'monthly', 30)
                        }
                        className="btn-glass px-2.5 py-1.5 text-[11px] font-bold text-accent-text"
                      >
                        PRO 30 Hr
                      </button>
                      <button
                        type="button"
                        disabled={updatingSlug === s.slug}
                        onClick={() =>
                          void handleAdminPlanChange(s, 'PRO', true, 'yearly', 365)
                        }
                        className="btn-glass px-2.5 py-1.5 text-[11px] font-bold text-accent-text"
                      >
                        PRO 1 Thn
                      </button>
                      {s.plan === 'PRO' && (
                        <button
                          type="button"
                          disabled={updatingSlug === s.slug}
                          onClick={() =>
                            void handleAdminPlanChange(s, 'FREE', s.is_verified)
                          }
                          className="btn-glass px-2.5 py-1.5 text-[11px] font-bold text-danger-text"
                        >
                          Set Starter
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={updatingSlug === s.slug}
                        onClick={() =>
                          void handleAdminPlanChange(
                            s,
                            s.plan,
                            !s.is_verified,
                            (s.billing_cycle as 'monthly' | 'yearly') || 'monthly',
                            30
                          )
                        }
                        className="btn-glass px-2.5 py-1.5 text-[11px] font-bold"
                      >
                        {s.is_verified ? 'Cabut Verified' : 'Set Verified'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Aktivitas Booking Terbaru Lintas Platform */}
            <section className="bento p-4 sm:p-6 space-y-3">
              <h2 className="font-display text-base font-extrabold text-fg">
                Aktivitas Booking Terbaru Lintas Platform
              </h2>
              {payload.recent_bookings.length === 0 ? (
                <p className="text-xs text-muted">Belum ada transaksi booking tercatat.</p>
              ) : (
                <div className="space-y-2">
                  {payload.recent_bookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="p-3 rounded-xl bg-surface-2 border border-line flex items-center justify-between gap-2 text-xs flex-wrap"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-accent-text">
                            {bk.code}
                          </span>
                          <span className="font-bold text-fg">{bk.shop_name}</span>
                          <span className="chip text-[9px] uppercase py-0.5">{bk.status}</span>
                        </div>
                        <p className="text-[11px] text-muted">
                          Penyewa: {bk.customer_name} • Sumber: {bk.source} • Bayar:{' '}
                          {bk.payment_status}
                        </p>
                      </div>
                      <span className="font-display font-extrabold text-fg">
                        {formatRp(bk.total_amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
