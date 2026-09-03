import { invoke } from '@tauri-apps/api/core';
import { Logger } from '../../infrastructure/logging/Logger';

export interface ProcessSaleItemInput {
  product_id: number;
  barcode: string | null;
  quantity: number;
  unit_price_kurus: number;
  discount_amount_kurus: number;
  vat_rate: number;
}

export interface ProcessSalePaymentInput {
  payment_type: string;
  amount_kurus: number;
}

export interface ProcessSaleInput {
  items: ProcessSaleItemInput[];
  payments: ProcessSalePaymentInput[];
  customer_id: number | null;
  cash_register_id: number | null;
}

export interface SaleItemResultDto {
  product_name: string;
  quantity: number;
  unit_price_kurus: number;
  line_total_kurus: number;
}

export interface SalePaymentResultDto {
  payment_type: string;
  amount_kurus: number;
}

export interface SaleResultDto {
  sale_id: number;
  receipt_no: string;
  subtotal_kurus: number;
  discount_amount_kurus: number;
  vat_amount_kurus: number;
  total_amount_kurus: number;
  items: SaleItemResultDto[];
  payments: SalePaymentResultDto[];
  change_amount_kurus: number;
  created_at: string;
}

export class SaleService {
  static async processSale(payload: ProcessSaleInput): Promise<SaleResultDto> {
    try {
      Logger.info('Satış işlemi başlatılıyor', payload);
      const result = await invoke<SaleResultDto>('process_sale', { input: payload });
      return result;
    } catch (error) {
      Logger.error('Satış işlemi başarısız', error);
      throw new Error(this.formatErrorMessage(error, 'Satış işlemi sırasında bir hata oluştu.'));
    }
  }

  static async getRecentSales(limit: number = 50): Promise<SaleResultDto[]> {
    try {
      return await invoke<SaleResultDto[]>('get_recent_sales', { limit });
    } catch (error) {
      Logger.error('Son satışları getirme başarısız', error);
      throw new Error(this.formatErrorMessage(error, 'Satış geçmişi alınamadı.'));
    }
  }

  static async getPosInitialState(): Promise<any> {
    try {
      return await invoke('get_pos_initial_state');
    } catch (error) {
      Logger.error('POS başlangıç durumu alınamadı', error);
      throw new Error(this.formatErrorMessage(error, 'Kasa durumu alınamadı.'));
    }
  }

  private static formatErrorMessage(error: any, defaultMessage: string): string {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return defaultMessage;
  }
}
