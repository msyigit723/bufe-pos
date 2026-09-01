import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus, Coffee, CreditCard } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { usePosStore } from '../../stores/usePosStore';

interface TableDto {
  id: number;
  name: string;
  is_active: boolean;
  status: string;
}

interface TableOrderDto {
  id: number;
  table_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price_kurus: number;
}

export const TablesPage: React.FC = () => {
  const [tables, setTables] = useState<TableDto[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableDto | null>(null);
  const [orders, setOrders] = useState<TableOrderDto[]>([]);
  
  const { setCurrentTab } = useAppStore();
  const { clearCart, addProductToCart } = usePosStore();

  const loadTables = async () => {
    try {
      const data = await invoke<TableDto[]>('list_tables');
      setTables(data);
    } catch (e) {
      console.error('Failed to load tables', e);
    }
  };

  const loadOrders = async (tableId: number) => {
    try {
      const data = await invoke<TableOrderDto[]>('get_table_orders', { tableId });
      setOrders(data);
    } catch (e) {
      console.error('Failed to load orders', e);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadOrders(selectedTable.id);
    } else {
      setOrders([]);
    }
  }, [selectedTable]);

  const handleTableClick = (t: TableDto) => {
    setSelectedTable(t);
  };

  const handleAddOrder = () => {
    // Navigate to POS to add items to table
    // In a full implementation, we'd pass the tableId to POS
    alert('Şimdi POS ekranından ürün seçip "Masaya Ekle" diyebilirsiniz. (Örnek akış)');
    setCurrentTab('pos');
  };

  const handleCheckout = () => {
    if (!selectedTable || orders.length === 0) return;
    
    // Transfer items to POS store
    clearCart();
    orders.forEach(o => {
      // Mocking full product info for cart
      addProductToCart({
        id: o.product_id,
        code: `TBL-${o.product_id}`,
        name: o.product_name,
        unitName: 'Adet',
        salePriceKurus: o.unit_price_kurus,
        vatRate: 20.0,
        primaryBarcode: null,
        isActive: true
      });
      // Set correct quantity
      usePosStore.getState().updateItemQuantity(o.product_id, o.quantity);
    });

    // Clear table
    invoke('clear_table', { tableId: selectedTable.id }).then(() => {
      loadTables();
      setCurrentTab('pos');
    });
  };

  return (
    <div className="flex h-full bg-slate-950 p-4 gap-4">
      <div className="w-2/3 bg-slate-900 rounded-xl border border-slate-800 p-4">
        <h2 className="text-xl font-bold text-white mb-4">Masalar / Çay Bahçesi</h2>
        <div className="grid grid-cols-3 gap-4">
          {tables.map(t => (
            <div 
              key={t.id} 
              onClick={() => handleTableClick(t)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTable?.id === t.id ? 'border-emerald-500 bg-slate-800' : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
              } flex flex-col items-center justify-center gap-3`}
            >
              <Coffee className={`w-10 h-10 ${t.status === 'OCCUPIED' ? 'text-amber-500' : 'text-slate-400'}`} />
              <div className="text-lg font-bold text-slate-200">{t.name}</div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                t.status === 'OCCUPIED' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {t.status === 'OCCUPIED' ? 'DOLU' : 'BOŞ'}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="w-1/3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
        {selectedTable ? (
          <>
            <div className="p-4 border-b border-slate-800 bg-slate-800/50 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">{selectedTable.name} Adisyonu</h3>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {orders.length === 0 ? (
                <div className="text-center text-slate-500 py-10">Masa boş, henüz sipariş yok.</div>
              ) : (
                <ul className="space-y-3">
                  {orders.map(o => (
                    <li key={o.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                      <div>
                        <div className="font-bold text-slate-200">{o.product_name}</div>
                        <div className="text-sm text-slate-400">{o.quantity} x {(o.unit_price_kurus / 100).toFixed(2)} TL</div>
                      </div>
                      <div className="font-bold text-emerald-400">
                        {((o.quantity * o.unit_price_kurus) / 100).toFixed(2)} TL
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-800/50 rounded-b-xl space-y-3">
              <div className="flex justify-between items-center mb-4 text-lg">
                <span className="font-semibold text-slate-300">Toplam:</span>
                <span className="font-bold text-white">
                  {(orders.reduce((sum, o) => sum + (o.quantity * o.unit_price_kurus), 0) / 100).toFixed(2)} TL
                </span>
              </div>
              <button 
                onClick={handleAddOrder}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Masaya Ürün Ekle
              </button>
              
              <button 
                onClick={handleCheckout}
                disabled={orders.length === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" /> Ödeme Al (POS'a Aktar)
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <Coffee className="w-16 h-16 mb-4 opacity-50" />
            <p>Adisyonu görüntülemek için soldan bir masa seçin.</p>
          </div>
        )}
      </div>
    </div>
  );
};
