import { invoke } from "@tauri-apps/api/core";
import { Product, type IProductBarcode } from "../../domain/entities/Product";
import { Logger } from "../../infrastructure/logging/Logger";

interface BarcodeDto {
  id: number;
  product_id: number;
  barcode: string;
  is_primary: boolean;
  created_at: string;
}

interface ProductDto {
  id: number;
  code: string;
  name: string;
  category_id: number | null;
  category_name: string | null;
  unit_name: string;
  cost_price_kurus: number;
  sale_price_kurus: number;
  vat_rate: number;
  min_stock_level: number;
  track_skt: boolean;
  is_active: boolean;
  barcodes: BarcodeDto[];
  created_at: string;
  updated_at: string;
}

function mapProductDtoToEntity(dto: ProductDto): Product {
  return new Product({
    id: dto.id,
    code: dto.code,
    name: dto.name,
    categoryId: dto.category_id,
    categoryName: dto.category_name,
    unitName: dto.unit_name,
    costPriceKurus: dto.cost_price_kurus,
    salePriceKurus: dto.sale_price_kurus,
    vatRate: dto.vat_rate,
    minStockLevel: dto.min_stock_level,
    trackSKT: dto.track_skt,
    isActive: dto.is_active,
    barcodes: (dto.barcodes || []).map((b) => ({
      id: b.id,
      productId: b.product_id,
      barcode: b.barcode,
      isPrimary: b.is_primary,
      createdAt: b.created_at,
    })),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  });
}

export class ProductService {
  public static async listProducts(filter?: {
    search?: string;
    categoryId?: number;
    isActive?: boolean;
  }): Promise<Product[]> {
    try {
      const dtos = await invoke<ProductDto[]>("list_products", {
        filter: {
          search: filter?.search || null,
          category_id: filter?.categoryId || null,
          is_active: filter?.isActive !== undefined ? filter.isActive : null,
        },
      });
      return dtos.map(mapProductDtoToEntity);
    } catch (error) {
      Logger.error("Ürünler listelenirken hata oluştu", error);
      throw new Error(
        typeof error === "string" ? error : "Ürünler listelenirken bir hata oluştu."
      );
    }
  }

  public static async getProductById(id: number): Promise<Product | null> {
    try {
      const dto = await invoke<ProductDto | null>("get_product_by_id", { id });
      return dto ? mapProductDtoToEntity(dto) : null;
    } catch (error) {
      Logger.error(`Ürün bilgisi alınamadı (ID: ${id})`, error);
      throw new Error(
        typeof error === "string" ? error : "Ürün bilgisi alınamadı."
      );
    }
  }

  public static async searchProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const dto = await invoke<ProductDto | null>("search_product_by_barcode", { barcode });
      return dto ? mapProductDtoToEntity(dto) : null;
    } catch (error) {
      Logger.error(`Barkod ile ürün aranamadı: ${barcode}`, error);
      throw new Error(
        typeof error === "string" ? error : "Barkod ile arama yapılırken bir hata oluştu."
      );
    }
  }

  public static async createProduct(input: {
    code?: string;
    name: string;
    categoryId?: number | null;
    unitName?: string;
    costPriceKurus: number;
    salePriceKurus: number;
    vatRate?: number;
    minStockLevel?: number;
    trackSKT?: boolean;
    isActive?: boolean;
    initialBarcode?: string;
  }): Promise<Product> {
    try {
      const dto = await invoke<ProductDto>("create_product", {
        input: {
          code: input.code || "",
          name: input.name,
          category_id: input.categoryId || null,
          unit_name: input.unitName || "Adet",
          cost_price_kurus: input.costPriceKurus,
          sale_price_kurus: input.salePriceKurus,
          vat_rate: input.vatRate ?? 20.0,
          min_stock_level: input.minStockLevel ?? 5.0,
          track_skt: input.trackSKT ?? false,
          is_active: input.isActive ?? true,
          initial_barcode: input.initialBarcode || null,
        },
      });
      return mapProductDtoToEntity(dto);
    } catch (error) {
      Logger.error("Ürün eklenirken hata oluştu", error);
      throw new Error(
        typeof error === "string" ? error : "Ürün eklenirken bir hata oluştu."
      );
    }
  }

  public static async updateProduct(input: {
    id: number;
    code: string;
    name: string;
    categoryId?: number | null;
    unitName: string;
    costPriceKurus: number;
    salePriceKurus: number;
    vatRate: number;
    minStockLevel: number;
    trackSKT: boolean;
    isActive: boolean;
  }): Promise<Product> {
    try {
      const dto = await invoke<ProductDto>("update_product", {
        input: {
          id: input.id,
          code: input.code,
          name: input.name,
          category_id: input.categoryId || null,
          unit_name: input.unitName,
          cost_price_kurus: input.costPriceKurus,
          sale_price_kurus: input.salePriceKurus,
          vat_rate: input.vatRate,
          min_stock_level: input.minStockLevel,
          track_skt: input.trackSKT,
          is_active: input.isActive,
        },
      });
      return mapProductDtoToEntity(dto);
    } catch (error) {
      Logger.error("Ürün güncellenirken hata oluştu", error);
      throw new Error(
        typeof error === "string" ? error : "Ürün güncellenirken bir hata oluştu."
      );
    }
  }

  public static async setProductActive(id: number, isActive: boolean): Promise<boolean> {
    try {
      return await invoke<boolean>("set_product_active", { id, isActive });
    } catch (error) {
      Logger.error(`Ürün aktiflik durumu değiştirilemedi (ID: ${id})`, error);
      throw new Error(
        typeof error === "string" ? error : "Ürün durumu güncellenirken hata oluştu."
      );
    }
  }

  public static async deleteProduct(id: number): Promise<boolean> {
    try {
      return await invoke<boolean>("delete_product", { id });
    } catch (error) {
      Logger.error(`Ürün silinemedi (ID: ${id})`, error);
      throw new Error(
        typeof error === "string" ? error : "Ürün silinirken bir hata oluştu."
      );
    }
  }

  public static async addProductBarcode(
    productId: number,
    barcode: string,
    isPrimary: boolean
  ): Promise<IProductBarcode> {
    try {
      const dto = await invoke<BarcodeDto>("add_product_barcode", {
        productId,
        barcode,
        isPrimary,
      });
      return {
        id: dto.id,
        productId: dto.product_id,
        barcode: dto.barcode,
        isPrimary: dto.is_primary,
        createdAt: dto.created_at,
      };
    } catch (error) {
      Logger.error(`Barkod eklenemedi (Ürün: ${productId}, Barkod: ${barcode})`, error);
      throw new Error(
        typeof error === "string" ? error : "Barkod eklenirken bir hata oluştu."
      );
    }
  }

  public static async removeProductBarcode(barcodeId: number): Promise<boolean> {
    try {
      return await invoke<boolean>("remove_product_barcode", { barcodeId });
    } catch (error) {
      Logger.error(`Barkod silinemedi (Barkod ID: ${barcodeId})`, error);
      throw new Error(
        typeof error === "string" ? error : "Barkod silinirken bir hata oluştu."
      );
    }
  }

  public static async setPrimaryBarcode(productId: number, barcodeId: number): Promise<boolean> {
    try {
      return await invoke<boolean>("set_primary_barcode", { productId, barcodeId });
    } catch (error) {
      Logger.error(`Birincil barkod ayarlanamadı (Ürün: ${productId}, Barkod ID: ${barcodeId})`, error);
      throw new Error(
        typeof error === "string" ? error : "Birincil barkod ayarlanırken bir hata oluştu."
      );
    }
  }
}
