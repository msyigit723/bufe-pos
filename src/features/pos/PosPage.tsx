import React, { useEffect, useState, useRef } from 'react';
import { PosCartTable } from './components/PosCartTable';
import { QuickProductsGrid } from './components/QuickProductsGrid';
import { PosSummaryBar } from './components/PosSummaryBar';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { ParkedCartsModal } from './components/ParkedCartsModal';
import { QuantityDiscountModal } from './components/QuantityDiscountModal';
import { usePosStore } from '../../stores/usePosStore';
import type { SaleResult } from '../../stores/usePosStore';
import { SaleService } from '../../application/services/SaleService';
import { ProductService } from '../../application/services/ProductService';
import { Cart } from '../../domain/entities/Cart';
import type { PaymentType } from '../../domain/value-objects/Payment';

export const PosPage: React.FC = () => {
  const store = usePosStore();
  const [showPayment, setShowPayment] = useState(false);
  const [showParked, setShowParked] = useState(false);
  const [showQDModal, setShowQDModal] = useState<'quantity' | 'discount' | null>(null);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Keep focus on barcode input when not interacting with modals
    const focusInterval = setInterval(() => {
      if (!showPayment && !showParked && !showQDModal && !store.lastSaleResult) {
        barcodeInputRef.current?.focus();
      }
    }, 1000);
    return () => clearInterval(focusInterval);
  }, [showPayment, showParked, showQDModal, store.lastSaleResult]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input other than barcode (like modal inputs)
      if (e.target instanceof HTMLInputElement && e.target !== barcodeInputRef.current) return;

      switch (e.key) {
        case 'F5':
          e.preventDefault();
          if (store.items.length > 0 && !showPayment) setShowPayment(true);
          break;
        case ' ':
          if (!showPayment && !showParked && !showQDModal && !store.lastSaleResult && e.target === barcodeInputRef.current) {
             if (barcodeInputRef.current && barcodeInputRef.current.value === '' && store.items.length > 0) {
               e.preventDefault();
               setShowPayment(true);
             }
          }
          break;
        case 'F7':
          e.preventDefault();
          if (store.selectedItemIndex >= 0 && store.items[store.selectedItemIndex]) setShowQDModal('quantity');
          break;
        case 'F8':
          e.preventDefault();
          if (store.selectedItemIndex >= 0 && store.items[store.selectedItemIndex]) setShowQDModal('discount');
          break;
        case 'F9':
          e.preventDefault();
          store.parkCart();
          break;
        case 'F10':
          e.preventDefault();
          setShowParked(true);
          break;
        case 'Delete':
          if (store.selectedItemIndex >= 0 && store.items[store.selectedItemIndex]) {
            store.removeCartItem(store.items[store.selectedItemIndex].productId);
          }
          break;
        case 'Escape':
          if (showPayment) setShowPayment(false);
          else if (showParked) setShowParked(false);
          else if (showQDModal) setShowQDModal(null);
          else if (store.lastSaleResult) store.setLastSaleResult(null);
          else store.clearCart();
          break;
        case 'ArrowUp':
          e.preventDefault();
          store.setSelectedItemIndex(Math.max(0, store.selectedItemIndex - 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          store.setSelectedItemIndex(Math.min(store.items.length - 1, store.selectedItemIndex + 1));
          break;
        case 'Enter':
          // Handle barcode scanner enter
          if (!showPayment && !showParked && !showQDModal && !store.lastSaleResult) {
            const val = barcodeInputRef.current?.value.trim();
            if (val) handleBarcodeScan(val);
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store, showPayment, showParked, showQDModal]);

  const handleBarcodeScan = async (barcode: string) => {
    if (barcodeInputRef.current) barcodeInputRef.current.value = '';
    try {
      store.setErrorMessage(null);
      const product = await ProductService.searchProductByBarcode(barcode);
      if (product) {
        store.addProductToCart({
          id: product.id,
          code: product.code,
          name: product.name,
          unitName: product.unitName,
          salePriceKurus: product.salePrice.toKurus(),
          vatRate: product.vatRate,
          primaryBarcode: product.primaryBarcode,
          isActive: product.isActive,
        }, barcode);
      } else {
        store.setErrorMessage(`Barkod "${barcode}" ile eşleşen ürün bulunamadı.`);
        setTimeout(() => store.setErrorMessage(null), 3000);
      }
    } catch (e: any) {
      store.setErrorMessage(e.message || 'Ürün aranırken bir hata oluştu.');
      setTimeout(() => store.setErrorMessage(null), 3000);
    }
  };

  const handlePaymentConfirm = async (type: PaymentType, amountKurus: number, customerId: number | null) => {
    if (store.isProcessing) return; // Double-submit protection
    store.setProcessing(true);
    try {
      const payload = {
        items: store.items.map(i => ({
          product_id: i.productId,
          barcode: i.barcode,
          quantity: i.quantity,
          unit_price_kurus: i.unitPriceKurus,
          discount_amount_kurus: i.discountKurus,
          vat_rate: i.vatRate
        })),
        payments: [{ payment_type: type, amount_kurus: amountKurus }],
        customer_id: customerId,
        cash_register_id: null
      };
      
      const dto = await SaleService.processSale(payload);
      
      // Map SaleResultDto to SaleResult
      const result: SaleResult = {
        saleId: dto.sale_id,
        receiptNo: dto.receipt_no,
        subtotalKurus: dto.subtotal_kurus,
        discountAmountKurus: dto.discount_amount_kurus,
        vatAmountKurus: dto.vat_amount_kurus,
        totalAmountKurus: dto.total_amount_kurus,
        changeAmountKurus: dto.change_amount_kurus,
        items: dto.items.map(i => ({
          productName: i.product_name,
          quantity: i.quantity,
          unitPriceKurus: i.unit_price_kurus,
          lineTotalKurus: i.line_total_kurus,
        })),
        payments: dto.payments.map(p => ({
          type: p.payment_type,
          amountKurus: p.amount_kurus,
        })),
        createdAt: dto.created_at,
      };
      
      store.setLastSaleResult(result);
      store.clearCart();
      setShowPayment(false);
    } catch (error: any) {
      store.setErrorMessage(error.message || 'Satış işlemi başarısız oldu.');
      setTimeout(() => store.setErrorMessage(null), 5000);
    } finally {
      store.setProcessing(false);
    }
  };

  const handleQuickProductAdd = (product: any) => {
    store.addProductToCart({
      id: product.id,
      code: product.code,
      name: product.name,
      unitName: product.unitName,
      salePriceKurus: product.salePrice.toKurus(),
      vatRate: product.vatRate,
      primaryBarcode: product.primaryBarcode,
      isActive: product.isActive,
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-2">
      {/* Error Toast */}
      {store.errorMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-900/90 border border-rose-700 text-rose-100 px-6 py-3 rounded-lg shadow-xl text-sm font-medium animate-pulse">
          {store.errorMessage}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Cart */}
        <div className="w-8/12 flex flex-col pr-2">
          <PosCartTable />
          <PosSummaryBar 
            onPayment={() => setShowPayment(true)} 
            onPark={() => store.parkCart()} 
          />
        </div>
        
        {/* Right Side: Quick Products & Input */}
        <div className="w-4/12 flex flex-col pl-2 border-l border-slate-800">
          <div className="p-2 mb-2">
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Barkod okutun veya arayın..."
              className="w-full p-4 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors shadow-inner"
              autoFocus
            />
          </div>
          <div className="flex-1 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
            <div className="p-3 border-b border-slate-700 bg-slate-800 text-sm font-semibold text-slate-300">
              Hızlı Ürünler
            </div>
            <QuickProductsGrid onAddProduct={handleQuickProductAdd} />
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal 
          totalKurus={store.items.reduce((sum, item) => sum + Cart.lineTotal(item), 0)}
          onConfirm={handlePaymentConfirm}
          onClose={() => setShowPayment(false)}
        />
      )}

      {store.lastSaleResult && (
        <ReceiptModal 
          sale={store.lastSaleResult}
          onClose={() => store.setLastSaleResult(null)}
        />
      )}

      {showParked && (
        <ParkedCartsModal onClose={() => setShowParked(false)} />
      )}

      {showQDModal && store.selectedItemIndex >= 0 && (
        <QuantityDiscountModal 
          mode={showQDModal}
          initialValue={showQDModal === 'quantity' 
            ? store.items[store.selectedItemIndex].quantity 
            : store.items[store.selectedItemIndex].discountKurus}
          onConfirm={(val) => {
            if (showQDModal === 'quantity') store.updateItemQuantity(store.items[store.selectedItemIndex].productId, val);
            else store.updateItemDiscount(store.items[store.selectedItemIndex].productId, val);
            setShowQDModal(null);
          }}
          onClose={() => setShowQDModal(null)}
        />
      )}
    </div>
  );
};
