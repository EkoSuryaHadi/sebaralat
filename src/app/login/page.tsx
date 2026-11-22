'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isDemoShopSlug } from '@/lib/validators';
import { ThemeToggle } from '@/components/ThemeToggle';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams.get('redirect') || '';
  const shopParam = searchParams.get('shop') || '';
  const isAdminRedirect = redirectParam === '/admin' || redirectParam.startsWith('/admin?');

  const {
    user,
    memberships,
    authLoading,
    sendEmailOtp,
    verifyEmailOtp,
    signOut,
    setDevSimulatedRole,
  } = useAuthSession(shopParam || undefined);

  const [customEmailInput, setEmailInput] = useState<string | null>(null);
  const emailInput = customEmailInput !== null ? customEmailInput : user?.email || '';
  const [otpInput, setOtpInput] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Handler pengalihan aman (mencegah open redirect)
  const handleProceed = useCallback(
    (targetPath?: string) => {
      let target = targetPath || redirectParam || '/';

      // Validasi target redirect aman (hanya path lokal yang diawali / dan bukan //)
      if (!target.startsWith('/') || target.startsWith('//')) {
        target = '/';
      }

      router.push(target);
    },
    [redirectParam, router]
  );

  // Auto redirect begitu user terdeteksi login dan data toko selesai dimuat
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      if (redirectParam) {
        handleProceed(redirectParam);
      } else if (shopParam) {
        handleProceed(`/${shopParam}?view=workspace`);
      } else if (memberships.length > 0) {
        handleProceed(`/${memberships[0].shopSlug}?view=workspace`);
      }
    }
  }, [user, authLoading, memberships, redirectParam, shopParam, handleProceed]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    try {
      // Path callback saat magic link diklik di email
      const callbackPath = redirectParam || (shopParam ? `/${shopParam}?view=workspace` : '/login');
      const res = await sendEmailOtp(emailInput, callbackPath);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setStep('otp');
        setInfoMsg(
          'Tautan masuk (Magic Link) & 6 digit kode OTP telah dikirim ke email Anda. Cek inbox atau folder spam.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await verifyEmailOtp(emailInput, otpInput);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsRedirecting(true);
        // Berhasil login: langsung arahkan ke workspace toko
        if (redirectParam) {
          handleProceed(redirectParam);
        } else if (shopParam) {
          handleProceed(`/${shopParam}?view=workspace`);
        } else if (res.memberships && res.memberships.length > 0) {
          handleProceed(`/${res.memberships[0].shopSlug}?view=workspace`);
        } else {
          // Jika belum punya toko terdaftar
          handleProceed('/#daftar-toko');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = (role: 'owner' | 'staff', slug = 'borneo-rental') => {
    const safeDemoSlug = isDemoShopSlug(slug) ? slug : 'borneo-rental';
    setDevSimulatedRole(role);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('sebaraja_dev_role', role);
    }
    router.push(`/${safeDemoSlug}?view=workspace`);
  };

  // Tampilan transisi loading jika sedang dialihkan ke tujuan
  if (isRedirecting || (user && (memberships.length > 0 || isAdminRedirect))) {
    const targetShop = shopParam || (memberships.length > 0 ? memberships[0].shopSlug : '');
    const fallbackTarget = isAdminRedirect
      ? redirectParam || '/admin'
      : targetShop
        ? `/${targetShop}?view=workspace`
        : '/';
    return (
      <div className="w-full max-w-md mx-auto animate-rise">
        <div className="glass-strong rounded-bento p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-soft border border-accent/30 text-accent-text">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-fg">Login Berhasil!</h2>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              {isAdminRedirect ? (
                <>
                  Sedang mengalihkan Anda ke <strong className="text-accent-text font-mono">Super Admin Analytics (/admin)</strong>...
                </>
              ) : (
                <>
                  Sedang mengalihkan Anda langsung ke Panel Toko{' '}
                  {targetShop && <strong className="text-accent-text font-mono">/{targetShop}</strong>}...
                </>
              )}
            </p>
          </div>
          <p className="text-[11px] text-subtle">
            Jika halaman tidak berpindah otomatis dalam beberapa detik,{' '}
            <button
              onClick={() => handleProceed(fallbackTarget)}
              className="text-accent-text underline font-bold cursor-pointer"
            >
              klik di sini
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto animate-rise" style={{ animationDelay: '80ms' }}>
      {/* KARTU UTAMA LOGIN */}
      <div className="glass-strong rounded-bento p-6 sm:p-8 relative overflow-hidden">
        {/* Glow aksen di pojok kartu */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-accent-soft rounded-full blur-2xl pointer-events-none" />

        {/* HEADER FORM */}
        <div className="relative space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-soft border border-accent/30 text-accent-text mb-2">
            {isAdminRedirect ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
            {isAdminRedirect ? 'Portal Super Admin' : 'Portal Pengelola Toko'}
          </h1>
          <p className="text-xs text-muted max-w-xs leading-relaxed">
            {isAdminRedirect
              ? 'Masuk dengan akun email Super Admin Sebaraja untuk mengakses analitik seluruh platform.'
              : 'Masuk untuk mengelola katalog, inventaris barang, ketersediaan unit, dan order sewa.'}
          </p>
        </div>

        {/* JIKA SUDAH TERAUTENTIKASI TETAPI BELUM MEMILIKI TOKO */}
        {user && !authLoading && memberships.length === 0 ? (
          <div className="relative space-y-5">
            <div className="bg-accent-soft border border-accent/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2.5 text-accent-text">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-accent-text" />
                <div className="text-xs">
                  <span className="text-muted block text-[11px]">Anda masuk sebagai:</span>
                  <strong className="text-fg font-bold">{user.email}</strong>
                </div>
              </div>

              <p className="text-xs text-fg-soft pt-1 leading-relaxed">
                Akun Anda belum terikat ke toko rental manapun. Silakan daftarkan toko rental perdana Anda sekarang.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/#daftar-toko"
                className="btn-brutal w-full py-3 px-4 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Daftarkan Toko Rental Baru</span>
              </Link>

              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  setStep('email');
                  setOtpInput('');
                  setInfoMsg('');
                }}
                className="btn-glass w-full py-2.5 px-4 text-xs"
              >
                <LogOut className="w-4 h-4 text-danger-text" />
                <span>Ganti Akun / Keluar</span>
              </button>
            </div>
          </div>
        ) : (
          /* JIKA BELUM TERAUTENTIKASI (FORM EMAIL & OTP) */
          <div className="relative space-y-4">
            {/* BADGE JAMINAN KEAMANAN */}
            <div className="bg-accent-soft border border-accent/25 rounded-2xl p-3 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-fg-soft">
                <strong className="text-accent-text font-bold">Tanpa Password Rumit:</strong> Masuk
                aman cukup dengan tautan Magic Link atau kode OTP 6 digit yang dikirimkan ke email Anda.
              </div>
            </div>

            {/* NOTIFIKASI ERROR / INFO */}
            {errorMsg && (
              <div className="bg-danger-soft border border-danger/30 rounded-xl p-3 text-xs text-danger-text flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-danger-text shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="bg-accent-soft border border-accent/30 rounded-xl p-3 text-xs text-accent-text flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">{infoMsg}</span>
              </div>
            )}

            {/* FORM STEP 1: INPUT EMAIL */}
            {step === 'email' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-fg-soft mb-1.5">
                    Alamat Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder={isAdminRedirect ? 'admin@sebaraja.my.id' : 'owner@tokorental.com'}
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="field pl-10!"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-brutal w-full py-3 px-4 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirim Tautan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Kirim Magic Link &amp; Kode OTP</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORM STEP 2: CEK EMAIL & VERIFIKASI */}
            {step === 'otp' && (
              <div className="space-y-4">
                <div className="bg-surface-2 border border-line rounded-2xl p-4 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-accent-soft border border-accent/30 flex items-center justify-center text-accent-text">
                    <Mail className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-fg">Tautan Masuk Telah Dikirim!</h3>
                    <p className="text-xs text-muted mt-1.5 leading-relaxed">
                      Buka email di <strong className="text-accent-text font-mono">{emailInput}</strong> dan cukup klik tombol <strong className="text-fg">&ldquo;Log In&rdquo;</strong> untuk masuk langsung secara otomatis.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-2">
                    {emailInput.includes('@gmail.com') ? (
                      <a
                        href="https://mail.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-glass py-2 px-3.5 text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-accent-text" />
                        <span>Buka Gmail</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-muted italic">
                        Periksa folder Inbox atau Spam / Promosi jika belum muncul.
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-surface-2 border border-line rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-muted truncate max-w-50">{emailInput}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setErrorMsg('');
                    }}
                    className="text-accent-text hover:opacity-80 font-bold underline cursor-pointer"
                  >
                    Ganti Email
                  </button>
                </div>

                {/* Alternatif Kode OTP jika ada */}
                <form onSubmit={handleVerifyOtp} className="space-y-3 pt-1">
                  <div className="text-[11px] text-muted font-medium text-center">
                    Atau jika email Anda menyertakan 6 digit kode, masukkan di bawah:
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="Contoh: 123456"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="field pl-10! text-center tracking-widest font-mono font-bold text-accent-text!"
                    />
                  </div>

                  {otpInput.trim().length > 0 && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-brutal w-full py-3 px-4 text-sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memverifikasi...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verifikasi Kode OTP</span>
                        </>
                      )}
                    </button>
                  )}
                </form>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="w-full py-2 text-center text-[11px] font-bold text-muted hover:text-fg transition cursor-pointer disabled:opacity-50"
                >
                  Belum terima email? Kirim ulang
                </button>
              </div>
            )}

            {/* MODE SIMULATOR DEMO (HANYA UNTUK TOKO DEMO SHOWCASE ATAU TANPA SUPABASE, BUKAN SUPER ADMIN) */}
            {!isAdminRedirect && (!isSupabaseConfigured || !shopParam || isDemoShopSlug(shopParam)) && (
              <div className="pt-4 border-t border-line space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-muted font-semibold">
                    Mode Uji Coba Toko Demo (/borneo-rental):
                  </span>
                  <span className="chip font-mono text-[10px]!">
                    Sandbox
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDevLogin('owner', shopParam || 'borneo-rental')}
                    className="btn-glass py-2.5 px-3 text-[11px]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-warn-text" />
                    <span>Demo Owner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDevLogin('staff', shopParam || 'borneo-rental')}
                    className="btn-glass py-2.5 px-3 text-[11px]"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-info-text" />
                    <span>Demo Staf</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER INFORMASI & BANTUAN */}
      {!isAdminRedirect && (
        <div className="text-center mt-6 space-y-2">
          <p className="text-[11px] text-muted">
            Belum punya katalog usaha rental?{' '}
            <Link href="/#daftar-toko" className="text-accent-text hover:underline font-bold">
              Buat Katalog Gratis di Sini
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-bg aurora text-fg flex flex-col overflow-hidden">
      {/* NAVBAR SEDERHANA */}
      <header className="sticky top-0 z-20 px-3 sm:px-6 pt-3">
        <div className="glass max-w-6xl mx-auto rounded-2xl px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <Image
              src="/logo.svg"
              alt="Sebaraja"
              width={140}
              height={36}
              className="h-7 sm:h-8 w-auto object-contain dark:hidden"
              priority
            />
            <Image
              src="/logo-dark.svg"
              alt="Sebaraja"
              width={140}
              height={36}
              className="h-7 sm:h-8 w-auto object-contain hidden dark:block"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="btn-glass px-3 py-2 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kembali ke Beranda</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* AREA KONTEN: SPLIT LAYOUT */}
      <main className="flex-1 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center px-4 sm:px-6 py-10 lg:py-14">
        {/* PANEL BRAND (KIRI) */}
        <section className="relative hidden lg:block">
          <div className="grid-lines absolute -inset-10 pointer-events-none" aria-hidden="true" />
          <div className="relative space-y-6 animate-rise">
            <span className="chip">
              <Sparkles className="w-3.5 h-3.5 text-accent-text" />
              Panel Pengelola Sebaraja
            </span>
            <h2 className="font-display font-extrabold tracking-tight text-5xl xl:text-6xl leading-[1.02] text-fg">
              Kelola rental Anda, <span className="text-gradient">tanpa ribet.</span>
            </h2>
            <p className="text-sm text-muted max-w-md leading-relaxed">
              Katalog online, stok real-time, dan order sewa via WhatsApp — semua dalam satu panel.
            </p>

            <div className="grid grid-cols-6 gap-3 max-w-lg">
              <div className="bento col-span-4 p-5 space-y-2">
                <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent-text flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="font-display text-base font-bold text-fg">Login tanpa password</p>
                <p className="text-xs text-muted leading-relaxed">Magic Link atau OTP 6 digit langsung ke email.</p>
              </div>
              <div className="bento col-span-2 p-5 flex flex-col justify-between bg-pop! border-ink/20">
                <Sparkles className="w-5 h-5 text-[#0c110f]" />
                <p className="font-display text-2xl font-extrabold text-[#0c110f] leading-none">
                  Real-time
                </p>
              </div>
              <div className="bento col-span-2 p-5 space-y-2">
                <UserCheck className="w-5 h-5 text-info-text" />
                <p className="text-xs font-bold text-fg">Owner &amp; Staf</p>
              </div>
              <div className="bento col-span-4 p-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-2 text-accent-text flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Hak akses diverifikasi otomatis berdasarkan email terdaftar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KARTU AUTENTIKASI (KANAN) */}
        <section className="w-full">
          <Suspense
            fallback={
              <div className="w-full max-w-md mx-auto glass-strong rounded-bento p-8 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-6 h-6 text-accent-text animate-spin" />
                <p className="text-xs text-muted">Memuat formulir masuk...</p>
              </div>
            }
          >
            <LoginFormContent />
          </Suspense>
        </section>
      </main>
    </div>
  );
}
