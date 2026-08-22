import React, { useState, useEffect, useCallback } from 'react';
import { CustomerService } from '../../application/services/CustomerService';
import type { CustomerDto, CustomerHistoryDto } from '../../application/services/CustomerService';
import { Money } from '../../domain/value-objects/Money';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerDto | null>(null);
  const [tahsilatCustomer, setTahsilatCustomer] = useState<CustomerDto | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<CustomerDto | null>(null);
  const [history, setHistory] = useState<CustomerHistoryDto[]>([]);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [tahsilatAmount, setTahsilatAmount] = useState('');

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
    } catch (e: any) { alert(e.message); }
  };

  const handleTahsilat = async () => {
    if (!tahsilatCustomer) return;
    const kurus = Math.round(parseFloat(tahsilatAmount.replace(',', '.')) * 100) || 0;
    if (kurus <= 0) return alert('Geçerli bir tutar giriniz.');
    try {
      await CustomerService.receiveCustomerPayment(tahsilatCustomer.id, kurus, 1);
      setTahsilatCustomer(null);
      setTahsilatAmount('');
      loadCustomers();
    } catch (e: any) { alert(e.message); }
  };

  const openEdit = (c: CustomerDto) => {
    setFormName(c.name);
    setFormPhone(c.phone || '');
    setEditingCustomer(c);
  };

  const openHistory = async (c: CustomerDto) => {
    setHistoryCustomer(c);
    try {
      const h = await CustomerService.getCustomerHistory(c.id);
      setHistory(h);
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6 overflow-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Müşteriler</h2>
        <button onClick={() => { setFormName(''); setFormPhone(''); setShowNewModal(true); }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-bold text-sm">
          + Yeni Müşteri
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text" placeholder="Müşteri ara (ad veya telefon)..."
          className="w-full max-w-md bg-slate-800 border border-slate-600 rounded p-2.5 text-sm focus:border-blue-500 outline-none"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      {isLoading ? <div className="text-slate-400">Yükleniyor...</div> : (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700/50 text-slate-300 text-left">
                <th className="p-3 font-semibold">Müşteri</th>
                <th className="p-3 font-semibold">Telefon</th>
                <th className="p-3 font-semibold text-right">Borç</th>
                <th className="p-3 font-semibold text-center">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Kayıtlı müşteri bulunmuyor.</td></tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="p-3 font-semibold text-white">{c.name}</td>
                    <td className="p-3 text-slate-400">{c.phone || '-'}</td>
                    <td className={`p-3 text-right font-bold ${c.balance_kurus > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {c.balance_kurus > 0 ? Money.fromKurus(c.balance_kurus).formatTL() : '0,00 ₺'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center space-x-2">
                        <button onClick={() => openEdit(c)} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs">Düzenle</button>
                        <button onClick={() => { setTahsilatAmount(''); setTahsilatCustomer(c); }}
                          className="px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs" disabled={c.balance_kurus <= 0}>
                          Tahsilat
                        </button>
                        <button onClick={() => openHistory(c)} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs">Geçmiş</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New / Edit Customer Modal */}
      {(showNewModal || editingCustomer) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">{editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}</h3>
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Ad Soyad *</label>
                <input type="text" className="w-full bg-slate-800 border border-slate-600 rounded p-2"
                  value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Telefon</label>
                <input type="text" className="w-full bg-slate-800 border border-slate-600 rounded p-2"
                  value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={editingCustomer ? handleUpdate : handleCreate}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded font-bold text-sm">Kaydet</button>
              <button onClick={() => { setShowNewModal(false); setEditingCustomer(null); }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Tahsilat Modal */}
      {tahsilatCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Tahsilat Al</h3>
            <div className="mb-4 text-slate-300">
              <div className="font-semibold text-white">{tahsilatCustomer.name}</div>
              <div>Mevcut Borç: <span className="text-rose-400 font-bold">{Money.fromKurus(tahsilatCustomer.balance_kurus).formatTL()}</span></div>
            </div>
            <div className="mb-6">
              <label className="block text-xs text-slate-400 mb-1">Tahsilat Tutarı (₺)</label>
              <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-lg"
                value={tahsilatAmount} onChange={(e) => setTahsilatAmount(e.target.value)} autoFocus />
            </div>
            <div className="flex space-x-2">
              <button onClick={handleTahsilat}
                className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold text-sm">Tahsilatı Al</button>
              <button onClick={() => setTahsilatCustomer(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg max-h-[70vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{historyCustomer.name} — Geçmiş</h3>
              <button onClick={() => setHistoryCustomer(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-auto">
              {history.length === 0 ? (
                <div className="text-slate-500 text-center py-8">Henüz işlem bulunmuyor.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-left border-b border-slate-700">
                      <th className="pb-2">Tarih</th><th className="pb-2">İşlem</th><th className="pb-2 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i} className="border-t border-slate-800">
                        <td className="py-2 text-slate-400">{new Date(h.date).toLocaleDateString('tr-TR')}</td>
                        <td className="py-2">{h.description}</td>
                        <td className={`py-2 text-right font-bold ${h.amount_kurus > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
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
      )}
    </div>
  );
};
