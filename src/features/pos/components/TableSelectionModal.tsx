import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, Coffee } from 'lucide-react';
import { usePosStore } from '../../../stores/usePosStore';
import { useAppStore } from '../../../stores/useAppStore';

interface TableDto {
  id: number;
  name: string;
  is_active: boolean;
  status: string;
}

interface TableSelectionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const TableSelectionModal: React.FC<TableSelectionModalProps> = ({ onClose, onSuccess }) => {
  const [tables, setTables] = useState<TableDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { items, clearCart } = usePosStore();
  const { setCurrentTab } = useAppStore();

  useEffect(() => {
    invoke<TableDto[]>('list_tables')
      .then(res => setTables(res.filter(t => t.is_active)))
      .catch(err => alert(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectTable = async (tableId: number) => {
    try {
      for (const item of items) {
        await invoke('add_table_order', {
          tableId,
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPriceKurus: item.unitPriceKurus
        });
      }
      
      // Update table status to OCCUPIED if it was EMPTY
      const table = tables.find(t => t.id === tableId);
      if (table && table.status === 'EMPTY') {
        await invoke('update_table', {
          id: table.id,
          name: table.name,
          isActive: table.is_active,
          status: 'OCCUPIED'
        });
      }

      clearCart();
      onSuccess();
      setCurrentTab('tables'); // Go to tables page to see the result
    } catch (err: any) {
      alert("Masaya eklenirken hata: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl border border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Coffee className="w-6 h-6 text-blue-400" /> Masaya Ekle
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center text-slate-400 py-10">Masalar yükleniyor...</div>
          ) : tables.length === 0 ? (
            <div className="text-center text-slate-400 py-10">Aktif masa bulunamadı.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => handleSelectTable(table.id)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                    table.status === 'OCCUPIED' 
                      ? 'bg-blue-900/20 border-blue-800 hover:bg-blue-900/40 text-blue-300' 
                      : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Coffee className={`w-8 h-8 ${table.status === 'OCCUPIED' ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="font-bold">{table.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
