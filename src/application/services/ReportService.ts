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

export interface DailyRevenueDto {
  date: string;
  gross_sales_kurus: number;
  cancelled_amount_kurus: number;
  refunded_amount_kurus: number;
  net_revenue_kurus: number;
  cash_revenue_kurus: number;
  card_revenue_kurus: number;
  credit_revenue_kurus: number;
  debt_collection_kurus: number;
}

export interface MonthlyRevenueReportDto {
  year: number;
  month: number;
  total_net_revenue_kurus: number;
  total_cash_revenue_kurus: number;
  total_card_revenue_kurus: number;
  total_credit_revenue_kurus: number;
  total_debt_collection_kurus: number;
  total_cancelled_amount_kurus: number;
  total_refunded_amount_kurus: number;
  days: DailyRevenueDto[];
}

export class ReportService {
  static async getDailySalesSummary(startDate: string, endDate: string): Promise<DailySalesSummaryDto> {
    try {
      return await invoke<DailySalesSummaryDto>('get_daily_sales_summary', { startDate, endDate });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }

  static async getMonthlyRevenueReport(year: number, month: number): Promise<MonthlyRevenueReportDto> {
    try {
      return await invoke<MonthlyRevenueReportDto>('get_monthly_revenue_report', { year, month });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }
}
