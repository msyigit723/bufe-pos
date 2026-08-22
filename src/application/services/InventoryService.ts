import { invoke } from "@tauri-apps/api/core";
import { Logger } from "../../infrastructure/logging/Logger";

export interface InventoryItemDto {
  product_id: number;
  product_code: string;
  product_name: string;
  primary_barcode: string | null;
  category_name: string | null;
  unit_name: string;
  cost_price_kurus: number;
  sale_price_kurus: number;
  current_stock: number;
  min_stock_level: number;
  status: "NORMAL" | "CRITICAL" | "OUT_OF_STOCK";
}

export interface StockMovementDto {
  id: number;
  product_id: number;
  product_name: string;
  barcode: string | null;
  movement_type: string;
  quantity: number;
  unit_price_kurus: number;
  note: string | null;
  created_at: string;
}

export class InventoryService {
  public static async getInventoryList(
    filter?: "ALL" | "CRITICAL" | "OUT_OF_STOCK",
    search?: string
  ): Promise<InventoryItemDto[]> {
    try {
      return await invoke<InventoryItemDto[]>("get_inventory_list", {
        filter: filter || "ALL",
        search: search || null,
      });
    } catch (error) {
      Logger.error("Stok listesi alınamadı", error);
      throw new Error(typeof error === "string" ? error : "Stok listesi alınamadı.");
    }
  }

  public static async addStockAdjustment(input: {
    productId: number;
    adjustmentType: "GIRIS" | "CIKIS" | "SAYIM" | "FIRE";
    quantity: number;
    note?: string;
  }): Promise<void> {
    try {
      await invoke("add_stock_adjustment", {
        input: {
          product_id: input.productId,
          adjustment_type: input.adjustmentType,
          quantity: input.quantity,
          note: input.note || null,
        },
      });
    } catch (error) {
      Logger.error("Stok düzeltme işlemi başarısız", error);
      throw new Error(typeof error === "string" ? error : "Stok düzeltme yapılamadı.");
    }
  }

  public static async getStockMovements(
    productId?: number,
    limit?: number
  ): Promise<StockMovementDto[]> {
    try {
      return await invoke<StockMovementDto[]>("get_stock_movements", {
        productId: productId || null,
        limit: limit || 50,
      });
    } catch (error) {
      Logger.error("Stok hareketleri alınamadı", error);
      throw new Error(typeof error === "string" ? error : "Stok hareketleri alınamadı.");
    }
  }
}
