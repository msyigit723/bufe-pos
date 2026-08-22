import { Money } from "../value-objects/Money";

export interface IProductBarcode {
  id: number;
  productId: number;
  barcode: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface IProductProps {
  id: number;
  code: string;
  name: string;
  categoryId?: number | null;
  categoryName?: string | null;
  unitName: string;
  costPriceKurus: number;
  salePriceKurus: number;
  vatRate: number;
  minStockLevel: number;
  trackSKT: boolean;
  isActive: boolean;
  barcodes: IProductBarcode[];
  createdAt: string;
  updatedAt: string;
}

export class Product {
  private props: IProductProps;

  public static create(props: Partial<IProductProps> & { name: string; costPriceKurus: number; salePriceKurus: number }): Product {
    return new Product({
      id: props.id ?? 0,
      code: props.code ?? `PRD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      name: props.name,
      categoryId: props.categoryId ?? null,
      categoryName: props.categoryName ?? null,
      unitName: props.unitName || "Adet",
      costPriceKurus: props.costPriceKurus,
      salePriceKurus: props.salePriceKurus,
      vatRate: props.vatRate ?? 20,
      minStockLevel: props.minStockLevel ?? 5,
      trackSKT: props.trackSKT ?? false,
      isActive: props.isActive !== false,
      barcodes: props.barcodes || [],
      createdAt: props.createdAt || new Date().toISOString(),
      updatedAt: props.updatedAt || new Date().toISOString(),
    });
  }

  constructor(props: IProductProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error("Ürün adı boş bırakılamaz.");
    }
    if (!props.code || props.code.trim().length === 0) {
      throw new Error("Ürün stok kodu boş bırakılamaz.");
    }
    if (props.costPriceKurus < 0) {
      throw new Error("Alış fiyatı negatif olamaz.");
    }
    if (props.salePriceKurus < 0) {
      throw new Error("Satış fiyatı negatif olamaz.");
    }

    this.props = {
      ...props,
      name: props.name.trim(),
      code: props.code.trim(),
      unitName: props.unitName || "Adet",
      vatRate: props.vatRate ?? 20,
      minStockLevel: props.minStockLevel ?? 5,
      barcodes: props.barcodes || [],
    };
  }

  get id(): number { return this.props.id; }
  get code(): string { return this.props.code; }
  get name(): string { return this.props.name; }
  get categoryId(): number | null | undefined { return this.props.categoryId; }
  get categoryName(): string | null | undefined { return this.props.categoryName; }
  get unitName(): string { return this.props.unitName; }
  get vatRate(): number { return this.props.vatRate; }
  get minStockLevel(): number { return this.props.minStockLevel; }
  get trackSKT(): boolean { return this.props.trackSKT; }
  get isActive(): boolean { return this.props.isActive; }
  get barcodes(): IProductBarcode[] { return this.props.barcodes; }
  get createdAt(): string { return this.props.createdAt; }
  get updatedAt(): string { return this.props.updatedAt; }

  get primaryBarcode(): string | null {
    const primary = this.props.barcodes.find((b) => b.isPrimary);
    if (primary) return primary.barcode;
    return this.props.barcodes.length > 0 ? this.props.barcodes[0].barcode : null;
  }

  get salePrice(): Money {
    return Money.fromKurus(this.props.salePriceKurus);
  }

  get costPrice(): Money {
    return Money.fromKurus(this.props.costPriceKurus);
  }
}
