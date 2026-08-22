import { Money } from "../value-objects/Money";

export interface ReceiptItemModel {
  productName: string;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
}

export interface ReceiptModel {
  receiptNo: string;
  date: Date;
  cashierName: string;
  items: ReceiptItemModel[];
  subtotal: Money;
  vatTotal: Money;
  discountTotal: Money;
  grandTotal: Money;
  paidAmount: Money;
  changeAmount: Money;
  paymentType: string;
}

export interface PrintResult {
  success: boolean;
  message?: string;
  errorCode?: string;
}

export interface IPrinterAdapter {
  printerName: string;
  paperWidthMm: 58 | 80;
  printReceipt(receipt: ReceiptModel): Promise<PrintResult>;
  openCashDrawer(): Promise<boolean>;
}
