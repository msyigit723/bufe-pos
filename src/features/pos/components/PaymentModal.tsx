import React, { useState, useEffect } from 'react';
import { Money } from '../../../domain/value-objects/Money';
import { type PaymentType, PaymentTypeLabels } from '../../../domain/value-objects/Payment';

interface PaymentAllocation {
  type: PaymentType;
  amountKurus: number;
}

interface PaymentModalProps {
  totalKurus: number;
  onConfirm: (allocations: PaymentAllocation[], customerId: number | null) => Promise<void>;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ totalKurus, onConfirm, onClose }) => {
  const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);
  const [tenderedInput, setTenderedInput] = useState<string>(Money.fromKurus(totalKurus).toLira().toString());
  const [isPending, setIsPending] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  
  // Basic customer selection for Veresiye
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // New Customer State
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [isCreatingCustomerPending, setIsCreatingCustomerPending] = useState(false);

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      alert('Müşteri Ad Soyad zorunludur.');
      return;
    }
    setIsCreatingCustomerPending(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const newId: number = await invoke('create_customer', { 
        name: newCustomerName, 
        phone: newCustomerPhone.trim() || null 
      });
      await fetchCustomers();
      setSelectedCustomerId(newId);
      setIsCreatingCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    } catch (e: any) {
      alert('Müşteri oluşturulamadı: ' + e);
    } finally {
      setIsCreatingCustomerPending(false);
    }
  };

  useEffect(() => {
    // In a real scenario, this would fetch from CustomerService
    // For now we just load a dummy or wait for Phase 3 to properly hook this up.
    // If we need an actual customer to satisfy the backend, we can fetch them.
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    // We'll query sqlite via tauri directly or just use a hook if it existed.
    // For phase 2/3, we assume a simple list of customers exists.
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const res: any[] = await invoke('list_customers', { search: null });
      setCustomers(res);
    } catch (e) {
      console.warn("list_customers command might not exist yet", e);
    }
  };

  const paidKurus = allocations.reduce((sum, a) => sum + a.amountKurus, 0);
  const remainingKurus = Math.max(0, totalKurus - paidKurus);
  const changeKurus = paidKurus > totalKurus ? paidKurus - totalKurus : 0;

  useEffect(() => {
    if (allocations.length === 0) {
      setTenderedInput(Money.fromKurus(totalKurus).toLira().toString());
    } else {
      setTenderedInput(Money.fromKurus(remainingKurus).toLira().toString());
    }
  }, [allocations, totalKurus, remainingKurus]);

  const handleQuickCash = (amountTl: number) => {
    setTenderedInput(amountTl.toString());
  };

  const handleAddPayment = (type: PaymentType) => {
    let amount = Math.round(parseFloat(tenderedInput.replace(',', '.')) * 100) || 0;
    if (amount <= 0) return;

    if (type === 'CARI_VERESIYE' && !selectedCustomerId) {
      alert('Veresiye işlemi için lütfen bir müşteri seçin.');
      return;
    }

    if (type !== 'NAKIT' && amount > remainingKurus) {
      // Card and Credit cannot overpay
      amount = remainingKurus;
    }

    if (!isSplitMode) {
      // In normal mode, clicking a payment type confirms the whole remaining amount immediately
      handleConfirm([{ type, amountKurus: amount }]);
      return;
    }

    setAllocations([...allocations, { type, amountKurus: amount }]);
  };

  const handleRemoveAllocation = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleConfirm = async (finalAllocations = allocations) => {
    const totalPaid = finalAllocations.reduce((sum, a) => sum + a.amountKurus, 0);
    if (totalPaid < totalKurus) {
      alert('Ödeme tutarı toplam tutardan az olamaz.');
      return;
    }
    
    const hasVeresiye = finalAllocations.some(a => a.type === 'CARI_VERESIYE');
    if (hasVeresiye && !selectedCustomerId) {
      alert('Veresiye işlemi için lütfen bir müşteri seçin.');
      return;
    }

    try {
      setIsPending(true);
      await onConfirm(finalAllocations, selectedCustomerId);
    } finally {
      setIsPending(false);
    }
  };

  const handleSplitModeToggle = () => {
    setIsSplitMode(true);
  };

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
                onClick={() => handleAddPayment(type)}
                className="p-4 text-left rounded-lg font-semibold transition-colors bg-slate-800 text-slate-300 hover:bg-slate-700 shadow"
              >
                {PaymentTypeLabels[type]}
              </button>
            ))}
            
            {!isSplitMode && (
              <button
                onClick={handleSplitModeToggle}
                className="p-4 mt-4 text-center rounded-lg font-bold transition-colors bg-blue-600 text-white hover:bg-blue-500 shadow-lg"
              >
                ÖDEMEYİ BÖL
              </button>
            )}
          </div>

          {/* Right Side: Details */}
          <div className="w-2/3 p-6 flex flex-col">
            <div className="grid grid-cols-2 gap-4 text-center mb-6">
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-sm mb-1">TOPLAM</div>
                <div className="text-2xl font-black text-white">
                  {Money.fromKurus(totalKurus).formatTL()}
                </div>
              </div>
              <div className={`p-3 rounded-lg border ${remainingKurus === 0 ? 'bg-emerald-900/50 border-emerald-700' : 'bg-slate-800 border-slate-700'}`}>
                <div className="text-slate-400 text-sm mb-1">KALAN</div>
                <div className={`text-2xl font-black ${remainingKurus === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {Money.fromKurus(remainingKurus).formatTL()}
                </div>
              </div>
            </div>

            {isSplitMode && allocations.length > 0 && (
              <div className="mb-4 max-h-32 overflow-y-auto bg-slate-950 p-2 rounded-lg border border-slate-800">
                {allocations.map((alloc, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 border-b border-slate-800 last:border-0 text-sm">
                    <span className="text-slate-300 font-semibold">{PaymentTypeLabels[alloc.type]}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{Money.fromKurus(alloc.amountKurus).formatTL()}</span>
                      <button onClick={() => handleRemoveAllocation(idx)} className="text-rose-400 hover:text-rose-300 font-bold">X</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-6 space-y-4 flex-1">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Tutar Girin (₺)</label>
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
                <button onClick={() => setTenderedInput(Money.fromKurus(remainingKurus).toLira().toString())} className="bg-slate-700 text-white p-2 rounded text-sm font-semibold hover:bg-slate-600">Kalan</button>
                <button onClick={() => handleQuickCash(50)} className="bg-slate-700 text-white p-2 rounded text-sm font-semibold hover:bg-slate-600">50₺</button>
                <button onClick={() => handleQuickCash(100)} className="bg-slate-700 text-white p-2 rounded text-sm font-semibold hover:bg-slate-600">100₺</button>
                <button onClick={() => handleQuickCash(200)} className="bg-slate-700 text-white p-2 rounded text-sm font-semibold hover:bg-slate-600">200₺</button>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm text-slate-400">Müşteri (Veresiye için)</label>
                  <button 
                    onClick={() => setIsCreatingCustomer(!isCreatingCustomer)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    {isCreatingCustomer ? 'İPTAL' : '+ YENİ MÜŞTERİ'}
                  </button>
                </div>

                {isCreatingCustomer ? (
                  <div className="bg-slate-800 p-3 rounded border border-slate-600 mb-2 space-y-2">
                    <input 
                      type="text" 
                      placeholder="Ad Soyad (Zorunlu)" 
                      value={newCustomerName}
                      onChange={e => setNewCustomerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-emerald-500 outline-none text-sm"
                    />
                    <input 
                      type="text" 
                      placeholder="Telefon (İsteğe Bağlı)" 
                      value={newCustomerPhone}
                      onChange={e => setNewCustomerPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-emerald-500 outline-none text-sm"
                    />
                    <button 
                      onClick={handleCreateCustomer}
                      disabled={isCreatingCustomerPending}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded p-2 text-sm disabled:opacity-50"
                    >
                      {isCreatingCustomerPending ? 'Kaydediliyor...' : 'KAYDET'}
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedCustomerId || ''}
                    onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Müşteri Seçin --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
              
              {changeKurus > 0 && (
                <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 text-center flex justify-between items-center">
                  <div className="text-slate-400 text-sm font-bold">Para Üstü</div>
                  <div className="text-2xl font-black text-yellow-400">
                    {Money.fromKurus(changeKurus).formatTL()}
                  </div>
                </div>
              )}
            </div>

            {isSplitMode && (
              <button
                onClick={() => handleConfirm()}
                disabled={isPending || remainingKurus > 0}
                className="mt-auto w-full py-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 disabled:opacity-50 text-xl shadow-lg"
              >
                {isPending ? 'İşleniyor...' : (remainingKurus > 0 ? 'ÖDEMEYİ TAMAMLA' : 'SATIŞI ONAYLA')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
