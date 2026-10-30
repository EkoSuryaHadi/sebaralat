'use client';

import React from 'react';
import { Lock, UserCheck, ShieldCheck } from 'lucide-react';
import { Role } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  loginTargetRole: Role;
  setLoginTargetRole: (role: Role) => void;
  pinInput: string;
  setPinInput: (pin: string) => void;
  authError: string;
  onSubmit: (e: React.FormEvent) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  shopName,
  loginTargetRole,
  setLoginTargetRole,
  pinInput,
  setPinInput,
  authError,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Portal Internal Toko</h3>
              <p className="text-[11px] text-slate-500">{shopName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Pilihan Role Login */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setLoginTargetRole('staff')}
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
            onClick={() => setLoginTargetRole('owner')}
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

        <form onSubmit={onSubmit} className="space-y-3">
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
  );
};

