import React, { useState, useEffect } from 'react';
import { ReportService } from '../../application/services/ReportService';
import type { MonthlyRevenueReportDto } from '../../application/services/ReportService';
import { Money } from '../../domain/value-objects/Money';

export const MonthlyReportPage: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState<MonthlyRevenueReportDto | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (y: number, m: number) => {
    setLoading(true);
    try {
      const data = await ReportService.getMonthlyRevenueReport(y, m);
      setReport(data);
    } catch (e: any) {
      alert("Hata: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(year, month);
  }, [year, month]);

  return (
    <div className="p-6 h-full flex flex-col bg-slate-900 text-slate-200 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Aylık Gelir Raporu</h2>
        <div className="flex items-center space-x-2">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="bg-slate-800 border border-slate-700 text-white rounded p-1 outline-none">
            {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="bg-slate-800 border border-slate-700 text-white rounded p-1 outline-none">
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m < 10 ? `0${m}` : m}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="text-slate-400">Yükleniyor...</div>}

      {!loading && report && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-slate-800 p-4 rounded border border-slate-700">
              <div className="text-sm text-slate-400">Net Ciro</div>
              <div className="text-xl font-bold text-emerald-400">{Money.fromKurus(report.total_net_revenue_kurus).formatTL()}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded border border-slate-700">
              <div className="text-sm text-slate-400">Nakit Satış</div>
              <div className="text-xl font-bold text-blue-400">{Money.fromKurus(report.total_cash_revenue_kurus).formatTL()}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded border border-slate-700">
              <div className="text-sm text-slate-400">K.Kartı Satış</div>
              <div className="text-xl font-bold text-blue-400">{Money.fromKurus(report.total_card_revenue_kurus).formatTL()}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded border border-slate-700">
              <div className="text-sm text-slate-400">Veresiye Satış</div>
              <div className="text-xl font-bold text-orange-400">{Money.fromKurus(report.total_credit_revenue_kurus).formatTL()}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded border border-slate-700">
              <div className="text-sm text-slate-400">Tahsilat</div>
              <div className="text-xl font-bold text-purple-400">{Money.fromKurus(report.total_debt_collection_kurus).formatTL()}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded border border-slate-700">
              <div className="text-sm text-slate-400">İptal</div>
              <div className="text-xl font-bold text-rose-400">{Money.fromKurus(report.total_cancelled_amount_kurus).formatTL()}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded border border-slate-700">
              <div className="text-sm text-slate-400">İade</div>
              <div className="text-xl font-bold text-rose-400">{Money.fromKurus(report.total_refunded_amount_kurus).formatTL()}</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded border border-slate-700 overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-900 sticky top-0 shadow-md">
                  <tr>
                    <th className="p-3 font-semibold text-slate-300">Tarih</th>
                    <th className="p-3 font-semibold text-slate-300 text-right">Brüt Satış</th>
                    <th className="p-3 font-semibold text-slate-300 text-right">İptal</th>
                    <th className="p-3 font-semibold text-slate-300 text-right">İade</th>
                    <th className="p-3 font-semibold text-emerald-400 text-right">Net Ciro</th>
                    <th className="p-3 font-semibold text-blue-400 text-right">Nakit</th>
                    <th className="p-3 font-semibold text-blue-400 text-right">Kart</th>
                    <th className="p-3 font-semibold text-orange-400 text-right">Veresiye</th>
                    <th className="p-3 font-semibold text-purple-400 text-right">Tahsilat</th>
                  </tr>
                </thead>
                <tbody>
                  {report.days.map(d => (
                    <tr key={d.date} className="border-b border-slate-700 hover:bg-slate-750">
                      <td className="p-3">{d.date}</td>
                      <td className="p-3 text-right">{Money.fromKurus(d.gross_sales_kurus).formatTL()}</td>
                      <td className="p-3 text-right text-rose-400">{d.cancelled_amount_kurus > 0 ? Money.fromKurus(d.cancelled_amount_kurus).formatTL() : '-'}</td>
                      <td className="p-3 text-right text-rose-400">{d.refunded_amount_kurus > 0 ? Money.fromKurus(d.refunded_amount_kurus).formatTL() : '-'}</td>
                      <td className="p-3 text-right text-emerald-400 font-medium">{Money.fromKurus(d.net_revenue_kurus).formatTL()}</td>
                      <td className="p-3 text-right">{d.cash_revenue_kurus > 0 ? Money.fromKurus(d.cash_revenue_kurus).formatTL() : '-'}</td>
                      <td className="p-3 text-right">{d.card_revenue_kurus > 0 ? Money.fromKurus(d.card_revenue_kurus).formatTL() : '-'}</td>
                      <td className="p-3 text-right">{d.credit_revenue_kurus > 0 ? Money.fromKurus(d.credit_revenue_kurus).formatTL() : '-'}</td>
                      <td className="p-3 text-right">{d.debt_collection_kurus > 0 ? Money.fromKurus(d.debt_collection_kurus).formatTL() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
