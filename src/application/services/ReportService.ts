import { invoke } from '@tauri-apps/api/core';

export interface DailySalesSummaryDto {
  total_sales_kurus: number;
  sale_count: number;
  total_items_sold: number;
  total_discount_kurus: number;
  total_vat_kurus: number;
  cash_total_kurus: number;
  credit_card_total_kurus: number;
  qr_total_kurus: number;
  veresiye_total_kurus: number;
}

export class ReportService {
  static async getDailySalesSummary(startDate: string, endDate: string): Promise<DailySalesSummaryDto> {
    try {
      return await invoke<DailySalesSummaryDto>('get_daily_sales_summary', { startDate, endDate });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }
}
