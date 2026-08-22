import { invoke } from '@tauri-apps/api/core';

export interface CashSessionDto {
  id: number;
  cash_register_id: number;
  user_id: number;
  opening_balance_kurus: number;
  closing_balance_kurus: number | null;
  expected_balance_kurus: number | null;
  status: string;
  opened_at: string;
  closed_at: string | null;
}

export interface CashMovementDto {
  id: number;
  movement_type: string;
  amount_kurus: number;
  note: string | null;
  created_at: string;
}

export class CashService {
  static async openCashRegister(cashRegisterId: number, openingBalanceKurus: number): Promise<number> {
    try {
      return await invoke<number>('open_cash_register', { cashRegisterId, openingBalanceKurus });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }

  static async getActiveCashSession(cashRegisterId: number): Promise<CashSessionDto | null> {
    try {
      return await invoke<CashSessionDto | null>('get_active_cash_session', { cashRegisterId });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }

  static async addCashMovement(cashRegisterId: number, movementType: string, amountKurus: number, note: string | null): Promise<void> {
    try {
      await invoke('add_cash_movement', { cashRegisterId, movementType, amountKurus, note });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }

  static async closeCashRegister(sessionId: number, expectedBalanceKurus: number, actualBalanceKurus: number): Promise<void> {
    try {
      await invoke('close_cash_register', { sessionId, expectedBalanceKurus, actualBalanceKurus });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }

  static async getCashMovements(cashRegisterId: number): Promise<CashMovementDto[]> {
    try {
      return await invoke<CashMovementDto[]>('get_cash_movements', { cashRegisterId });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }
}
