'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Link2, Loader2, PlusCircle, AlertCircle, Sparkles, Pencil } from 'lucide-react';
import { uploadItemImage } from '@/lib/imageUtils';
import { RentalItem } from '@/types';

export interface NewItemFormState {
  name: string;
  sku: string;
  category: string;
  pricePerDay: string;
  stock: number;
  spec1: string;
  spec2: string;
  spec3?: string;
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
  editingItem?: RentalItem | null;
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
  editingItem = null,
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

  if (isLimitReached && !editingItem) {
    return (
      <div className="fixed inset-0 z-50 glass-overlay flex items-center justify-center p-4">
        <div className="glass-strong animate-rise w-full max-w-sm rounded-bento p-6 space-y-4 text-center text-fg">
          <div className="w-14 h-14 rounded-2xl bg-warn-soft border border-warn/30 text-warn-text flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <span className="chip uppercase tracking-wider text-[10px] font-extrabold text-warn-text bg-warn-soft border-warn/30">
              Batas Paket Starter Tercapai (8/8 Unit)
            </span>
            <h3 className="font-display text-lg font-extrabold tracking-tight text-fg leading-snug mt-2">
              Upgrade ke Bisnis PRO untuk Tambah Unit Tanpa Batas
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Paket Starter gratis dibatasi hingga 8 unit barang di katalog. Mulai Rp 23.000/bln, nikmati unlimited katalog, multi-staf gudang, dan QR cetak fisik.
            </p>
          </div>
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenUpgradeModal?.();
              }}
              className="btn-brutal w-full px-5 py-3 text-xs"
            >
              Lihat Paket Bisnis PRO (Mulai Rp 23rb)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-glass w-full px-4 py-2.5 text-xs"
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
    <div className="fixed inset-0 z-50 glass-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="glass-strong text-fg w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-bento sm:rounded-bento p-5 sm:p-6 space-y-4 shadow-2xl animate-rise"
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h3 className="font-display text-base font-extrabold text-fg flex items-center gap-2">
            {editingItem ? (
              <>
                <Pencil className="w-4 h-4 text-accent-text" />
                <span>Edit Unit Inventaris</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-accent-text" />
                <span>Tambah Unit Inventaris</span>
              </>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-fg hover:bg-surface-2 transition cursor-pointer"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* FOTO UNIT / GAMBAR PRODUK */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-fg-soft">Foto Unit (Opsional)</label>
            <button
              type="button"
              onClick={() => setIsUrlMode(!isUrlMode)}
              className="text-[10px] font-bold text-accent-text hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Link2 className="w-3 h-3" />
              <span>{isUrlMode ? 'Upload File' : 'Gunakan URL'}</span>
            </button>
          </div>

          {form.imageUrl ? (
            /* TAMPILAN PREVIEW GAMBAR TERPILIH */
            <div className="relative rounded-2xl border border-line overflow-hidden bg-surface-2 flex items-center gap-3 p-2.5">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-3 shrink-0 border border-line relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-fg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  Foto Terpasang
                </p>
                <p className="text-[10px] text-muted truncate">
                  Siap ditampilkan pada katalog &amp; daftar aset
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] font-bold text-accent-text hover:underline cursor-pointer"
                  >
                    Ganti Foto
                  </button>
                  <span className="text-subtle">&bull;</span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-[10px] font-bold text-danger-text hover:underline flex items-center gap-0.5 cursor-pointer"
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
                className="field flex-1 text-xs py-2"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!urlInput.trim()}
                className="btn-brutal text-xs px-3 py-2 shrink-0"
              >
                Terapkan
              </button>
            </div>
          ) : (
            /* DROPZONE / FILE SELECTOR */
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className="border-2 border-dashed border-line-strong hover:border-accent bg-surface-2/60 hover:bg-accent-soft/30 rounded-2xl p-3 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1 group"
            >
              {isUploading ? (
                <div className="flex items-center gap-2 text-accent-text py-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs font-semibold">Mengompres &amp; memproses gambar...</span>
                </div>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-accent-soft text-accent-text flex items-center justify-center transition">
                    <Upload className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-fg mt-0.5">
                    Pilih Foto dari Galeri / Kamera
                  </p>
                  <p className="text-[10px] text-muted">
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
            <label className="block text-xs font-bold text-fg-soft mb-1">Nama Unit *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Proyektor Epson EB-X500"
              value={form.name}
              onChange={(e) => {
                setFormError('');
                setForm({ ...form, name: e.target.value });
              }}
              className="field text-xs py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">Kode SKU</label>
            <input
              type="text"
              placeholder="PRJ-01"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="field font-mono text-xs py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-fg-soft">Kategori *</label>
              <button
                type="button"
                onClick={handleToggleCustom}
                className="text-[10px] font-bold text-accent-text hover:underline cursor-pointer"
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
                  className="field text-xs py-2 border-accent text-accent-text"
                />
                <p className="text-[10px] text-accent-text font-medium">
                  ✦ Kategori baru akan otomatis tersimpan
                </p>
              </div>
            ) : (
              <select
                value={form.category}
                onChange={handleSelectChange}
                className="field text-xs py-2"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-surface text-fg">
                    {cat}
                  </option>
                ))}
                <option value="__NEW__" className="text-accent-text font-bold bg-surface">
                  + Tambah Kategori Baru...
                </option>
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">
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
              className="field text-xs py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">Spesifikasi Utama (Baris 1)</label>
            <input
              type="text"
              placeholder="Contoh: 3600 ANSI Lumens + HDMI"
              value={form.spec1}
              onChange={(e) => setForm({ ...form, spec1: e.target.value })}
              className="field text-xs py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">Jumlah Stok</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Math.max(0, Number(e.target.value) || 0) })}
              className="field text-xs py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">Spesifikasi Tambahan (Baris 2)</label>
            <input
              type="text"
              placeholder="Contoh: Include 2 Baterai + Tas"
              value={form.spec2}
              onChange={(e) => setForm({ ...form, spec2: e.target.value })}
              className="field text-xs py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-fg-soft mb-1">Kelengkapan (Baris 3 - Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Charger + Kabel Ekstensi"
              value={form.spec3 || ''}
              onChange={(e) => setForm({ ...form, spec3: e.target.value })}
              className="field text-xs py-2"
            />
          </div>
        </div>

        {formError && (
          <div className="bg-danger-soft border border-danger/30 rounded-2xl p-2.5 flex items-start gap-2 text-xs text-danger-text font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || submitting}
          className="btn-brutal w-full py-3 text-xs"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan ke Katalog...</span>
            </>
          ) : (
            <span>{editingItem ? 'Simpan Perubahan Unit' : 'Simpan ke Katalog'}</span>
          )}
        </button>
      </form>
    </div>
  );
};
