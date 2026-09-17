import React, { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../../application/services/CustomerService';
import type { CustomerDto, CustomerHistoryDto } from '../../application/services/CustomerService';
import { Money } from '../../domain/value-objects/Money';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false); // Default to only debtors

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<CustomerDto | null>(null);
  
  // For detail view:
  const [editingCustomer, setEditingCustomer] = useState<CustomerDto | null>(null);
  const [tahsilatAmount, setTahsilatAmount] = useState('');
  const [tahsilatType, setTahsilatType] = useState<string>('NAKIT');
  const [history, setHistory] = useState<CustomerHistoryDto[]>([]);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await CustomerService.listCustomers(searchTerm || null);
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCreate = async () => {
    if (!formName.trim()) return alert('Ad Soyad giriniz.');
    try {
      await CustomerService.createCustomer(formName.trim(), formPhone.trim() || null);
      setShowNewModal(false);
      setFormName(''); setFormPhone('');
      loadCustomers();
    } catch (e: any) { alert(e.message); }
  };

  const handleUpdate = async () => {
    if (!editingCustomer || !formName.trim()) return alert('Ad Soyad giriniz.');
    try {
      await CustomerService.updateCustomer(editingCustomer.id, formName.trim(), formPhone.trim() || null);
      setEditingCustomer(null);
      setFormName(''); setFormPhone('');
      loadCustomers();
      if (detailCustomer) openDetail({...detailCustomer, name: formName.trim(), phone: formPhone.trim() || null});
    } catch (e: any) { alert(e.message); }
  };

  const handleTahsilat = async () => {
    if (!detailCustomer) return;
    const kurus = Math.round(parseFloat(tahsilatAmount.replace(',', '.')) * 100) || 0;
    if (kurus <= 0) return alert('Geçerli bir tutar giriniz.');
    if (kurus > detailCustomer.balance_kurus) return alert('Tahsilat tutarı mevcut borçtan büyük olamaz.');
    try {
      await CustomerService.receivePayment(detailCustomer.id, kurus, tahsilatType, 1);
      setTahsilatAmount('');
      loadCustomers();
      
      // Update local detail view so we don't have to close the modal
      const updatedBalance = detailCustomer.balance_kurus - kurus;
      const updatedCustomer = { ...detailCustomer, balance_kurus: updatedBalance };
      setDetailCustomer(updatedCustomer);
      
      // Reload history
      const h = await CustomerService.getCustomerHistory(updatedCustomer.id);
      setHistory(h);
      
    } catch (e: any) { alert(e.message); }
  };

  const openDetail = async (c: CustomerDto) => {
    setDetailCustomer(c);
    setTahsilatAmount('');
    try {
      const h = await CustomerService.getCustomerHistory(c.id);
      setHistory(h);
    } catch (e: any) { alert(e.message); }
  };

  const openEdit = () => {
    if (!detailCustomer) return;
    setFormName(detailCustomer.name);
    setFormPhone(detailCustomer.phone || '');
    setEditingCustomer(detailCustomer);
  };

  const filteredCustomers = customers
    .filter(c => showAll || c.balance_kurus > 0)
    .sort((a, b) => b.balance_kurus - a.balance_kurus);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6 overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Veresiye Hesaplar</h2>
        <button onClick={() => { setFormName(''); setFormPhone(''); setShowNewModal(true); }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-bold text-sm shadow-md">
          + Yeni Müşteri
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col md:flex-row gap-4 md:items-center">
        <input
          type="text" placeholder="Müşteri ara (ad veya telefon)..."
          className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none transition-colors"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
        <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer select-none bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900" />
          <span>Tüm Müşterileri Göster</span>
        </label>
      </div>

      {/* Table */}
      {isLoading ? <div className="text-slate-400 p-4 text-center">Yükleniyor...</div> : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900/50 text-slate-300 text-left border-b border-slate-700">
                <th className="p-4 font-semibold">Müşteri</th>
                <th className="p-4 font-semibold">Telefon</th>
                <th className="p-4 font-semibold text-right">Güncel Borç</th>
                <th className="p-4 font-semibold text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredCustomers.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-slate-500">Müşteri bulunmuyor.</td></tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-700/40 transition-colors cursor-pointer" onClick={() => openDetail(c)}>
                    <td className="p-4 font-semibold text-white">{c.name}</td>
                    <td className="p-4 text-slate-400">{c.phone || '-'}</td>
                    <td className={`p-4 text-right font-bold ${c.balance_kurus > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {c.balance_kurus > 0 ? Money.fromKurus(c.balance_kurus).formatTL() : '0,00 ₺'}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={(e) => { e.stopPropagation(); openDetail(c); }} className="px-4 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors">
                        İncele
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Yeni Müşteri</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Ad Soyad *</label>
                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Telefon</label>
                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={handleCreate}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-lg font-bold text-sm transition-colors">Kaydet</button>
              <button onClick={() => setShowNewModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-lg font-bold text-sm transition-colors">İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Müşteri Düzenle</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Ad Soyad *</label>
                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Telefon</label>
                <input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 outline-none focus:border-blue-500"
                  value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={handleUpdate}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-lg font-bold text-sm transition-colors">Kaydet</button>
              <button onClick={() => setEditingCustomer(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 py-2.5 rounded-lg font-bold text-sm transition-colors">İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail View / Tahsilat Modal */}
      {detailCustomer && !editingCustomer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
            {/* Left: Customer Info & Tahsilat Form */}
            <div className="w-full md:w-1/3 bg-slate-800/40 p-6 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{detailCustomer.name}</h3>
                  <p className="text-slate-400 text-sm font-medium">{detailCustomer.phone || 'Telefon yok'}</p>
                </div>
                <button onClick={() => setDetailCustomer(null)} className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg p-1.5 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <div className="mb-6 p-5 bg-slate-900 rounded-xl border border-slate-700 shadow-inner">
                <div className="text-sm font-semibold text-slate-400 mb-1">Güncel Borç</div>
                <div className={`text-4xl font-black tracking-tight ${detailCustomer.balance_kurus > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {Money.fromKurus(detailCustomer.balance_kurus).formatTL()}
                </div>
              </div>

              <button onClick={openEdit} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl mb-8 text-sm font-bold text-slate-300 transition-colors shadow-sm">
                Müşteri Bilgilerini Düzenle
              </button>

              <div className="flex-1 mt-auto">
                <h4 className="font-bold text-white mb-4 flex items-center text-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>Tahsilat Al
                </h4>
                <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tahsilat Tutarı (₺)</label>
                    <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xl font-bold outline-none focus:border-blue-500 transition-colors placeholder-slate-600"
                      placeholder="0.00"
                      value={tahsilatAmount} onChange={(e) => setTahsilatAmount(e.target.value)} disabled={detailCustomer.balance_kurus <= 0} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Ödeme Yöntemi</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setTahsilatType('NAKIT')}
                        disabled={detailCustomer.balance_kurus <= 0}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${tahsilatType === 'NAKIT' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'bg-slate-950 border-slate-700 text-slate-500 hover:bg-slate-800'}`}>
                        Nakit
                      </button>
                      <button 
                        onClick={() => setTahsilatType('KREDI_KARTI')}
                        disabled={detailCustomer.balance_kurus <= 0}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${tahsilatType === 'KREDI_KARTI' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.15)]' : 'bg-slate-950 border-slate-700 text-slate-500 hover:bg-slate-800'}`}>
                        Kredi Kartı
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={handleTahsilat}
                    disabled={detailCustomer.balance_kurus <= 0}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 py-3.5 rounded-xl font-bold transition-all mt-2 shadow-lg shadow-blue-900/20 border border-blue-500 disabled:shadow-none text-base">
                    Tahsilatı Kaydet
                  </button>
                </div>
              </div>
            </div>

            {/* Right: History */}
            <div className="w-full md:w-2/3 p-6 flex flex-col bg-slate-950 overflow-hidden relative">
              <h4 className="font-bold text-white mb-4 text-lg">İşlem Geçmişi</h4>
              <div className="flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-900 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="text-slate-500 h-full flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-slate-700"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Henüz işlem bulunmuyor.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800 shadow-sm z-10">
                      <tr className="text-slate-300 text-left">
                        <th className="p-4 font-semibold">Tarih</th>
                        <th className="p-4 font-semibold">İşlem</th>
                        <th className="p-4 font-semibold text-right">Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {history.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 text-slate-400 font-medium">{new Date(h.date).toLocaleString('tr-TR')}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                              h.description.includes('Satış') ? 'bg-rose-950/50 text-rose-400 border border-rose-900/30' : 
                              h.description.includes('KREDİ KARTI') ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/30' :
                              'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30'
                            }`}>
                              {h.description}
                            </span>
                          </td>
                          <td className={`p-4 text-right font-black text-base tracking-tight ${h.amount_kurus > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {h.amount_kurus > 0 ? '+' : ''}{Money.fromKurus(h.amount_kurus).formatTL()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
