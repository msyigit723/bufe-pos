import React from 'react';
import { usePosStore } from '../../../stores/usePosStore';

interface ParkedCartsModalProps {
  onClose: () => void;
}

export const ParkedCartsModal: React.FC<ParkedCartsModalProps> = ({ onClose }) => {
  const { parkedCarts, restoreParkedCart, removeParkedCart } = usePosStore();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Bekleyen Sepetler</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕ (ESC)</button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {parkedCarts.length === 0 ? (
            <div className="text-center text-slate-500 py-8">Bekleyen sepet bulunmuyor.</div>
          ) : (
            parkedCarts.map((cart, idx) => (
              <div key={cart.timestamp} className="bg-slate-800 border border-slate-700 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">{cart.label}</div>
                  <div className="text-sm text-slate-400">
                    {new Date(cart.timestamp).toLocaleTimeString()} - {cart.items.length} çeşit ürün
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => { restoreParkedCart(idx); onClose(); }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                  >
                    Çağır
                  </button>
                  <button 
                    onClick={() => removeParkedCart(idx)}
                    className="px-4 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
