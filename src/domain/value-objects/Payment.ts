export type PaymentType = 'NAKIT' | 'KREDI_KARTI';

export const PaymentTypeLabels: Record<PaymentType, string> = {
  NAKIT: 'Nakit',
  KREDI_KARTI: 'Kredi Kartı',
};

export interface PaymentEntry {
  type: PaymentType;
  amountKurus: number;
}
