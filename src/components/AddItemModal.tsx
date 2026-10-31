'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Link2, Loader2, PlusCircle, AlertCircle, Sparkles } from 'lucide-react';
import { uploadItemImage } from '@/lib/imageUtils';

export interface NewItemFormState {
  name: string;
  sku: string;
  category: string;
  pricePerDay: string;
  stock: number;
  spec1: string;
  spec2: string;
  imageUrl?: string;
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: NewItemFormState;
  setForm: React.Dispatch<React.SetStateAction<NewItemFormState>>;
  onSubmit: (formData: NewItemFormState) => Promise<void> | void;
  categories?: string[];
  shopSlug?: string;
  isLimitReached?: boolean;
  onOpenUpgradeModal?: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
  categories = ['Camping', 'Alat Teknik/Proyek', 'Kamera & Audio'],
  shopSlug = 'general',
  isLimitReached = false,
  onOpenUpgradeModal,
}) => {
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  if (isLimitReached) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Batas Paket Starter Tercapai (8/8 Unit)
            </span>
            <h3 className="text-base font-black text-slate-900 mt-2">
              Upgrade ke Bisnis PRO untuk Tambah Unit Tanpa Batas
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Paket Starter gratis dibatasi hingga 8 unit barang di katalog. Mulai Rp 23.000/bln, nikmati unlimited katalog, multi-staf gudang, dan QR cetak fisik.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenUpgradeModal?.();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              Lihat Paket Bisnis PRO (Mulai Rp 23rb)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleCustom = () => {
    setFormError('');
    if (isCustomCategory) {
      setIsCustomCategory(false);
      const defaultCat = categories[0] || 'Camping';
      setCustomCategoryInput('');
      setForm((prev) => ({ ...prev, category: defaultCat }));
    } else {
      setIsCustomCategory(true);
      setCustomCategoryInput('');
      setForm((prev) => ({ ...prev, category: '' }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormError('');
    const val = e.target.value;
    if (val === '__NEW__') {
      setIsCustomCategory(true);
      setCustomCategoryInput('');
      setForm((prev) => ({ ...prev, category: '' }));
    } else {
      setForm((prev) => ({ ...prev, category: val }));
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError('');
    const val = e.target.value;
    setCustomCategoryInput(val);
    setForm((prev) => ({ ...prev, category: val }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setFormError('');
      const uploadedUrl = await uploadItemImage(file, shopSlug);
      setForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal memproses gambar.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    setUrlInput('');
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setForm((prev) => ({ ...prev, imageUrl: urlInput.trim() }));
      setIsUrlMode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    let finalCategory = form.category?.trim();
    if (isCustomCategory) {
      finalCategory = customCategoryInput.trim();
      if (!finalCategory) {
        setFormError('Nama kategori baru tidak boleh kosong.');
        return;
      }
    }

    if (!finalCategory) {
      finalCategory = categories[0] || 'Camping';
    }

    const payload: NewItemFormState = {
      ...form,
      category: finalCategory,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan unit ke katalog.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>Tambah Unit Inventaris</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1"
          >
            Batal ✕
          </button>
        </div>

        {/* FOTO UNIT / GAMBAR PRODUK */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">Foto Unit (Opsional)</label>
            <button
              type="button"
              onClick={() => setIsUrlMode(!isUrlMode)}
              className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <Link2 className="w-3 h-3" />
              <span>{isUrlMode ? 'Upload File' : 'Gunakan URL'}</span>
            </button>
          </div>

          {form.imageUrl ? (
            /* TAMPILAN PREVIEW GAMBAR TERPILIH */
            <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center gap-3 p-2.5">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Foto Terpasang
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  Siap ditampilkan pada katalog & daftar aset
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Ganti Foto
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Hapus
                  </button>
                </div>
              </div>
            </div>
          ) : isUrlMode ? (
            /* INPUT LINK URL GAMBAR */
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                placeholder="https://contoh.com/foto-unit.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!urlInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          ) : (
            /* DROPZONE / FILE SELECTOR */
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/70 hover:bg-emerald-50/20 rounded-2xl p-3 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1 group"
            >
              {isUploading ? (
                <div className="flex items-center gap-2 text-emerald-600 py-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-semibold">Mengompres & memproses gambar...</span>
                </div>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-emerald-100/80 group-hover:bg-emerald-200 text-emerald-700 flex items-center justify-center transition">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    Pilih Foto dari Galeri / Kamera
                  </p>
                  <p className="text-[10px] text-slate-400">
                    JPG, PNG, WebP (Otomatis dikompres ringan)
                  </p>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Unit *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Proyektor Epson EB-X500"
              value={form.name}
              onChange={(e) => {
                setFormError('');
                setForm({ ...form, name: e.target.value });
              }}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kode SKU</label>
            <input
              type="text"
              placeholder="PRJ-01"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="w-full text-xs font-mono border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Kategori *</label>
              <button
                type="button"
                onClick={handleToggleCustom}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
              >
                {isCustomCategory ? '← Pilih dari list' : '+ Kategori Baru'}
              </button>
            </div>

            {isCustomCategory ? (
              <div className="space-y-1">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ketik kategori baru..."
                  value={customCategoryInput}
                  onChange={handleCustomInputChange}
                  className="w-full text-xs border-2 border-emerald-500 bg-emerald-50/20 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400 font-semibold text-slate-800"
                />
                <p className="text-[10px] text-emerald-700 font-medium">
                  ✦ Kategori baru akan otomatis tersimpan
                </p>
              </div>
            ) : (
              <select
                value={form.category}
                onChange={handleSelectChange}
                className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__NEW__" className="text-emerald-700 font-bold">
                  + Tambah Kategori Baru...
                </option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tarif Sewa / Hari (Rp) *
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="Contoh: 100000"
              value={form.pricePerDay}
              onChange={(e) => {
                setFormError('');
                setForm({ ...form, pricePerDay: e.target.value });
              }}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Stok</label>
            <input
              type="number"
              min="1"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) || 1 })}
              className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {formError && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 flex items-start gap-2 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || submitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan ke Katalog...</span>
            </>
          ) : (
            <span>Simpan ke Katalog</span>
          )}
        </button>
      </form>
    </div>
  );
};
