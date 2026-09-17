import React, { useState, useEffect } from 'react';
import { SaleService } from '../../application/services/SaleService';
import type { SaleSummaryDto, SaleDetailDto, RefundItemInput } from '../../application/services/SaleService';
import { Money } from '../../domain/value-objects/Money';
import { useAppStore } from '../../stores/useAppStore';

export const Last7DaysHistoryPage: React.FC = () => {
  const { userId, userRole } = useAppStore();
  const [sales, setSales] = useState<SaleSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Refund Modal State
  const [refundSaleId, setRefundSaleId] = useState<number | null>(null);
  const [refundDetail, setRefundDetail] = useState<SaleDetailDto | null>(null);
  const [refundQuantities, setRefundQuantities] = useState<Record<number, number>>({});
  const [refundLoading, setRefundLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await SaleService.getSalesHistory(7);
      setSales(data);
    } catch (e: any) {
      alert("Hata: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const openRefundModal = async (saleId: number) => {
    setRefundSaleId(saleId);
    setRefundDetail(null);
    setRefundQuantities({});
    try {
      const detail = await SaleService.getSaleDetails(saleId);
      setRefundDetail(detail);
      // Initialize quantities to 0
      const initialQs: Record<number, number> = {};
      detail.items.forEach(i => initialQs[i.id] = 0);
      setRefundQuantities(initialQs);
    } catch (e: any) {
      alert("Detay alınamadı: " + e.message);
      setRefundSaleId(null);
    }
  };

  const submitRefund = async () => {
    if (!refundSaleId) return;
    const inputs: RefundItemInput[] = Object.keys(refundQuantities)
      .map(id => ({ sale_item_id: Number(id), quantity: refundQuantities[Number(id)] }))
      .filter(i => i.quantity > 0);
    
    if (inputs.length === 0) {
      alert("Lütfen iade edilecek en az bir miktar girin.");
      return;
    }

    const reason = window.prompt("İade nedeni (isteğe bağlı):");
    
    setRefundLoading(true);
    try {
      if (userId) {
        await SaleService.refundSale(refundSaleId, userId, inputs, reason || undefined);
        alert("İade işlemi başarılı.");
        setRefundSaleId(null);
        loadHistory();
      }
    } catch (e: any) {
      alert("İade hatası: " + e.message);
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-900 text-slate-200 overflow-y-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Son 7 Gün İşlem Geçmişi</h2>
        <button
          onClick={loadHistory}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm"
        >
          Yenile
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400">Yükleniyor...</div>
      ) : (
        <div className="bg-slate-800 rounded border border-slate-700 flex-1 overflow-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-900 sticky top-0 shadow-md">
              <tr>
                <th className="p-3 font-semibold text-slate-300">Tarih</th>
                <th className="p-3 font-semibold text-slate-300">Fiş No</th>
                <th className="p-3 font-semibold text-slate-300">Durum</th>
                <th className="p-3 font-semibold text-slate-300">Ödeme</th>
                <th className="p-3 font-semibold text-slate-300 text-right">Tutar</th>
                <th className="p-3 font-semibold text-slate-300 text-right">İade Edilen</th>
                <th className="p-3 font-semibold text-emerald-400 text-right">Kalan Net</th>
                <th className="p-3 font-semibold text-slate-300 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => {
                const dateObj = new Date(s.created_at);
                const isCancelled = s.status === 'CANCELLED';
                const isRefunded = s.status === 'REFUNDED';
                const isPartial = s.status === 'PARTIALLY_REFUNDED';
                
                const netAmount = s.total_amount_kurus - (s.refunded_amount_kurus || 0);

                let statusBadge = <span className="text-emerald-400 font-bold px-2 py-1 bg-emerald-400/10 rounded">Tamamlandı</span>;
                if (isCancelled) statusBadge = <span className="text-rose-400 font-bold px-2 py-1 bg-rose-400/10 rounded">İPTAL</span>;
                else if (isRefunded) statusBadge = <span className="text-rose-400 font-bold px-2 py-1 bg-rose-400/10 rounded">İADE</span>;
                else if (isPartial) statusBadge = <span className="text-orange-400 font-bold px-2 py-1 bg-orange-400/10 rounded">KISMİ İADE</span>;

                const handleCancel = async () => {
                  if (!window.confirm(`Fiş No: ${s.receipt_no} olan satışı iptal etmek istediğinize emin misiniz?`)) return;
                  const reason = window.prompt("İptal nedeni (isteğe bağlı):");
                  if (reason === null) return;
                  
                  
                  try {
                    if (userId) {
                      await SaleService.cancelSale(s.id, userId, reason);
                      loadHistory();
                    }
                  } catch (e: any) {
                    alert(e.message);
                  }
                };

                return (
                  <tr key={s.id} className={`border-b border-slate-700 hover:bg-slate-750 ${isCancelled ? 'opacity-70' : ''}`}>
                    <td className="p-3">{dateObj.toLocaleString('tr-TR')}</td>
                    <td className="p-3">{s.receipt_no}</td>
                    <td className="p-3">{statusBadge}</td>
                    <td className="p-3">{s.payment_status}</td>
                    <td className={`p-3 text-right ${isCancelled ? 'line-through text-slate-500' : ''}`}>
                      {Money.fromKurus(s.total_amount_kurus).formatTL()}
                    </td>
                    <td className="p-3 text-right text-rose-400">
                      {s.refunded_amount_kurus > 0 ? Money.fromKurus(s.refunded_amount_kurus).formatTL() : '-'}
                    </td>
                    <td className={`p-3 text-right font-bold ${isCancelled ? 'text-slate-500' : 'text-emerald-400'}`}>
                      {isCancelled ? '-' : Money.fromKurus(netAmount).formatTL()}
                    </td>
                    <td className="p-3 text-center space-x-2">
                      {userRole === 'ADMIN' && !isCancelled && !isRefunded && (
                        <button 
                          onClick={() => openRefundModal(s.id)}
                          className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded transition-colors"
                        >
                          İADE ET
                        </button>
                      )}
                      {userRole === 'ADMIN' && !isCancelled && !isRefunded && !isPartial && (
                        <button 
                          onClick={handleCancel}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded transition-colors"
                        >
                          İPTAL ET
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">Kayıt bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Refund Modal */}
      {refundSaleId && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl border border-slate-700 flex flex-col max-h-full">
            <h3 className="text-xl font-bold text-white mb-4">Ürün İadesi</h3>
            
            {!refundDetail ? (
              <div className="text-slate-400">Detaylar yükleniyor...</div>
            ) : (
              <>
                <div className="flex justify-between mb-4 text-sm text-slate-300">
                  <span>Fiş No: <strong>{refundDetail.receipt_no}</strong></span>
                  <span>Ödenen: <strong>{Money.fromKurus(refundDetail.total_amount_kurus).formatTL()}</strong></span>
                </div>
                
                <div className="flex-1 overflow-auto bg-slate-900 rounded border border-slate-700 mb-4 p-2">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th className="p-2 text-slate-400">Ürün</th>
                        <th className="p-2 text-slate-400">B.Fiyat</th>
                        <th className="p-2 text-slate-400">Alınan</th>
                        <th className="p-2 text-slate-400">Önceki İade</th>
                        <th className="p-2 text-slate-400 w-32">İade Miktarı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refundDetail.items.map(item => {
                        const availableQty = item.quantity - item.refunded_quantity;
                        const currentRefundQty = refundQuantities[item.id] || 0;
                        return (
                          <tr key={item.id} className="border-t border-slate-800">
                            <td className="p-2">{item.product_name}</td>
                            <td className="p-2">{Money.fromKurus(item.unit_price_kurus).formatTL()}</td>
                            <td className="p-2">{item.quantity}</td>
                            <td className="p-2 text-rose-400">{item.refunded_quantity > 0 ? item.refunded_quantity : '-'}</td>
                            <td className="p-2">
                              {availableQty > 0 ? (
                                <input
                                  type="number"
                                  min="0"
                                  max={availableQty}
                                  step="0.001"
                                  value={currentRefundQty === 0 ? '' : currentRefundQty}
                                  onChange={(e) => {
                                    let val = Number(e.target.value);
                                    if (val < 0) val = 0;
                                    if (val > availableQty) val = availableQty;
                                    setRefundQuantities(prev => ({...prev, [item.id]: val}));
                                  }}
                                  placeholder="0"
                                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white outline-none focus:border-blue-500"
                                />
                              ) : (
                                <span className="text-slate-500">İade Edildi</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end space-x-3 mt-auto">
                  <button
                    onClick={() => setRefundSaleId(null)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={submitRefund}
                    disabled={refundLoading}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold transition-colors disabled:opacity-50"
                  >
                    {refundLoading ? 'İşleniyor...' : 'Seçili Ürünleri İade Et'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
