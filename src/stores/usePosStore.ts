import { create } from 'zustand';
import type { CartItem } from '../domain/entities/Cart';

export interface SaleResult {
  saleId: number;
  receiptNo: string;
  subtotalKurus: number;
  discountAmountKurus: number;
  vatAmountKurus: number;
  totalAmountKurus: number;
  changeAmountKurus: number;
  items: Array<{productName: string; quantity: number; unitPriceKurus: number; lineTotalKurus: number}>;
  payments: Array<{type: string; amountKurus: number}>;
  createdAt: string;
}

export interface ParkedCartSnapshot {
  items: CartItem[];
  timestamp: number;
  label: string;
}

interface PosState {
  items: CartItem[];
  selectedItemIndex: number;
  parkedCarts: ParkedCartSnapshot[];
  lastSaleResult: SaleResult | null;
  isProcessing: boolean;
  barcodeBuffer: string;
  lastBarcodeTime: number;
  errorMessage: string | null;
  
  // Cart actions
  addProductToCart: (product: any, barcode?: string, quantity?: number) => void;
  updateItemQuantity: (productId: number, quantity: number) => void;
  updateItemDiscount: (productId: number, discountKurus: number) => void;
  removeCartItem: (productId: number) => void;
  clearCart: () => void;
  setSelectedItemIndex: (index: number) => void;
  
  // Park actions
  parkCart: () => void;
  restoreParkedCart: (index: number) => void;
  removeParkedCart: (index: number) => void;
  
  // Sale actions
  setProcessing: (v: boolean) => void;
  setLastSaleResult: (result: SaleResult | null) => void;
  setErrorMessage: (msg: string | null) => void;
  
  // Barcode buffer
  appendBarcodeChar: (char: string) => void;
  clearBarcodeBuffer: () => void;
  getBarcodeAndClear: () => string;
}

export const usePosStore = create<PosState>((set, get) => ({
  items: [],
  selectedItemIndex: -1,
  parkedCarts: [],
  lastSaleResult: null,
  isProcessing: false,
  barcodeBuffer: '',
  lastBarcodeTime: 0,
  errorMessage: null,

  addProductToCart: (product, barcode, quantity = 1) => {
    set((state) => {
      const items = [...state.items];
      if (!product.isActive) {
        return { errorMessage: 'Pasif ürün sepete eklenemez.' };
      }
      
      const existingIdx = items.findIndex(i => i.productId === product.id);
      if (existingIdx >= 0) {
        items[existingIdx] = {
          ...items[existingIdx],
          quantity: items[existingIdx].quantity + quantity
        };
        return { items, selectedItemIndex: existingIdx, errorMessage: null };
      } else {
        const newItem: CartItem = {
          productId: product.id,
          barcode: barcode || product.primaryBarcode || null,
          code: product.code,
          name: product.name,
          unitName: product.unitName,
          quantity,
          unitPriceKurus: product.salePriceKurus,
          discountKurus: 0,
          vatRate: product.vatRate,
        };
        items.push(newItem);
        return { items, selectedItemIndex: items.length - 1, errorMessage: null };
      }
    });
  },

  updateItemQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) return { errorMessage: 'Miktar sıfır veya negatif olamaz.' };
      const items = state.items.map(i => i.productId === productId ? { ...i, quantity } : i);
      return { items, errorMessage: null };
    });
  },

  updateItemDiscount: (productId, discountKurus) => {
    set((state) => {
      if (discountKurus < 0) return { errorMessage: 'İndirim negatif olamaz.' };
      const items = state.items.map(i => i.productId === productId ? { ...i, discountKurus } : i);
      return { items, errorMessage: null };
    });
  },

  removeCartItem: (productId) => {
    set((state) => {
      const items = state.items.filter(i => i.productId !== productId);
      const selectedItemIndex = Math.min(state.selectedItemIndex, items.length - 1);
      return { items, selectedItemIndex };
    });
  },

  clearCart: () => {
    set({ items: [], selectedItemIndex: -1, errorMessage: null });
  },

  setSelectedItemIndex: (index) => {
    set({ selectedItemIndex: index });
  },

  parkCart: () => {
    set((state) => {
      if (state.items.length === 0) return state;
      const snapshot: ParkedCartSnapshot = {
        items: [...state.items],
        timestamp: Date.now(),
        label: `Sepet ${state.parkedCarts.length + 1}`
      };
      return {
        parkedCarts: [...state.parkedCarts, snapshot],
        items: [],
        selectedItemIndex: -1
      };
    });
  },

  restoreParkedCart: (index) => {
    set((state) => {
      const parked = state.parkedCarts[index];
      if (!parked) return state;
      
      const newParked = [...state.parkedCarts];
      newParked.splice(index, 1);
      
      return {
        items: parked.items,
        parkedCarts: newParked,
        selectedItemIndex: parked.items.length > 0 ? 0 : -1
      };
    });
  },

  removeParkedCart: (index) => {
    set((state) => {
      const newParked = [...state.parkedCarts];
      newParked.splice(index, 1);
      return { parkedCarts: newParked };
    });
  },

  setProcessing: (v) => set({ isProcessing: v }),
  
  setLastSaleResult: (result) => set({ lastSaleResult: result }),
  
  setErrorMessage: (msg) => set({ errorMessage: msg }),

  appendBarcodeChar: (char) => {
    set((state) => {
      const now = Date.now();
      // If time since last char is > 50ms, it's likely a keyboard typing, so clear buffer
      // and start fresh. If < 50ms, it's a scanner.
      let newBuffer = state.barcodeBuffer;
      if (now - state.lastBarcodeTime > 50) {
        newBuffer = char;
      } else {
        newBuffer += char;
      }
      return { barcodeBuffer: newBuffer, lastBarcodeTime: now };
    });
  },

  clearBarcodeBuffer: () => set({ barcodeBuffer: '', lastBarcodeTime: 0 }),

  getBarcodeAndClear: () => {
    const { barcodeBuffer } = get();
    set({ barcodeBuffer: '', lastBarcodeTime: 0 });
    return barcodeBuffer;
  }
}));
