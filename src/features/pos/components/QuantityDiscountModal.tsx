import React, { useState } from 'react';
import { Money } from '../../../domain/value-objects/Money';

interface QuantityDiscountModalProps {
  mode: 'quantity' | 'discount';
  initialValue: number; // For quantity: number, For discount: kurus amount
  onConfirm: (val: number) => void;
  onClose: () => void;
}

export const QuantityDiscountModal: React.FC<QuantityDiscountModalProps> = ({ mode, initialValue, onConfirm, onClose }) => {
  const [val, setVal] = useState(mode === 'quantity' ? initialValue.toString() : Money.fromKurus(initialValue).toLira().toString());

  const handleConfirm = () => {
    const num = parseFloat(val.replace(',', '.'));
    if (isNaN(num)) return;
    
    if (mode === 'quantity') {
      if (num <= 0) return;
      onConfirm(num);
    } else {
      if (num < 0) return;
      onConfirm(Math.round(num * 100)); // Lira to Kurus
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-6">
        <h2 className="text-xl font-bold text-white mb-4 text-center">
          {mode === 'quantity' ? 'Miktar Değiştir' : 'İskonto Uygula (₺)'}
        </h2>
        
        <input
          type="number"
          step={mode === 'quantity' ? '1' : '0.01'}
          className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-2xl text-center text-white focus:outline-none focus:border-emerald-500 mb-6"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
            if (e.key === 'Escape') onClose();
          }}
        />

        <div className="flex space-x-2">
          <button onClick={onClose} className="flex-1 p-3 bg-slate-800 text-slate-300 rounded hover:bg-slate-700">İptal</button>
          <button onClick={handleConfirm} className="flex-1 p-3 bg-emerald-600 text-white rounded hover:bg-emerald-500 font-bold">Onayla</button>
        </div>
      </div>
    </div>
  );
};
