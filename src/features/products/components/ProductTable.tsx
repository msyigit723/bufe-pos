import React from "react";
import { Product } from "../../../domain/entities/Product";
import {
  Edit2,
  Barcode as BarcodeIcon,
  Trash2,
  Power,
  Package,
  Layers,
} from "lucide-react";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onEditProduct: (product: Product) => void;
  onManageBarcodes: (product: Product) => void;
  onToggleActive: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading,
  onEditProduct,
  onManageBarcodes,
  onToggleActive,
  onDeleteProduct,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-medium">Ürünler yükleniyor...</span>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
        <Package className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-300 mb-1">
          Kayıtlı ürün bulunamadı
        </h3>
        <p className="text-xs text-slate-500 max-w-sm text-center">
          Arama kriterlerinize uygun ürün yok veya henüz sisteme ürün eklenmedi.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800 tracking-wider">
          <tr>
            <th scope="col" className="px-4 py-3.5">
              Stok Kodu
            </th>
            <th scope="col" className="px-4 py-3.5">
              Ürün Adı
            </th>
            <th scope="col" className="px-4 py-3.5">
              Kategori
            </th>
            <th scope="col" className="px-4 py-3.5">
              Barkod
            </th>
            <th scope="col" className="px-4 py-3.5 text-right">
              Alış Fiyatı
            </th>
            <th scope="col" className="px-4 py-3.5 text-right">
              Satış Fiyatı
            </th>
            <th scope="col" className="px-4 py-3.5 text-center">
              KDV
            </th>
            <th scope="col" className="px-4 py-3.5 text-center">
              Durum
            </th>
            <th scope="col" className="px-4 py-3.5 text-center">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {products.map((product) => {
            const primaryBarcode = product.primaryBarcode;
            const extraBarcodesCount = product.barcodes.length > 1 ? product.barcodes.length - 1 : 0;

            return (
              <tr
                key={product.id}
                className={`hover:bg-slate-800/40 transition-colors ${
                  !product.isActive ? "opacity-60 bg-slate-950/30" : ""
                }`}
              >
                {/* SKU / Code */}
                <td className="px-4 py-3 font-mono text-xs text-slate-400 font-medium">
                  {product.code}
                </td>

                {/* Name */}
                <td className="px-4 py-3">
                  <div className="font-semibold text-white">{product.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Birim: {product.unitName}</span>
                    {product.trackSKT && (
                      <span className="text-amber-400/90 text-[11px] font-medium">
                        • SKT Takip Ediliyor
                      </span>
                    )}
                  </div>
                </td>

                {/* Category */}
                <td className="px-4 py-3">
                  {product.categoryName ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-200 border border-slate-700/60">
                      <Layers className="w-3 h-3 text-blue-400" />
                      {product.categoryName}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Kategorisiz</span>
                  )}
                </td>

                {/* Barcodes */}
                <td className="px-4 py-3">
                  {primaryBarcode ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {primaryBarcode}
                      </span>
                      {extraBarcodesCount > 0 && (
                        <span
                          onClick={() => onManageBarcodes(product)}
                          className="cursor-pointer text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/70 px-1.5 py-0.5 rounded-full hover:bg-blue-900"
                          title="Diğer barkodları gör"
                        >
                          +{extraBarcodesCount}
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onManageBarcodes(product)}
                      className="text-xs text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                    >
                      <BarcodeIcon className="w-3.5 h-3.5" />
                      Barkod Ekle
                    </button>
                  )}
                </td>

                {/* Cost Price */}
                <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">
                  {product.costPrice.format()}
                </td>

                {/* Sale Price */}
                <td className="px-4 py-3 text-right font-mono text-sm font-bold text-emerald-400">
                  {product.salePrice.format()}
                </td>

                {/* VAT */}
                <td className="px-4 py-3 text-center text-xs font-medium text-slate-400">
                  %{product.vatRate}
                </td>

                {/* Status */}
                <td className="px-4 py-3 text-center">
                  {product.isActive ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-800/60">
                      Pasif
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {/* Barcode Manager Button */}
                    <button
                      type="button"
                      onClick={() => onManageBarcodes(product)}
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Barkodları Yönet"
                    >
                      <BarcodeIcon className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => onEditProduct(product)}
                      className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 rounded-lg transition-colors"
                      title="Ürünü Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Toggle Active Button */}
                    <button
                      type="button"
                      onClick={() => onToggleActive(product)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        product.isActive
                          ? "text-amber-400 hover:text-amber-300 hover:bg-amber-950/50"
                          : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50"
                      }`}
                      title={product.isActive ? "Pasife Al" : "Aktifleştir"}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(product)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition-colors"
                      title="Ürünü Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
