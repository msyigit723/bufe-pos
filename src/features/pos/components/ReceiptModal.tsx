import React from 'react';
import { Money } from '../../../domain/value-objects/Money';
import type { SaleResult } from '../../../stores/usePosStore';

interface ReceiptModalProps {
  sale: SaleResult;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white text-black w-full max-w-sm rounded shadow-2xl p-6 font-mono text-sm relative">
        <div className="text-center mb-6">
          <h2 className="font-bold text-xl mb-1">BÜFE POS</h2>
          <div>Fiş No: {sale.receiptNo}</div>
          <div>Tarih: {new Date(sale.createdAt).toLocaleString('tr-TR')}</div>
        </div>

        <div className="border-b border-dashed border-gray-400 mb-4 pb-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-400 text-left">
                <th className="pb-1">Ürün</th>
                <th className="pb-1 text-right">Mkt</th>
                <th className="pb-1 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-1 truncate max-w-[150px]">{item.productName}</td>
                  <td className="py-1 text-right">{item.quantity}</td>
                  <td className="py-1 text-right">{Money.fromKurus(item.lineTotalKurus).formatTL()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-1 mb-4">
          <div className="flex justify-between">
            <span>Ara Toplam:</span>
            <span>{Money.fromKurus(sale.subtotalKurus).formatTL()}</span>
          </div>
          {sale.discountAmountKurus > 0 && (
            <div className="flex justify-between text-red-600">
              <span>İskonto:</span>
              <span>-{Money.fromKurus(sale.discountAmountKurus).formatTL()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t border-black pt-1 mt-1">
            <span>GENEL TOPLAM:</span>
            <span>{Money.fromKurus(sale.totalAmountKurus).formatTL()}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-400 pt-4 mb-6">
          {sale.payments.map((p, i) => (
            <div key={i} className="flex justify-between">
              <span>Ödenen ({p.type}):</span>
              <span>{Money.fromKurus(p.amountKurus).formatTL()}</span>
            </div>
          ))}
          <div className="flex justify-between mt-1 font-bold">
            <span>Para Üstü:</span>
            <span>{Money.fromKurus(sale.changeAmountKurus).formatTL()}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-900 text-white font-bold rounded hover:bg-gray-800"
          autoFocus
        >
          YENİ SATIŞ (ENTER)
        </button>
      </div>
    </div>
  );
};
