import React, { useState, useEffect } from 'react';
import { Money } from '../../../domain/value-objects/Money';
import { type PaymentType, PaymentTypeLabels } from '../../../domain/value-objects/Payment';

interface PaymentModalProps {
  totalKurus: number;
  onConfirm: (type: PaymentType, tenderedKurus: number, customerId: number | null) => Promise<void>;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ totalKurus, onConfirm, onClose }) => {
  const [activeTab, setActiveTab] = useState<PaymentType>('NAKIT');
  const [tenderedKurus, setTenderedKurus] = useState<number>(totalKurus);
  const [tenderedInput, setTenderedInput] = useState<string>(Money.fromKurus(totalKurus).toLira().toString());
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (activeTab === 'NAKIT') {
      const kurus = Math.round(parseFloat(tenderedInput.replace(',', '.')) * 100) || 0;
      setTenderedKurus(kurus);
    } else {
      setTenderedKurus(totalKurus);
      setTenderedInput(Money.fromKurus(totalKurus).toLira().toString());
    }
  }, [tenderedInput, activeTab, totalKurus]);

  const handleQuickCash = (amountTl: number) => {
    setTenderedInput(amountTl.toString());
  };

  const handleConfirm = async () => {
    if (activeTab === 'NAKIT' && tenderedKurus < totalKurus) {
      alert('Nakit ödemede alınan tutar, toplam tutardan küçük olamaz.');
      return;
    }
    try {
      setIsPending(true);
      await onConfirm(activeTab, tenderedKurus, null);
    } finally {
      setIsPending(false);
    }
  };

  const changeKurus = Math.max(0, tenderedKurus - totalKurus);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Ödeme Al</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕ (ESC)</button>
        </div>

        <div className="flex flex-1">
          {/* Left Side: Payment Types */}
          <div className="w-1/3 border-r border-slate-700 bg-slate-800/50 p-4 flex flex-col space-y-2">
            {(Object.keys(PaymentTypeLabels) as PaymentType[]).map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`p-4 text-left rounded-lg font-semibold transition-colors ${
                  activeTab === type 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {PaymentTypeLabels[type]}
              </button>
            ))}
          </div>

          {/* Right Side: Details */}
          <div className="w-2/3 p-6 flex flex-col">
            <div className="text-center mb-6">
              <div className="text-slate-400 mb-1">Ödenecek Tutar</div>
              <div className="text-4xl font-black text-emerald-400">
                {Money.fromKurus(totalKurus).formatTL()}
              </div>
            </div>

            {activeTab === 'NAKIT' && (
              <div className="mb-6 space-y-4 flex-1">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Alınan Tutar (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-2xl text-center text-white focus:outline-none focus:border-emerald-500"
                    value={tenderedInput}
                    onChange={(e) => setTenderedInput(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => setTenderedInput(Money.fromKurus(totalKurus).toLira().toString())} className="bg-slate-700 text-white p-2 rounded text-sm font-semibold hover:bg-slate-600">Tam</button>
                  <button onClick={() => handleQuickCash(50)} className="bg-slate-700 text-white p-2 rounded text-sm font-semibold hover:bg-slate-600">50₺</button>
                  <button onClick={() => handleQuickCash(100)} className="bg-slate-700 text-white p-2 rounded text-sm font-semibold hover:bg-slate-600">100₺</button>
                  <button onClick={() => handleQuickCash(200)} className="bg-slate-700 text-white p-2 rounded text-sm font-semibold hover:bg-slate-600">200₺</button>
                </div>
                
                <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-slate-800 text-center">
                  <div className="text-slate-400 text-sm mb-1">Para Üstü</div>
                  <div className={`text-3xl font-bold ${changeKurus > 0 ? 'text-yellow-400' : 'text-slate-300'}`}>
                    {Money.fromKurus(changeKurus).formatTL()}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab !== 'NAKIT' && (
              <div className="flex-1 flex items-center justify-center text-slate-400 p-8 text-center">
                {PaymentTypeLabels[activeTab]} seçildi. Tutar tam olarak çekilecektir.
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="mt-auto w-full py-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 disabled:opacity-50 text-xl shadow-lg"
            >
              {isPending ? 'İşleniyor...' : 'SATIŞI ONAYLA (ENTER)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
