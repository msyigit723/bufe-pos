import React, { useEffect, useState } from 'react';
import { ProductService } from '../../../application/services/ProductService';
import { Product } from '../../../domain/entities/Product';

interface QuickProductsGridProps {
  onAddProduct: (product: Product) => void;
}

export const QuickProductsGrid: React.FC<QuickProductsGridProps> = ({ onAddProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Let's assume listProducts gives us products we can show
      const res = await ProductService.listProducts();
      setProducts(res.filter(p => p.isActive && !p.primaryBarcode).slice(0, 30)); // Show top 30 non-barcoded
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-slate-400">Ürünler yükleniyor...</div>;

  return (
    <div className="grid grid-cols-3 gap-2 p-2 overflow-y-auto h-full content-start">
      {products.map(p => (
        <button
          key={p.id}
          onClick={() => onAddProduct(p)}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded p-3 flex flex-col items-center justify-center text-center transition-colors min-h-[80px]"
        >
          <span className="text-sm font-semibold text-slate-200 line-clamp-2 leading-tight mb-1">{p.name}</span>
          <span className="text-emerald-400 font-bold mt-auto">
            {p.salePrice.format()}
          </span>
        </button>
      ))}
    </div>
  );
};
