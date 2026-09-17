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

export interface SaleSummaryDto {
  id: number;
  receipt_no: string;
  total_amount_kurus: number;
  payment_status: string;
  item_count: number;
  created_at: string;
  status: string;
  refunded_amount_kurus: number;
}

export interface SaleDetailItemDto {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  refunded_quantity: number;
  unit_price_kurus: number;
  line_total_kurus: number;
}

export interface SaleDetailDto {
  id: number;
  receipt_no: string;
  status: string;
  total_amount_kurus: number;
  refunded_amount_kurus: number;
  items: SaleDetailItemDto[];
  created_at: string;
}

export interface RefundItemInput {
  sale_item_id: number;
  quantity: number;
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

  static async getRecentSales(limit: number = 50): Promise<SaleSummaryDto[]> {
    try {
      return await invoke<SaleSummaryDto[]>('get_recent_sales', { limit });
    } catch (error) {
      Logger.error('Son satışları getirme başarısız', error);
      throw new Error(this.formatErrorMessage(error, 'Satış geçmişi alınamadı.'));
    }
  }

  static async getSalesHistory(days: number = 7): Promise<SaleSummaryDto[]> {
    try {
      return await invoke<SaleSummaryDto[]>('get_sales_history', { days });
    } catch (error) {
      Logger.error('Satış geçmişi getirme başarısız', error);
      throw new Error(this.formatErrorMessage(error, 'Satış geçmişi alınamadı.'));
    }
  }

  static async cancelSale(saleId: number, userId: number, reason?: string): Promise<void> {
    try {
      await invoke('cancel_sale', { saleId, userId, reason: reason || null });
    } catch (error) {
      Logger.error('Satış iptal etme başarısız', error);
      throw new Error(this.formatErrorMessage(error, 'Satış iptal edilemedi.'));
    }
  }

  static async getSaleDetails(saleId: number): Promise<SaleDetailDto> {
    try {
      return await invoke<SaleDetailDto>('get_sale_details', { saleId });
    } catch (error) {
      Logger.error('Satış detayı getirme başarısız', error);
      throw new Error(this.formatErrorMessage(error, 'Satış detayları alınamadı.'));
    }
  }

  static async refundSale(saleId: number, userId: number, items: RefundItemInput[], reason?: string): Promise<void> {
    try {
      await invoke('refund_sale', { saleId, userId, items, reason: reason || null });
    } catch (error) {
      Logger.error('İade işlemi başarısız', error);
      throw new Error(this.formatErrorMessage(error, 'İade işlemi yapılamadı.'));
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
