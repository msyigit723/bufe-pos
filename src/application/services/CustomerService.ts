import { invoke } from '@tauri-apps/api/core';

export interface CustomerDto {
  id: number;
  name: string;
  phone: string | null;
  balance_kurus: number;
}

export interface CustomerHistoryDto {
  date: string;
  description: string;
  amount_kurus: number;
}

export class CustomerService {
  static async createCustomer(name: string, phone: string | null): Promise<number> {
    try {
      return await invoke<number>('create_customer', { name, phone });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }

  static async updateCustomer(id: number, name: string, phone: string | null): Promise<void> {
    try {
      await invoke('update_customer', { id, name, phone });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }

  static async listCustomers(search: string | null): Promise<CustomerDto[]> {
    try {
      return await invoke<CustomerDto[]>('list_customers', { search });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }

  static async getCustomerHistory(customerId: number): Promise<CustomerHistoryDto[]> {
    try {
      return await invoke<CustomerHistoryDto[]>('get_customer_history', { customerId });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }

  static async receivePayment(customerId: number, amountKurus: number, paymentType: string, cashRegisterId: number): Promise<void> {
    try {
      await invoke('receive_customer_payment', { customerId, amountKurus, paymentType, cashRegisterId });
    } catch (error: any) {
      throw new Error(error.toString());
    }
  }
}
