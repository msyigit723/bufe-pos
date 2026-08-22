// Cart Domain Entity - All calculations in integer kuruş

export interface CartItem {
  productId: number;
  barcode: string | null;
  code: string;
  name: string;
  unitName: string;
  quantity: number;
  unitPriceKurus: number;
  discountKurus: number;
  vatRate: number;
}

export class Cart {
  private _items: CartItem[] = [];

  get items(): CartItem[] { return [...this._items]; }
  get itemCount(): number { return this._items.length; }
  get isEmpty(): boolean { return this._items.length === 0; }

  addItem(product: { id: number; code: string; name: string; unitName: string; salePriceKurus: number; vatRate: number; primaryBarcode: string | null; isActive: boolean }, barcode?: string, quantity: number = 1): void {
    if (!product.isActive) throw new Error('Pasif ürün sepete eklenemez.');
    if (quantity <= 0) throw new Error('Miktar sıfır veya negatif olamaz.');
    
    const existing = this._items.find(i => i.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this._items.push({
        productId: product.id,
        barcode: barcode || product.primaryBarcode,
        code: product.code,
        name: product.name,
        unitName: product.unitName,
        quantity,
        unitPriceKurus: product.salePriceKurus,
        discountKurus: 0,
        vatRate: product.vatRate,
      });
    }
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) throw new Error('Miktar sıfır veya negatif olamaz.');
    const item = this._items.find(i => i.productId === productId);
    if (item) item.quantity = quantity;
  }

  updateDiscount(productId: number, discountKurus: number): void {
    if (discountKurus < 0) throw new Error('İndirim negatif olamaz.');
    const item = this._items.find(i => i.productId === productId);
    if (item) item.discountKurus = discountKurus;
  }

  removeItem(productId: number): void {
    this._items = this._items.filter(i => i.productId !== productId);
  }

  clear(): void {
    this._items = [];
  }

  // Line total for an item (kuruş): unitPrice * quantity - discount
  static lineTotal(item: CartItem): number {
    return Math.round(item.unitPriceKurus * item.quantity) - item.discountKurus;
  }

  // VAT amount for an item (kuruş): lineTotal * vatRate / (100 + vatRate)
  static lineVat(item: CartItem): number {
    const lt = Cart.lineTotal(item);
    return Math.round((lt * item.vatRate) / (100 + item.vatRate));
  }

  get subtotalKurus(): number {
    return this._items.reduce((sum, item) => sum + Cart.lineTotal(item), 0);
  }

  get discountTotalKurus(): number {
    return this._items.reduce((sum, item) => sum + item.discountKurus, 0);
  }

  get vatTotalKurus(): number {
    return this._items.reduce((sum, item) => sum + Cart.lineVat(item), 0);
  }

  get grandTotalKurus(): number {
    return this.subtotalKurus;
  }

  // Create a snapshot for parking
  snapshot(): { items: CartItem[]; timestamp: number } {
    return { items: [...this._items.map(i => ({...i}))], timestamp: Date.now() };
  }

  // Restore from snapshot
  restore(snapshot: { items: CartItem[] }): void {
    this._items = snapshot.items.map(i => ({...i}));
  }
}
