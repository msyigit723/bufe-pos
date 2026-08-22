import type { IPaymentProvider, PaymentRequest, PaymentResponse } from "../../../domain/interfaces/IPaymentProvider";

export class DummyPaymentProvider implements IPaymentProvider {
  public providerName = "Manual POS Adapter";

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log(`[${this.providerName}] Processing payment:`, request);
    return {
      success: true,
      transactionRef: `MANUAL-${Date.now()}`,
    };
  }

  async cancelPayment(transactionRef: string): Promise<boolean> {
    console.log(`[${this.providerName}] Cancelled payment ref:`, transactionRef);
    return true;
  }
}
