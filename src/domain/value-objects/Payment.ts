export type PaymentType = 'NAKIT' | 'KREDI_KARTI' | 'CARI_VERESIYE';

export const PaymentTypeLabels: Record<PaymentType, string> = {
  NAKIT: 'Nakit',
  KREDI_KARTI: 'Kredi Kartı',
  CARI_VERESIYE: 'Veresiye',
};

export interface PaymentEntry {
  type: PaymentType;
  amountKurus: number;
}
