'use client';

import React from 'react';
import { Role } from '../types';
import { Sliders, Eye, LogOut, ShieldCheck, UserCheck } from 'lucide-react';

interface RoleBarProps {
  currentRole: Role;
  shopName: string;
  userEmail?: string | null;
  viewMode: 'saas_home' | 'catalog' | 'workspace';
  onToggleViewMode: () => void;
  onLogout: () => void;
}

export const RoleBar: React.FC<RoleBarProps> = ({
  currentRole,
  shopName,
  userEmail,
  viewMode,
  onToggleViewMode,
  onLogout,
}) => {
  if (currentRole === 'customer') return null;

  return (
    <div className="sticky top-0 z-40 bg-slate-950 text-white border-b border-slate-800 px-3 py-2 shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
              currentRole === 'owner'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-amber-400 text-slate-950'
            }`}
          >
            {currentRole === 'owner' ? (
              <ShieldCheck className="w-3 h-3" />
            ) : (
              <UserCheck className="w-3 h-3" />
            )}
            {currentRole === 'owner' ? 'Owner Toko' : 'Staf Gudang'}
          </span>
          <span className="text-xs font-bold text-slate-200 truncate">{shopName}</span>
          {userEmail && (
            <span className="hidden sm:inline text-[10px] text-slate-400 font-mono truncate">
              ({userEmail})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleViewMode}
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
            onClick={onLogout}
            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition"
            title="Keluar dari Akun Pengelola"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
