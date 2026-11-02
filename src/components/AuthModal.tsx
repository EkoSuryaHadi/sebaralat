'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, Mail, KeyRound, CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Role } from '../types';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  userEmail?: string | null;
  onSendEmailOtp: (email: string) => Promise<{ error?: string }>;
  onVerifyEmailOtp: (email: string, token: string) => Promise<{ error?: string }>;
  onDevSimulateRole?: (role: Role) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  shopName,
  userEmail,
  onSendEmailOtp,
  onVerifyEmailOtp,
  onDevSimulateRole,
}) => {
  const [emailInput, setEmailInput] = useState(userEmail || '');
  const [otpInput, setOtpInput] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    try {
      const res = await onSendEmailOtp(emailInput);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setStep('otp');
        setInfoMsg(
          'Tautan masuk (Magic Link) & kode OTP telah dikirim ke email Anda. Anda dapat mengeklik tautan di email atau memasukkan kode 6 digit di bawah.'
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
      const res = await onVerifyEmailOtp(emailInput, otpInput);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setOtpInput('');
        setStep('email');
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 glass-overlay flex items-center justify-center p-4">
      <div className="glass-strong animate-rise w-full max-w-sm rounded-bento p-6 space-y-4 text-fg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent-soft text-accent-text flex items-center justify-center border border-accent/20">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold text-fg tracking-tight">
                Portal Pengelola Toko
              </h3>
              <p className="text-[11px] text-muted">{shopName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-surface-2 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-accent-soft border border-accent/30 rounded-2xl p-3 text-[11px] text-fg-soft leading-relaxed flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
          <div>
            <strong className="text-fg">Keamanan Berbasis Akun (Supabase Auth):</strong> Hak akses{' '}
            <strong className="text-fg">Owner</strong> atau <strong className="text-fg">Staf Gudang</strong> diverifikasi otomatis
            di server berdasarkan email terdaftar.
          </div>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-fg-soft mb-1">
                Alamat Email Pengelola (Owner / Staf)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="nama@usaha-rental.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="field pl-9 pr-3 text-xs"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-danger-text bg-danger-soft border border-danger/30 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-brutal w-full py-3 text-xs"
            >
              {loading ? 'Mengirim Kode...' : 'Kirim Magic Link / Kode OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            {infoMsg && (
              <div className="text-[11px] text-accent-text bg-accent-soft border border-accent/30 rounded-xl p-2.5 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent-text shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-fg-soft mb-1">
                Kode OTP Email ({emailInput})
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Masukkan kode OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="field pl-9 pr-3 text-center font-mono text-sm font-extrabold tracking-widest"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-danger-text bg-danger-soft border border-danger/30 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setErrorMsg('');
                }}
                className="btn-glass px-3 py-2 text-xs"
              >
                Ganti Email
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-brutal flex-1 py-2.5 text-xs"
              >
                {loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
              </button>
            </div>
          </form>
        )}

        {/* Mode Simulasi Lokal HANYA saat variabel env Supabase belum dikonfigurasi */}
        {!isSupabaseConfigured && onDevSimulateRole && (
          <div className="pt-3 border-t border-line space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-warn-text flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Mode Pratinjau Offline (Tanpa Koneksi Supabase)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onDevSimulateRole('staff');
                  onClose();
                }}
                className="btn-glass py-2 px-2 text-[11px] font-bold text-warn-text border-warn/30 bg-warn-soft/60"
              >
                Simulasi Staf Gudang
              </button>
              <button
                type="button"
                onClick={() => {
                  onDevSimulateRole('owner');
                  onClose();
                }}
                className="btn-glass py-2 px-2 text-[11px] font-bold text-accent-text border-accent/30 bg-accent-soft/60"
              >
                Simulasi Owner Toko
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 text-center border-t border-line">
          <Link
            href="/login"
            className="text-[11px] font-semibold text-muted hover:text-accent-text transition"
          >
            Buka Halaman Login Penuh (/login) &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
