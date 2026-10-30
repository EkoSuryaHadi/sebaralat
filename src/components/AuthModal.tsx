'use client';

import React, { useState } from 'react';
import { Lock, Mail, KeyRound, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Portal Pengelola Toko
              </h3>
              <p className="text-[11px] text-slate-500">{shopName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-950 leading-relaxed flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong>Keamanan Berbasis Akun (Supabase Auth):</strong> Hak akses{' '}
            <strong>Owner</strong> atau <strong>Staf Gudang</strong> diverifikasi otomatis
            di server berdasarkan email terdaftar.
          </div>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Email Pengelola (Owner / Staf)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="nama@usaha-rental.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-md transition"
            >
              {loading ? 'Mengirim Kode...' : 'Kirim Magic Link / Kode OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            {infoMsg && (
              <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kode OTP Email ({emailInput})
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Masukkan kode OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-center font-mono text-sm font-extrabold tracking-widest border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
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
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Ganti Email
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition"
              >
                {loading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
              </button>
            </div>
          </form>
        )}

        {/* Mode Simulasi Lokal HANYA saat variabel env Supabase belum dikonfigurasi */}
        {!isSupabaseConfigured && onDevSimulateRole && (
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
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
                className="py-2 px-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-900"
              >
                Simulasi Staf Gudang
              </button>
              <button
                type="button"
                onClick={() => {
                  onDevSimulateRole('owner');
                  onClose();
                }}
                className="py-2 px-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-bold text-emerald-900"
              >
                Simulasi Owner Toko
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
