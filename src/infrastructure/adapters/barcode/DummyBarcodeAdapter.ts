import type { BarcodeScanEvent, IBarcodeAdapter } from "../../../domain/interfaces/IBarcodeAdapter";

export class DummyBarcodeAdapter implements IBarcodeAdapter {
  public adapterName = "Dummy HID Barcode Scanner";
  public isListening = false;

  async startListening(_onScan: (event: BarcodeScanEvent) => void): Promise<void> {
    this.isListening = true;
    console.log(`[${this.adapterName}] Started keyboard emulation listener.`);
  }

  async stopListening(): Promise<void> {
    this.isListening = false;
    console.log(`[${this.adapterName}] Stopped listening.`);
  }
}
