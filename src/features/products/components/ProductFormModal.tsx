import React, { useState, useEffect } from "react";
import { Product } from "../../../domain/entities/Product";
import { Category } from "../../../domain/entities/Category";
import { useCreateProduct, useUpdateProduct } from "../hooks/useProducts";
import { Money } from "../../../domain/value-objects/Money";
import { X, Save, Sparkles, AlertCircle, Package } from "lucide-react";

interface ProductFormModalProps {
  product?: Product | null;
  categories: Category[];
  onClose: () => void;
}

const UNIT_OPTIONS = [
  "Adet",
  "Kg",
  "Gram",
  "Paket",
  "Litre",
  "Porsiyon",
  "Kutu",
  "Şişe",
  "Koli",
];

const VAT_OPTIONS = [
  { label: "%1", value: 1.0 },
  { label: "%10", value: 10.0 },
  { label: "%20", value: 20.0 },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  categories,
  onClose,
}) => {
  const isEditing = !!product;
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  // Form states
  const [name, setName] = useState(product ? product.name : "");
  const [code, setCode] = useState(product ? product.code : "");
  const [categoryId, setCategoryId] = useState<number | string>(
    product?.categoryId ?? (categories.length > 0 ? categories[0].id : "")
  );
  const [unitName, setUnitName] = useState(product ? product.unitName : "Adet");
  const [costPriceLira, setCostPriceLira] = useState(
    product ? (product.costPrice.toKurus() / 100).toString().replace(".", ",") : "0"
  );
  const [salePriceLira, setSalePriceLira] = useState(
    product ? (product.salePrice.toKurus() / 100).toString().replace(".", ",") : ""
  );
  const [vatRate, setVatRate] = useState<number>(product ? product.vatRate : 20.0);
  const [minStockLevel, setMinStockLevel] = useState<number>(
    product ? product.minStockLevel : 5
  );
  const [trackSKT, setTrackSKT] = useState<boolean>(product ? product.trackSKT : false);
  const [isActive, setIsActive] = useState<boolean>(
    product ? product.isActive : true
  );
  const [initialBarcode, setInitialBarcode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const generateAutoCode = () => {
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    setCode(`PRD-${randomHex}`);
  };

  const parseLiraToKurus = (val: string): number => {
    if (!val) return 0;
    const normalized = val.trim().replace(",", ".");
    const num = parseFloat(normalized);
    if (isNaN(num) || num < 0) {
      throw new Error("Geçersiz fiyat formatı.");
    }
    return Money.fromLira(num).toKurus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Ürün adı boş bırakılamaz.");
      return;
    }

    let costKurus = 0;
    let saleKurus = 0;

    try {
      costKurus = parseLiraToKurus(costPriceLira);
    } catch {
      setErrorMessage("Alış fiyatı geçersiz.");
      return;
    }

    try {
      saleKurus = parseLiraToKurus(salePriceLira);
    } catch {
      setErrorMessage("Satış fiyatı geçersiz.");
      return;
    }

    if (saleKurus <= 0 && !window.confirm("Satış fiyatı 0 TL olarak kaydedilsin mi?")) {
      return;
    }

    const catIdNum = categoryId !== "" ? Number(categoryId) : null;

    try {
      if (isEditing && product) {
        await updateMutation.mutateAsync({
          id: product.id,
          code: code.trim(),
          name: trimmedName,
          categoryId: catIdNum,
          unitName,
          costPriceKurus: costKurus,
          salePriceKurus: saleKurus,
          vatRate: Number(vatRate),
          minStockLevel: Number(minStockLevel),
          trackSKT,
          isActive,
        });
      } else {
        await createMutation.mutateAsync({
          code: code.trim() || undefined,
          name: trimmedName,
          categoryId: catIdNum,
          unitName,
          costPriceKurus: costKurus,
          salePriceKurus: saleKurus,
          vatRate: Number(vatRate),
          minStockLevel: Number(minStockLevel),
          trackSKT,
          isActive,
          initialBarcode: initialBarcode.trim() || undefined,
        });
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ürün kaydedilirken bir hata oluştu.";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">
              {isEditing ? "Ürün Bilgilerini Düzenle" : "Yeni Ürün Kartı Tanımla"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Kapat (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Error Alert */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-sm text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Ürün Adı *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Coca Cola 330ml Kutu, Çikolatalı Gofret"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500 font-medium"
              autoFocus
            />
          </div>

          {/* Product Code & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Stok Kodu / SKU
                </label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={generateAutoCode}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    Otomatik Üret
                  </button>
                )}
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Örn: PRD-1002"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">(Kategorisiz)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial Barcode (Only on creation) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                İlk Barkod (Opsiyonel)
              </label>
              <input
                type="text"
                value={initialBarcode}
                onChange={(e) => setInitialBarcode(e.target.value)}
                placeholder="Örn: 8690504032123 (Barkod okutabilirsiniz)"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500 font-mono"
              />
            </div>
          )}

          {/* Prices & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Alış Fiyatı (₺)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={costPriceLira}
                  onChange={(e) => setCostPriceLira(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500 font-mono pr-8"
                />
                <span className="absolute right-3 top-2 text-slate-400 text-sm">₺</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
                Satış Fiyatı (₺) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={salePriceLira}
                  onChange={(e) => setSalePriceLira(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-emerald-600/70 rounded-lg text-sm text-emerald-200 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-500 font-mono pr-8"
                />
                <span className="absolute right-3 top-2 text-emerald-400 text-sm">₺</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Birim
              </label>
              <select
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* VAT & Min Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                KDV Oranı
              </label>
              <div className="flex gap-2">
                {VAT_OPTIONS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVatRate(v.value)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      vatRate === v.value
                        ? "bg-blue-600 border-blue-500 text-white shadow"
                        : "bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Kritik / Min. Stok
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Checkboxes: SKT & IsActive */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={trackSKT}
                onChange={(e) => setTrackSKT(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-xs text-slate-300 font-medium">
                Son Kullanma Tarihi (SKT) takibi yapılsın
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className="text-xs text-slate-300 font-medium">
                Ürün Satışta ve Aktif
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-900/30"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? "Değişiklikleri Kaydet" : "Ürünü Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
