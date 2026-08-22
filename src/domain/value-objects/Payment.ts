export type PaymentType = 'NAKIT' | 'KREDI_KARTI' | 'CARI_VERESIYE' | 'QR';

export const PaymentTypeLabels: Record<PaymentType, string> = {
  NAKIT: 'Nakit',
  KREDI_KARTI: 'Kredi Kartı',
  CARI_VERESIYE: 'Cari / Veresiye',
  QR: 'QR Ödeme',
};

export interface PaymentEntry {
  type: PaymentType;
  amountKurus: number;
}
