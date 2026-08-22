import React from 'react';
import { usePosStore } from '../../../stores/usePosStore';
import { Cart } from '../../../domain/entities/Cart';
import { Money } from '../../../domain/value-objects/Money';
import { Trash2, Plus, Minus } from 'lucide-react';

export const PosCartTable: React.FC = () => {
  const { items, selectedItemIndex, setSelectedItemIndex, removeCartItem, updateItemQuantity } = usePosStore();

  return (
    <div className="flex-1 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex flex-col m-2 h-full">
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-slate-300">
          <thead className="bg-slate-800 text-slate-400 sticky top-0 text-sm">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Barkod</th>
              <th className="p-3">Ürün Adı</th>
              <th className="p-3 text-center">Miktar</th>
              <th className="p-3">Birim</th>
              <th className="p-3 text-right">B.Fiyat</th>
              <th className="p-3 text-right">İskonto</th>
              <th className="p-3 text-right">Tutar</th>
              <th className="p-3 text-center">Sil</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  Sepet boş. Barkod okutun veya hızlı ürün seçin.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const lineTotal = Cart.lineTotal(item);
                const isSelected = selectedItemIndex === idx;

                return (
                  <tr 
                    key={`${item.productId}-${idx}`}
                    onClick={() => setSelectedItemIndex(idx)}
                    className={`border-b border-slate-800 cursor-pointer ${isSelected ? 'bg-slate-700' : 'hover:bg-slate-800/50'}`}
                  >
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3 text-sm">{item.barcode || '-'}</td>
                    <td className="p-3 font-medium text-slate-100">{item.name}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.productId, item.quantity - 1); }}
                          disabled={item.quantity <= 1}
                          className="p-1 bg-slate-700 rounded hover:bg-slate-600 disabled:opacity-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.productId, item.quantity + 1); }}
                          className="p-1 bg-slate-700 rounded hover:bg-slate-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-slate-400">{item.unitName}</td>
                    <td className="p-3 text-right">{Money.fromKurus(item.unitPriceKurus).formatTL()}</td>
                    <td className="p-3 text-right text-red-400">
                      {item.discountKurus > 0 ? Money.fromKurus(item.discountKurus).formatTL() : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      {Money.fromKurus(lineTotal).formatTL()}
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeCartItem(item.productId); }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
