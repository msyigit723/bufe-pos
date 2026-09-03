import React from 'react';
import { usePosStore } from '../../../stores/usePosStore';
import { Cart } from '../../../domain/entities/Cart';
import { Money } from '../../../domain/value-objects/Money';
import { PauseCircle, Trash2, CreditCard } from 'lucide-react';

interface PosSummaryBarProps {
  onPayment: () => void;
  onTableAdd: () => void;
}

export const PosSummaryBar: React.FC<PosSummaryBarProps> = ({ onPayment, onTableAdd }) => {
  const { items, clearCart } = usePosStore();

  const subtotal = items.reduce((sum, item) => sum + Cart.lineTotal(item), 0);
  const grandTotal = subtotal;

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
          onClick={onTableAdd}
          className="flex items-center px-4 py-2 bg-slate-800 text-blue-400 rounded hover:bg-slate-700 font-bold"
        >
          <PauseCircle size={18} className="mr-2" />
          Masaya Ekle (F9)
        </button>
      </div>

      <div className="flex items-center space-x-6">
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
