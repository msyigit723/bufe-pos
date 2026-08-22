import React, { useState, useEffect, useCallback } from 'react';
import { CashService } from '../../application/services/CashService';
import type { CashSessionDto, CashMovementDto } from '../../application/services/CashService';
import { Money } from '../../domain/value-objects/Money';

export const CashRegisterPage: React.FC = () => {
  const [session, setSession] = useState<CashSessionDto | null>(null);
  const [movements, setMovements] = useState<CashMovementDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Forms
  const [openAmountStr, setOpenAmountStr] = useState('');
  const [movementAmountStr, setMovementAmountStr] = useState('');
  const [movementType, setMovementType] = useState('NAKIT_GIRIS');
  const [movementNote, setMovementNote] = useState('');
  
  const [closeAmountStr, setCloseAmountStr] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const cashRegisterId = 1; // Default register

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeSession = await CashService.getActiveCashSession(cashRegisterId);
      setSession(activeSession);
      const moves = await CashService.getCashMovements(cashRegisterId);
      setMovements(moves);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenRegister = async () => {
    try {
      const kurus = Math.round(parseFloat(openAmountStr.replace(',', '.')) * 100) || 0;
      await CashService.openCashRegister(cashRegisterId, kurus);
      setOpenAmountStr('');
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddMovement = async () => {
    try {
      const kurus = Math.round(parseFloat(movementAmountStr.replace(',', '.')) * 100) || 0;
      if (kurus <= 0) return alert('Geçerli bir tutar giriniz.');
      await CashService.addCashMovement(cashRegisterId, movementType, kurus, movementNote);
      setMovementAmountStr('');
      setMovementNote('');
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCloseRegister = async () => {
    if (!session) return;
    try {
      const expectedKurus = movements.reduce((sum, m) => {
        if (m.movement_type === 'NAKIT_GIRIS' || m.movement_type === 'SATIS_TAHSILAT' || m.movement_type === 'VERESIYE_TAHSILAT') return sum + m.amount_kurus;
        return sum - m.amount_kurus;
      }, session.opening_balance_kurus);
      
      const actualKurus = Math.round(parseFloat(closeAmountStr.replace(',', '.')) * 100) || 0;
      await CashService.closeCashRegister(session.id, expectedKurus, actualKurus);
      setIsClosing(false);
      setCloseAmountStr('');
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (isLoading) return <div className="p-4 text-white">Yükleniyor...</div>;

  const currentExpectedBalance = session 
    ? movements.reduce((sum, m) => {
        if (m.movement_type === 'NAKIT_GIRIS' || m.movement_type === 'SATIS_TAHSILAT' || m.movement_type === 'VERESIYE_TAHSILAT') return sum + m.amount_kurus;
        return sum - m.amount_kurus;
      }, session.opening_balance_kurus)
    : 0;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-4 overflow-auto">
      <h2 className="text-2xl font-bold mb-6">Kasa Yönetimi</h2>

      {!session ? (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-md">
          <h3 className="text-xl font-semibold mb-4 text-emerald-400">Kasayı Aç</h3>
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">Açılış Tutarı (₺)</label>
            <input 
              type="number" step="0.01" 
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 focus:border-emerald-500 outline-none"
              value={openAmountStr} onChange={(e) => setOpenAmountStr(e.target.value)}
            />
          </div>
          <button onClick={handleOpenRegister} className="w-full bg-emerald-600 hover:bg-emerald-500 py-2 rounded font-bold">
            KASAYI AÇ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Durum Kartı */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-emerald-400">Aktif Kasa</h3>
                <span className="text-xs bg-emerald-900 text-emerald-200 px-2 py-1 rounded">AÇIK</span>
              </div>
              <div className="space-y-2 mb-6 text-slate-300">
                <div className="flex justify-between"><span>Açılış Zamanı:</span> <span>{new Date(session.opened_at).toLocaleString('tr-TR')}</span></div>
                <div className="flex justify-between"><span>Açılış Tutarı:</span> <span>{Money.fromKurus(session.opening_balance_kurus).formatTL()}</span></div>
                <div className="flex justify-between border-t border-slate-700 pt-2 font-bold text-lg text-white">
                  <span>Beklenen Kasa:</span> 
                  <span>{Money.fromKurus(currentExpectedBalance).formatTL()}</span>
                </div>
              </div>
              
              {!isClosing ? (
                <button onClick={() => setIsClosing(true)} className="w-full bg-rose-600 hover:bg-rose-500 py-2 rounded font-bold">
                  KASAYI KAPAT
                </button>
              ) : (
                <div className="bg-slate-900 p-4 rounded border border-rose-800">
                  <h4 className="font-bold text-rose-400 mb-2">Kapanış İşlemi</h4>
                  <div className="mb-2">
                    <label className="block text-xs text-slate-400 mb-1">Kasada Sayılan Tutar (₺)</label>
                    <input 
                      type="number" step="0.01" 
                      className="w-full bg-slate-800 border border-slate-600 rounded p-2"
                      value={closeAmountStr} onChange={(e) => setCloseAmountStr(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={handleCloseRegister} className="flex-1 bg-rose-600 hover:bg-rose-500 py-2 rounded font-bold text-sm">ONAYLA</button>
                    <button onClick={() => setIsClosing(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold text-sm">İPTAL</button>
                  </div>
                </div>
              )}
            </div>

            {/* Nakit Giriş Çıkış */}
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Nakit Giriş / Çıkış</h3>
              <div className="flex space-x-2 mb-4">
                <button 
                  onClick={() => setMovementType('NAKIT_GIRIS')}
                  className={`flex-1 py-2 rounded font-semibold text-sm transition-colors ${movementType === 'NAKIT_GIRIS' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                >Giriş</button>
                <button 
                  onClick={() => setMovementType('NAKIT_CIKIS')}
                  className={`flex-1 py-2 rounded font-semibold text-sm transition-colors ${movementType === 'NAKIT_CIKIS' ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                >Çıkış</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tutar (₺)</label>
                  <input 
                    type="number" step="0.01" 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2"
                    value={movementAmountStr} onChange={(e) => setMovementAmountStr(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Açıklama</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-600 rounded p-2"
                    value={movementNote} onChange={(e) => setMovementNote(e.target.value)}
                  />
                </div>
                <button onClick={handleAddMovement} className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold mt-2">
                  KAYDET
                </button>
              </div>
            </div>
          </div>

          {/* Hareketler Listesi */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 flex flex-col h-full max-h-[80vh]">
            <div className="p-4 border-b border-slate-700 font-semibold text-slate-200">Günlük Kasa Hareketleri</div>
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {movements.length === 0 ? (
                <div className="text-slate-500 text-center py-8">Henüz hareket bulunmuyor.</div>
              ) : (
                movements.map(m => {
                  const isPos = m.movement_type === 'NAKIT_GIRIS' || m.movement_type === 'SATIS_TAHSILAT' || m.movement_type === 'VERESIYE_TAHSILAT';
                  return (
                    <div key={m.id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded border border-slate-700/50">
                      <div>
                        <div className="text-sm font-semibold text-slate-200">{m.movement_type.replace('_', ' ')}</div>
                        <div className="text-xs text-slate-400">{new Date(m.created_at).toLocaleTimeString('tr-TR')} {m.note && `- ${m.note}`}</div>
                      </div>
                      <div className={`font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPos ? '+' : '-'}{Money.fromKurus(m.amount_kurus).formatTL()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
