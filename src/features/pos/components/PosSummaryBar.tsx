import React from 'react';
import { usePosStore } from '../../../stores/usePosStore';
import { Cart } from '../../../domain/entities/Cart';
import { Money } from '../../../domain/value-objects/Money';
import { PauseCircle, Trash2, CreditCard } from 'lucide-react';

interface PosSummaryBarProps {
  onPayment: () => void;
  onPark: () => void;
}

export const PosSummaryBar: React.FC<PosSummaryBarProps> = ({ onPayment, onPark }) => {
  const { items, clearCart } = usePosStore();

  const subtotal = items.reduce((sum, item) => sum + Cart.lineTotal(item), 0);
  const vatTotal = items.reduce((sum, item) => sum + Cart.lineVat(item), 0);
  const discountTotal = items.reduce((sum, item) => sum + item.discountKurus, 0);
  const grandTotal = subtotal; // Assuming lineTotal already subtracts discount, we can just use subtotal as grand total for this setup.

  return (
    <div className="bg-slate-900 border-t border-slate-700 p-4 m-2 rounded-lg flex justify-between items-center">
      <div className="flex space-x-2">
        <button 
          onClick={clearCart}
          className="flex items-center px-4 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
        >
          <Trash2 size={18} className="mr-2" />
          Temizle (ESC)
        </button>
        <button 
          onClick={onPark}
          className="flex items-center px-4 py-2 bg-slate-800 text-yellow-400 rounded hover:bg-slate-700"
        >
          <PauseCircle size={18} className="mr-2" />
          Beklet (F9)
        </button>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-right text-sm text-slate-400">
          <div>Ara Toplam: <span className="text-slate-200">{Money.fromKurus(subtotal).formatTL()}</span></div>
          <div>KDV: <span className="text-slate-200">{Money.fromKurus(vatTotal).formatTL()}</span></div>
          {discountTotal > 0 && (
            <div className="text-red-400">İskonto: {Money.fromKurus(discountTotal).formatTL()}</div>
          )}
        </div>

        <div className="bg-slate-950 px-6 py-3 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Genel Toplam</div>
          <div className="text-3xl font-black text-emerald-400">
            {Money.fromKurus(grandTotal).formatTL()}
          </div>
        </div>

        <button 
          onClick={onPayment}
          disabled={items.length === 0}
          className="flex items-center px-8 py-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <CreditCard size={24} className="mr-3" />
          <div className="text-left">
            <div className="text-lg">ÖDEME AL</div>
            <div className="text-xs text-emerald-200 font-normal">F5 veya BOŞLUK</div>
          </div>
        </button>
      </div>
    </div>
  );
};
