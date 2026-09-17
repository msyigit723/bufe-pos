import React, { useState } from 'react';
import { DailyReportsPage } from './DailyReportsPage';
import { MonthlyReportPage } from './MonthlyReportPage';
import { Last7DaysHistoryPage } from './Last7DaysHistoryPage';

export const ReportsContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'history'>('daily');

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="flex bg-slate-900 border-b border-slate-700 p-2 space-x-2 shrink-0">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${activeTab === 'daily' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          Günlük Rapor
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${activeTab === 'monthly' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          Aylık Rapor
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
        >
          Son 7 Gün Geçmiş
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'daily' && <DailyReportsPage />}
        {activeTab === 'monthly' && <MonthlyReportPage />}
        {activeTab === 'history' && <Last7DaysHistoryPage />}
      </div>
    </div>
  );
};
