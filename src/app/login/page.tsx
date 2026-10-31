'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  ArrowRight,
  LogOut,
  Store,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { isSupabaseConfigured } from '@/lib/supabase';
import { DEFAULT_SHOPS } from '@/data/mockData';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectParam = searchParams.get('redirect') || '';
  const shopParam = searchParams.get('shop') || '';

  const {
    user,
    memberships,
    authLoading,
    sendEmailOtp,
    verifyEmailOtp,
    signOut,
    setDevSimulatedRole,
  } = useAuthSession(shopParam || undefined);

  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Sinkronisasi input email jika user sudah memiliki email
  useEffect(() => {
    if (user?.email && !emailInput) {
      setEmailInput(user.email);
    }
  }, [user, emailInput]);

  // Handler pengalihan aman (mencegah open redirect)
  const handleProceed = (targetPath?: string) => {
    let target = targetPath || redirectParam || '/';

    // Validasi target redirect aman (hanya path lokal yang diawali / dan bukan //)
    if (!target.startsWith('/') || target.startsWith('//')) {
      target = '/';
    }

    router.push(target);
  };

  // Auto redirect begitu user terdeteksi login dan data toko selesai dimuat
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      if (redirectParam) {
        setIsRedirecting(true);
        handleProceed(redirectParam);
      } else if (shopParam) {
        setIsRedirecting(true);
        handleProceed(`/${shopParam}?view=workspace`);
      } else if (memberships.length > 0) {
        setIsRedirecting(true);
        handleProceed(`/${memberships[0].shopSlug}?view=workspace`);
      }
    }
  }, [user, authLoading, memberships, redirectParam, shopParam]);

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
    setDevSimulatedRole(role);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('sebaraja_dev_role', role);
    }
    router.push(`/${slug}?view=workspace`);
  };

  // Tampilan transisi loading jika sedang dialihkan ke toko
  if (isRedirecting || (user && memberships.length > 0)) {
    const targetShop = shopParam || (memberships.length > 0 ? memberships[0].shopSlug : '');
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Login Berhasil!</h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Sedang mengalihkan Anda langsung ke Panel Toko{' '}
              {targetShop && <strong className="text-emerald-400 font-mono">/{targetShop}</strong>}...
            </p>
          </div>
          <p className="text-[11px] text-slate-500">
            Jika halaman tidak berpindah otomatis dalam beberapa detik,{' '}
            <button
              onClick={() => handleProceed(targetShop ? `/${targetShop}?view=workspace` : '/')}
              className="text-emerald-400 underline font-bold"
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
    <div className="w-full max-w-md mx-auto">
      {/* KARTU UTAMA LOGIN */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Glow aksen di pojok kartu */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* HEADER FORM */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Portal Pengelola Toko
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Masuk untuk mengelola katalog, inventaris barang, ketersediaan unit, dan order sewa.
          </p>
        </div>

        {/* JIKA SUDAH TERAUTENTIKASI TETAPI BELUM MEMILIKI TOKO */}
        {user && !authLoading && memberships.length === 0 ? (
          <div className="space-y-5">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-300">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <div className="text-xs">
                  <span className="text-slate-400 block text-[11px]">Anda masuk sebagai:</span>
                  <strong className="text-white font-bold">{user.email}</strong>
                </div>
              </div>

              <p className="text-xs text-slate-300 pt-1 leading-relaxed">
                Akun Anda belum terikat ke toko rental manapun. Silakan daftarkan toko rental perdana Anda sekarang.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/#daftar-toko"
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
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
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Ganti Akun / Keluar</span>
              </button>
            </div>
          </div>
        ) : (
          /* JIKA BELUM TERAUTENTIKASI (FORM EMAIL & OTP) */
          <div className="space-y-4">
            {/* BADGE JAMINAN KEAMANAN */}
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-3 text-xs text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-slate-300">
                <strong className="text-emerald-300 font-bold">Tanpa Password Rumit:</strong> Masuk
                aman cukup dengan tautan Magic Link atau kode OTP 6 digit yang dikirimkan ke email Anda.
              </div>
            </div>

            {/* NOTIFIKASI ERROR / INFO */}
            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-800/50 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="bg-teal-950/60 border border-teal-800/50 rounded-xl p-3 text-xs text-teal-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">{infoMsg}</span>
              </div>
            )}

            {/* FORM STEP 1: INPUT EMAIL */}
            {step === 'email' && (
              <form onSubmit={handleRequestOtp} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Alamat Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="owner@tokorental.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirim Tautan...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Kirim Magic Link & Kode OTP</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORM STEP 2: CEK EMAIL & VERIFIKASI */}
            {step === 'otp' && (
              <div className="space-y-4">
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Mail className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Tautan Masuk Telah Dikirim!</h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      Buka email di <strong className="text-emerald-400 font-mono">{emailInput}</strong> dan cukup klik tombol <strong className="text-white">&ldquo;Log In&rdquo;</strong> untuk masuk langsung secara otomatis.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-2">
                    {emailInput.includes('@gmail.com') ? (
                      <a
                        href="https://mail.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition inline-flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Buka Gmail</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Periksa folder Inbox atau Spam / Promosi jika belum muncul.
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 truncate max-w-50">{emailInput}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setErrorMsg('');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                  >
                    Ganti Email
                  </button>
                </div>

                {/* Alternatif Kode OTP jika ada */}
                <form onSubmit={handleVerifyOtp} className="space-y-3 pt-1">
                  <div className="text-[11px] text-slate-400 font-medium text-center">
                    Atau jika email Anda menyertakan 6 digit kode, masukkan di bawah:
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="Contoh: 123456"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs tracking-widest font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition"
                    />
                  </div>

                  {otpInput.trim().length > 0 && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
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
                  className="w-full py-2 text-center text-[11px] font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Belum terima email? Kirim ulang
                </button>
              </div>
            )}

            {/* MODE SIMULATOR DEMO (UNTUK TESTING / LOKAL) */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold">Mode Uji Coba Pratinjau:</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                  Demo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDevLogin('owner', shopParam || 'borneo-rental')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Demo Owner</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDevLogin('staff', shopParam || 'borneo-rental')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Demo Staf</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER INFORMASI & BANTUAN */}
      <div className="text-center mt-6 space-y-2">
        <p className="text-[11px] text-slate-500">
          Belum punya katalog usaha rental?{' '}
          <Link href="/#daftar-toko" className="text-emerald-400 hover:underline font-bold">
            Buat Katalog Gratis di Sini
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500 selection:text-slate-950 flex flex-col">
      {/* NAVBAR SEDERHANA */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
            <Image
              src="/logo-dark.svg"
              alt="Sebaraja"
              width={140}
              height={36}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>

          <Link
            href="/"
            className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      {/* AREA KONTEN TENGAH */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12">
        <Suspense
          fallback={
            <div className="w-full max-w-md mx-auto bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400">Memuat formulir masuk...</p>
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>
      </main>
    </div>
  );
}
