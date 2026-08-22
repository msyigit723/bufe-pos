import { invoke } from "@tauri-apps/api/core";
import { Logger } from "../../infrastructure/logging/Logger";

export interface SupplierDto {
  id: number;
  name: string;
  phone: string | null;
  note: string | null;
  balance_kurus: number;
  is_active: boolean;
}

export interface PurchaseItemInput {
  productId: number;
  quantity: number;
  unitCostKurus: number;
}

export interface ProcessPurchaseInput {
  supplierId?: number;
  paymentType: "PESIN" | "VERESIYE";
  items: PurchaseItemInput[];
  note?: string;
  cashRegisterId?: number;
}

export class PurchaseService {
  public static async listSuppliers(search?: string): Promise<SupplierDto[]> {
    try {
      return await invoke<SupplierDto[]>("list_suppliers", {
        search: search || null,
      });
    } catch (error) {
      Logger.error("Tedarikçiler listelenemedi", error);
      throw new Error(typeof error === "string" ? error : "Tedarikçi listesi alınamadı.");
    }
  }

  public static async createSupplier(
    name: string,
    phone?: string,
    note?: string
  ): Promise<number> {
    try {
      return await invoke<number>("create_supplier", {
        name,
        phone: phone || null,
        note: note || null,
      });
    } catch (error) {
      Logger.error("Tedarikçi eklenemedi", error);
      throw new Error(typeof error === "string" ? error : "Tedarikçi eklenemedi.");
    }
  }

  public static async updateSupplier(
    id: number,
    name: string,
    phone?: string,
    note?: string
  ): Promise<void> {
    try {
      await invoke("update_supplier", {
        id,
        name,
        phone: phone || null,
        note: note || null,
      });
    } catch (error) {
      Logger.error("Tedarikçi güncellenemedi", error);
      throw new Error(typeof error === "string" ? error : "Tedarikçi güncellenemedi.");
    }
  }

  public static async processPurchaseInvoice(input: ProcessPurchaseInput): Promise<void> {
    try {
      await invoke("process_purchase_invoice", {
        input: {
          supplier_id: input.supplierId || null,
          payment_type: input.paymentType,
          items: input.items.map((it) => ({
            product_id: it.productId,
            quantity: it.quantity,
            unit_cost_kurus: it.unitCostKurus,
          })),
          note: input.note || null,
          cash_register_id: input.cashRegisterId || null,
        },
      });
    } catch (error) {
      Logger.error("Alış faturası işlenemedi", error);
      throw new Error(typeof error === "string" ? error : "Alış işlemi kaydedilemedi.");
    }
  }

  public static async paySupplier(
    supplierId: number,
    amountKurus: number,
    cashRegisterId: number,
    note?: string
  ): Promise<void> {
    try {
      await invoke("pay_supplier", {
        supplierId,
        amountKurus,
        cashRegisterId,
        note: note || null,
      });
    } catch (error) {
      Logger.error("Tedarikçi ödemesi yapılamadı", error);
      throw new Error(typeof error === "string" ? error : "Tedarikçi ödemesi yapılamadı.");
    }
  }
}
