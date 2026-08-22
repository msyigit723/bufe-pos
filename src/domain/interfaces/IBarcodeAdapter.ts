export interface BarcodeScanEvent {
  barcode: string;
  scannedAt: Date;
  rawInput?: string;
}

export interface IBarcodeAdapter {
  adapterName: string;
  isListening: boolean;
  startListening(onScan: (event: BarcodeScanEvent) => void): Promise<void>;
  stopListening(): Promise<void>;
}
