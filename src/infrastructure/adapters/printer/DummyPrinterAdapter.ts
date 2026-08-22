import type { IPrinterAdapter, PrintResult, ReceiptModel } from "../../../domain/interfaces/IPrinterAdapter";

export class DummyPrinterAdapter implements IPrinterAdapter {
  public printerName = "Dummy 80mm ESC/POS Printer";
  public paperWidthMm: 58 | 80 = 80;

  async printReceipt(receipt: ReceiptModel): Promise<PrintResult> {
    console.log(`[${this.printerName}] Simulated print for receipt:`, receipt.receiptNo);
    return {
      success: true,
      message: `Simulated receipt print #${receipt.receiptNo} successful`,
    };
  }

  async openCashDrawer(): Promise<boolean> {
    console.log(`[${this.printerName}] Simulated RJ11 cash drawer pulse kick sent.`);
    return true;
  }
}
