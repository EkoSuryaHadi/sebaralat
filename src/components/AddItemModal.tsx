'use client';

import React from 'react';

export interface NewItemFormState {
  name: string;
  sku: string;
  category: string;
  pricePerDay: string;
  stock: number;
  spec1: string;
  spec2: string;
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: NewItemFormState;
  setForm: React.Dispatch<React.SetStateAction<NewItemFormState>>;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-base font-extrabold text-slate-900">+ Tambah Unit Inventaris</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700"
          >
            Batal ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Unit *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Proyektor Epson EB-X500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kode SKU</label>
            <input
              type="text"
              placeholder="PRJ-01"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="w-full text-xs font-mono border border-slate-300 rounded-xl px-3 py-2.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 bg-white"
            >
              <option value="Camping">Camping</option>
              <option value="Alat Teknik/Proyek">Alat Teknik/Proyek</option>
              <option value="Kamera & Audio">Kamera & Audio</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tarif Sewa / Hari (Rp) *
            </label>
            <input
              type="number"
              required
              placeholder="100000"
              value={form.pricePerDay}
              onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Spesifikasi Utama</label>
            <input
              type="text"
              placeholder="Contoh: 3600 ANSI Lumens + HDMI"
              value={form.spec1}
              onChange={(e) => setForm({ ...form, spec1: e.target.value })}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Stok</label>
            <input
              type="number"
              min="1"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) || 1 })}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition"
        >
          Simpan ke Katalog
        </button>
      </form>
    </div>
  );
};

