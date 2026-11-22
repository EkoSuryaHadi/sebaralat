'use client';

import React from 'react';
import { Role } from '../types';
import { Sliders, Eye, LogOut, ShieldCheck, UserCheck } from 'lucide-react';

interface RoleBarProps {
  currentRole: Role;
  shopName: string;
  shopSlug?: string;
  userEmail?: string | null;
  viewMode: 'saas_home' | 'catalog' | 'workspace';
  onToggleViewMode: () => void;
  onLogout: () => void;
  onSwitchRole?: (role: Role) => void;
}

export const RoleBar: React.FC<RoleBarProps> = ({
  currentRole,
  shopName,
  shopSlug,
  userEmail,
  viewMode,
  onToggleViewMode,
  onLogout,
  onSwitchRole,
}) => {
  if (currentRole === 'customer') return null;

  const isDemoShop = shopSlug === 'borneo-rental' || shopSlug === 'kaltim-kamera';

  return (
    <aside aria-label="Role bar" className="sticky top-0 z-40 h-11 bg-surface/95 backdrop-blur-md border-b border-line px-3 flex items-center text-fg shadow-2xs">
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
              currentRole === 'owner'
                ? 'bg-accent text-accent-fg shadow-xs'
                : 'bg-warn text-[#0c110f] shadow-xs'
            }`}
          >
            {currentRole === 'owner' ? (
              <ShieldCheck className="w-3 h-3" />
            ) : (
              <UserCheck className="w-3 h-3" />
            )}
            {currentRole === 'owner' ? 'Owner Toko' : 'Staf Gudang'}
          </span>
          <span className="text-xs font-bold text-fg truncate">{shopName}</span>
          {userEmail && (
            <span className="hidden sm:inline text-[10px] text-muted font-mono truncate">
              ({userEmail})
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isDemoShop && onSwitchRole && (
            <button
              onClick={() => onSwitchRole(currentRole === 'owner' ? 'staff' : 'owner')}
              className="text-[10px] font-bold bg-surface-2 hover:bg-surface-3 text-fg-soft px-2.5 py-1 rounded-lg border border-line-strong transition cursor-pointer"
              title="Beralih peran demo"
            >
              Ubah ke {currentRole === 'owner' ? '👷 Staf' : '👑 Owner'}
            </button>
          )}

          <button
            onClick={onToggleViewMode}
            className="text-[11px] font-bold btn-glass px-2.5 py-1 text-accent-text flex items-center gap-1"
          >
            {viewMode === 'catalog' ? (
              <>
                <Sliders className="w-3 h-3 text-accent-text" />
                <span>Panel Kerja</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 text-accent-text" />
                <span>Lihat Katalog</span>
              </>
            )}
          </button>

          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg bg-danger-soft hover:bg-danger/20 text-danger-text border border-danger/30 transition cursor-pointer"
            title="Keluar dari Akun Pengelola"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
