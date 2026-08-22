import React, { useState } from "react";
import { Category } from "../../../domain/entities/Category";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../hooks/useCategories";
import { X, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Tag } from "lucide-react";

interface CategoryManagerModalProps {
  onClose: () => void;
}

const COLOR_PRESETS = [
  { label: "Mavi", value: "#3B82F6" },
  { label: "Yeşil", value: "#10B981" },
  { label: "Kırmızı", value: "#EF4444" },
  { label: "Turuncu", value: "#F59E0B" },
  { label: "Mor", value: "#8B5CF6" },
  { label: "Gri", value: "#64748B" },
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  onClose,
}) => {
  const { data: categories = [], isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(1);
  const [colorCode, setColorCode] = useState("#3B82F6");
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

  const resetForm = () => {
    setEditingCategory(null);
    setName("");
    setSortOrder(categories.length + 1);
    setColorCode("#3B82F6");
    setErrorMessage(null);
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setSortOrder(category.sortOrder);
    setColorCode(category.colorCode);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage("Kategori adı boş bırakılamaz.");
      return;
    }

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          name: trimmed,
          sortOrder: Number(sortOrder),
          colorCode,
          isActive: true,
        });
        setSuccessMessage("Kategori başarıyla güncellendi.");
      } else {
        await createMutation.mutateAsync({
          name: trimmed,
          sortOrder: Number(sortOrder),
          colorCode,
        });
        setSuccessMessage("Yeni kategori başarıyla oluşturuldu.");
      }
      resetForm();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kategori işlemi sırasında bir hata oluştu.";
      setErrorMessage(msg);
    }
  };

  const handleDelete = async (category: Category) => {
    if (category.productCount && category.productCount > 0) {
      setErrorMessage(
        `"${category.name}" kategorisine bağlı ${category.productCount} ürün bulunmaktadır. Silmeden önce ürünlerin kategorisini değiştirin.`
      );
      return;
    }

    if (!window.confirm(`"${category.name}" kategorisini silmek istediğinize emin misiniz?`)) {
      return;
    }

    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(category.id);
      setSuccessMessage("Kategori silindi.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kategori silinirken hata oluştu.";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Kategori Yönetimi</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Alerts */}
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

          {/* Form (Add or Edit) */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {editingCategory ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
              </h3>
              {editingCategory && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Vazgeç / Yeni Ekle
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kategori Adı *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: İçecekler, Tost & Sandviç"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Sıra No
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Renk Seçimi
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setColorCode(preset.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                      colorCode === preset.value
                        ? "border-white bg-slate-700 text-white ring-2 ring-blue-500"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: preset.value }}
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {editingCategory && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                >
                  İptal
                </button>
              )}
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || !name.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {editingCategory ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editingCategory ? "Değişiklikleri Kaydet" : "Kategori Ekle"}</span>
              </button>
            </div>
          </form>

          {/* Categories List */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Mevcut Kategoriler ({categories.length})
            </h3>

            {isLoading ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Kategoriler yükleniyor...
              </div>
            ) : categories.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800/60">
                Henüz kayıtlı kategori bulunmuyor.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.colorCode }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">
                            {cat.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                            {cat.productCount ?? 0} Ürün
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          Sıra: {cat.sortOrder}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded transition-colors"
                        title="Kategoriyi Sil"
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
