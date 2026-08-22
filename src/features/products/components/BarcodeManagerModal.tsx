import React, { useState } from "react";
import { Product, type IProductBarcode } from "../../../domain/entities/Product";
import {
  useAddBarcode,
  useRemoveBarcode,
  useSetPrimaryBarcode,
} from "../hooks/useProducts";
import { Barcode as BarcodeVO } from "../../../domain/value-objects/Barcode";
import { X, Plus, Trash2, CheckCircle2, Star, AlertCircle } from "lucide-react";

interface BarcodeManagerModalProps {
  product: Product;
  onClose: () => void;
}

export const BarcodeManagerModal: React.FC<BarcodeManagerModalProps> = ({
  product,
  onClose,
}) => {
  const [newBarcode, setNewBarcode] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const addBarcodeMutation = useAddBarcode();
  const removeBarcodeMutation = useRemoveBarcode();
  const setPrimaryMutation = useSetPrimaryBarcode();

  const handleAddBarcode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Validate with Barcode Value Object
      const barcodeVO = new BarcodeVO(newBarcode);
      await addBarcodeMutation.mutateAsync({
        productId: product.id,
        barcode: barcodeVO.getValue(),
        isPrimary,
      });

      setNewBarcode("");
      setIsPrimary(false);
      setSuccessMessage("Barkod başarıyla eklendi.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Barkod eklenirken bir hata oluştu.";
      setErrorMessage(msg);
    }
  };

  const handleSetPrimary = async (barcode: IProductBarcode) => {
    setErrorMessage(null);
    try {
      await setPrimaryMutation.mutateAsync({
        productId: product.id,
        barcodeId: barcode.id,
      });
      setSuccessMessage("Birincil barkod güncellendi.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Birincil barkod ayarlanırken hata oluştu.";
      setErrorMessage(msg);
    }
  };

  const handleRemove = async (barcodeId: number) => {
    if (!window.confirm("Bu barkodu silmek istediğinize emin misiniz?")) {
      return;
    }
    setErrorMessage(null);
    try {
      await removeBarcodeMutation.mutateAsync(barcodeId);
      setSuccessMessage("Barkod silindi.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Barkod silinirken hata oluştu.";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Barkod Yönetimi</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {product.name} ({product.code})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-sm text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-sm text-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Add Barcode Form */}
          <form
            onSubmit={handleAddBarcode}
            className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-lg space-y-3"
          >
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Yeni Barkod Ekle
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                placeholder="Örn: 869000000001"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={addBarcodeMutation.isPending || !newBarcode.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Ekle</span>
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span>Birincil barkod olarak kaydet</span>
            </label>
          </form>

          {/* Barcode List */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Mevcut Barkodlar ({product.barcodes.length})
            </h3>
            {product.barcodes.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800/60">
                Bu ürüne kayıtlı barkod bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2">
                {product.barcodes.map((barcode) => (
                  <div
                    key={barcode.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      barcode.isPrimary
                        ? "bg-blue-950/30 border-blue-800/80 text-blue-100"
                        : "bg-slate-800/40 border-slate-700/60 text-slate-200 hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold tracking-wider">
                        {barcode.barcode}
                      </span>
                      {barcode.isPrimary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600/30 text-blue-300 border border-blue-500/40">
                          <Star className="w-3 h-3 fill-blue-400 text-blue-400" />
                          Birincil
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!barcode.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(barcode)}
                          disabled={setPrimaryMutation.isPending}
                          className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
                        >
                          Birincil Yap
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(barcode.id)}
                        disabled={removeBarcodeMutation.isPending}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded transition-colors"
                        title="Barkodu Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
