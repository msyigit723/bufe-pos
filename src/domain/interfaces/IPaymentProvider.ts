import { Money } from "../value-objects/Money";
import { PaymentType } from "../enums";

export interface PaymentRequest {
  saleId: number;
  syncId: string;
  amount: Money;
  paymentType: PaymentType;
}

export interface PaymentResponse {
  success: boolean;
  transactionRef?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface IPaymentProvider {
  providerName: string;
  processPayment(request: PaymentRequest): Promise<PaymentResponse>;
  cancelPayment(transactionRef: string): Promise<boolean>;
}
