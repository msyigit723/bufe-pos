import React, { useState, useEffect } from 'react';
import { ReportService } from '../../application/services/ReportService';
import type { DailySalesSummaryDto } from '../../application/services/ReportService';
import { Money } from '../../domain/value-objects/Money';

export const DailyReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<DailySalesSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getLocalSqlDateString = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // Default to today
  const [startDateStr, setStartDateStr] = useState(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return getLocalSqlDateString(d);
  });

  const [endDateStr, setEndDateStr] = useState(() => {
    const d = new Date();
    d.setHours(23,59,59,999);
    return getLocalSqlDateString(d);
  });

  const fetchReport = async (start?: string, end?: string) => {
    setIsLoading(true);
    try {
      const data = await ReportService.getDailySalesSummary(start || startDateStr, end || endDateStr);
      setSummary(data);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPreset = (daysOffset: number) => {
    const dStart = new Date();
    dStart.setDate(dStart.getDate() + daysOffset);
    dStart.setHours(0,0,0,0);
    
    const dEnd = new Date(dStart);
    dEnd.setHours(23,59,59,999);
    
    const sStr = getLocalSqlDateString(dStart);
    const eStr = getLocalSqlDateString(dEnd);
    setStartDateStr(sStr);
    setEndDateStr(eStr);
    
    fetchReport(sStr, eStr);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold">Günlük Satış Raporu</h2>
        <div className="flex space-x-2">
          <button onClick={() => setPreset(0)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-sm">Bugün</button>
          <button onClick={() => setPreset(-1)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-sm">Dün</button>
          <button onClick={() => fetchReport()} className="px-4 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold ml-2">Getir</button>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <div className="flex-1">
          <label className="block text-xs text-slate-400 mb-1">Başlangıç</label>
          <input 
            type="text" 
            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm"
            value={startDateStr} onChange={(e) => setStartDateStr(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-slate-400 mb-1">Bitiş</label>
          <input 
            type="text" 
            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-sm"
            value={endDateStr} onChange={(e) => setEndDateStr(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div>Yükleniyor...</div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-emerald-900/40 border border-emerald-800 p-6 rounded-xl text-center">
            <div className="text-emerald-400 font-semibold mb-2">Toplam Ciro (TL)</div>
            <div className="text-4xl font-black text-white">{Money.fromKurus(summary.total_sales_kurus).formatTL()}</div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-xl text-center border border-slate-700">
            <div className="text-slate-400 font-semibold mb-2">Satış Fişi Sayısı</div>
            <div className="text-4xl font-bold text-white">{summary.sale_count}</div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-xl text-center border border-slate-700">
            <div className="text-slate-400 font-semibold mb-2">Satılan Ürün Adedi</div>
            <div className="text-4xl font-bold text-white">{summary.total_items_sold}</div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 lg:col-span-3">
            <h3 className="text-lg font-semibold mb-4 text-slate-300 border-b border-slate-700 pb-2">Ödeme Tiplerine Göre Dağılım</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900 rounded">
                <div className="text-slate-500 text-sm mb-1">Nakit</div>
                <div className="text-xl font-bold text-emerald-400">{Money.fromKurus(summary.cash_total_kurus).formatTL()}</div>
              </div>
              <div className="p-4 bg-slate-900 rounded">
                <div className="text-slate-500 text-sm mb-1">Kredi Kartı</div>
                <div className="text-xl font-bold text-blue-400">{Money.fromKurus(summary.credit_card_total_kurus).formatTL()}</div>
              </div>
              <div className="p-4 bg-slate-900 rounded">
                <div className="text-slate-500 text-sm mb-1">QR Ödeme</div>
                <div className="text-xl font-bold text-purple-400">{Money.fromKurus(summary.qr_total_kurus).formatTL()}</div>
              </div>
              <div className="p-4 bg-slate-900 rounded">
                <div className="text-slate-500 text-sm mb-1">Cari / Veresiye</div>
                <div className="text-xl font-bold text-yellow-400">{Money.fromKurus(summary.veresiye_total_kurus).formatTL()}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 lg:col-span-3 grid grid-cols-2 gap-4">
            <div className="p-4">
              <div className="text-slate-400 mb-1">Toplam İskonto</div>
              <div className="text-xl text-rose-400">-{Money.fromKurus(summary.total_discount_kurus).formatTL()}</div>
            </div>
            <div className="p-4">
              <div className="text-slate-400 mb-1">Toplam KDV İçeriği</div>
              <div className="text-xl text-slate-300">{Money.fromKurus(summary.total_vat_kurus).formatTL()}</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
