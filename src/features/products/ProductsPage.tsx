import React, { useState, useEffect, useRef } from "react";
import { Product } from "../../domain/entities/Product";
import {
  useProducts,
  useSetProductActive,
  useDeleteProduct,
} from "./hooks/useProducts";
import { useCategories } from "./hooks/useCategories";
import { ProductTable } from "./components/ProductTable";
import { ProductFormModal } from "./components/ProductFormModal";
import { CategoryManagerModal } from "./components/CategoryManagerModal";
import { BarcodeManagerModal } from "./components/BarcodeManagerModal";
import {
  Search,
  Plus,
  Tags,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  CheckCircle,
} from "lucide-react";

export const ProductsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: categories = [] } = useCategories();
  const {
    data: products = [],
    isLoading,
    refetch,
  } = useProducts({
    search: searchTerm,
    categoryId: selectedCategoryId,
    isActive: activeFilter,
  });

  const setProductActiveMutation = useSetProductActive();
  const deleteProductMutation = useDeleteProduct();

  const showToast = (type: "success" | "error", text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Keyboard Shortcuts: F2 for Search, F4 for New Product
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        setEditingProduct(null);
        setIsFormOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await setProductActiveMutation.mutateAsync({
        id: product.id,
        isActive: !product.isActive,
      });
      showToast(
        "success",
        `"${product.name}" ${product.isActive ? "pasife alındı" : "aktifleştirildi"}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Durum güncellenemedi.";
      showToast("error", msg);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await deleteProductMutation.mutateAsync(product.id);
      showToast("success", `"${product.name}" başarıyla silindi.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ürün silinemedi.";
      showToast("error", msg);
    }
  };

  // Compute stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-800 text-emerald-200"
              : "bg-red-950/90 border-red-800 text-red-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-blue-400" />
            <span>Ürün ve Stok Yönetimi</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ürün kartlarını tanımlayın, fiyatları ve barkodları yönetin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Management Button */}
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Tags className="w-4 h-4 text-blue-400" />
            <span>Kategoriler</span>
          </button>

          {/* New Product Button */}
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/30"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ürün [F4]</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center gap-3.5">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Toplam Ürün
            </div>
            <div className="text-xl font-bold text-white mt-0.5">{totalProducts}</div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Aktif Satışta
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {activeProducts}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center gap-3.5">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Kategori Sayısı
            </div>
            <div className="text-xl font-bold text-purple-300 mt-0.5">
              {categories.length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ürün adı, barkod veya stok kodu ara... [F2]"
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category Dropdown */}
        <div className="min-w-[200px]">
          <select
            value={selectedCategoryId ?? ""}
            onChange={(e) =>
              setSelectedCategoryId(
                e.target.value === "" ? undefined : Number(e.target.value)
              )
            }
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveFilter(undefined)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === undefined
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Tümü
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(true)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === true
                ? "bg-emerald-900/80 text-emerald-200 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Aktifler
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter(false)}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeFilter === false
                ? "bg-rose-900/80 text-rose-200 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pasifler
          </button>
        </div>
      </div>

      {/* Products Table */}
      <ProductTable
        products={products}
        isLoading={isLoading}
        onEditProduct={handleEdit}
        onManageBarcodes={(p) => setBarcodeModalProduct(p)}
        onToggleActive={handleToggleActive}
        onDeleteProduct={handleDelete}
      />

      {/* Modals */}
      {isFormOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
            refetch();
          }}
        />
      )}

      {isCategoryModalOpen && (
        <CategoryManagerModal
          onClose={() => {
            setIsCategoryModalOpen(false);
            refetch();
          }}
        />
      )}

      {barcodeModalProduct && (
        <BarcodeManagerModal
          product={
            products.find((p) => p.id === barcodeModalProduct.id) ||
            barcodeModalProduct
          }
          onClose={() => {
            setBarcodeModalProduct(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};
