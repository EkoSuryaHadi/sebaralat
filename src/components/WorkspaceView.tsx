'use client';

import React from 'react';
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
  KeyRound,
} from 'lucide-react';
import { Shop, RentalItem, ActivityLog, Role, WorkspaceTab, ItemStatus } from '../types';

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
  adminSearch: string;
  setAdminSearch: (val: string) => void;
  filteredAdminItems: RentalItem[];
  onOpenAddModal: () => void;
  onOpenQrModal: (item: RentalItem | null) => void;
  onDeleteUnit: (itemId: string, itemName: string) => void;
  onStatusChange: (itemId: string, newStatus: ItemStatus) => void;
  onStockChange: (itemId: string, delta: number) => void;
  onUpdateItemField: (itemId: string, field: keyof RentalItem, value: RentalItem[keyof RentalItem]) => void;
  onSaveShopSettings: (updatedShop: Shop) => void;
  onRecordAuditLog: (actionDesc: string) => void;
  triggerToast: (msg: string) => void;
  onSwitchToOwnerLogin: () => void;
  formatRp: (num: number) => string;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  shop,
  currentRole,
  cloudSynced,
  stats,
  workspaceTab,
  setWorkspaceTab,
  shopLogs,
  adminSearch,
  setAdminSearch,
  filteredAdminItems,
  onOpenAddModal,
  onOpenQrModal,
  onDeleteUnit,
  onStatusChange,
  onStockChange,
  onUpdateItemField,
  onSaveShopSettings,
  onRecordAuditLog,
  triggerToast,
  onSwitchToOwnerLogin,
  formatRp,
}) => {
  return (
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
            onClick={() => onOpenQrModal(null)}
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

        {/* Sub-Navigasi Internal */}
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
                onClick={onSwitchToOwnerLogin}
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
                onClick={onOpenAddModal}
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
                    onClick={() => onOpenQrModal(item)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
                    title="Label QR Fisik Unit"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  {/* Hanya Owner yang bisa menghapus unit */}
                  {(currentRole === 'owner' || currentRole === 'superadmin') && (
                    <button
                      onClick={() => onDeleteUnit(item.id, item.name)}
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
                  onClick={() => onStatusChange(item.id, 'available')}
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
                  onClick={() => onStatusChange(item.id, 'rented')}
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
                  onClick={() => onStatusChange(item.id, 'maintenance')}
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
                      onClick={() => onStockChange(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-emerald-300 flex items-center justify-center text-slate-700 font-bold shadow-sm"
                    >
                      -
                    </button>
                    <span className="text-sm font-extrabold text-emerald-900 w-5 text-center">
                      {item.stock}
                    </span>
                    <button
                      onClick={() => onStockChange(item.id, 1)}
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
                        onUpdateItemField(item.id, 'availableAt', e.target.value)
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
                        onUpdateItemField(item.id, 'renterNote', e.target.value)
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

      {/* SUB-TAB 3: PENGATURAN TOKO & PIN */}
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
                  onChange={(e) => onSaveShopSettings({ ...shop, name: e.target.value })}
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
                  onChange={(e) => onSaveShopSettings({ ...shop, tagline: e.target.value })}
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
                    onChange={(e) => onSaveShopSettings({ ...shop, whatsapp: e.target.value })}
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
                    onChange={(e) => onSaveShopSettings({ ...shop, hours: e.target.value })}
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
                  onChange={(e) => onSaveShopSettings({ ...shop, location: e.target.value })}
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
                      type="password"
                      maxLength={6}
                      value={shop.ownerPin || '1234'}
                      onChange={(e) => onSaveShopSettings({ ...shop, ownerPin: e.target.value })}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      PIN Staf Gudang (Terbatas)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={shop.staffPin || '0000'}
                      onChange={(e) => onSaveShopSettings({ ...shop, staffPin: e.target.value })}
                      className="w-full text-xs font-mono font-bold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onRecordAuditLog('Memperbarui pengaturan profil & keamanan toko');
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
  );
};
