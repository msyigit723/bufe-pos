import { invoke } from "@tauri-apps/api/core";
import { Category } from "../../domain/entities/Category";
import { Logger } from "../../infrastructure/logging/Logger";

interface CategoryDto {
  id: number;
  name: string;
  sort_order: number;
  color_code: string;
  is_active: boolean;
  product_count: number;
}

export class CategoryService {
  public static async listCategories(): Promise<Category[]> {
    try {
      const dtos = await invoke<CategoryDto[]>("list_categories");
      return dtos.map(
        (dto) =>
          new Category({
            id: dto.id,
            name: dto.name,
            sortOrder: dto.sort_order,
            colorCode: dto.color_code,
            isActive: dto.is_active,
            productCount: dto.product_count,
          })
      );
    } catch (error) {
      Logger.error("Kategoriler listelenirken hata oluştu", error);
      throw new Error(
        typeof error === "string" ? error : "Kategoriler yüklenirken bir hata oluştu."
      );
    }
  }

  public static async createCategory(input: {
    name: string;
    sortOrder?: number;
    colorCode?: string;
  }): Promise<Category> {
    try {
      const dto = await invoke<CategoryDto>("create_category", {
        input: {
          name: input.name,
          sort_order: input.sortOrder,
          color_code: input.colorCode,
        },
      });
      return new Category({
        id: dto.id,
        name: dto.name,
        sortOrder: dto.sort_order,
        colorCode: dto.color_code,
        isActive: dto.is_active,
        productCount: dto.product_count,
      });
    } catch (error) {
      Logger.error("Kategori eklenirken hata oluştu", error);
      throw new Error(
        typeof error === "string" ? error : "Kategori eklenirken bir hata oluştu."
      );
    }
  }

  public static async updateCategory(input: {
    id: number;
    name: string;
    sortOrder: number;
    colorCode: string;
    isActive: boolean;
  }): Promise<Category> {
    try {
      const dto = await invoke<CategoryDto>("update_category", {
        input: {
          id: input.id,
          name: input.name,
          sort_order: input.sortOrder,
          color_code: input.colorCode,
          is_active: input.isActive,
        },
      });
      return new Category({
        id: dto.id,
        name: dto.name,
        sortOrder: dto.sort_order,
        colorCode: dto.color_code,
        isActive: dto.is_active,
        productCount: dto.product_count,
      });
    } catch (error) {
      Logger.error("Kategori güncellenirken hata oluştu", error);
      throw new Error(
        typeof error === "string" ? error : "Kategori güncellenirken bir hata oluştu."
      );
    }
  }

  public static async deleteCategory(id: number): Promise<boolean> {
    try {
      return await invoke<boolean>("delete_category", { id });
    } catch (error) {
      Logger.error("Kategori silinirken hata oluştu", error);
      throw new Error(
        typeof error === "string" ? error : "Kategori silinirken bir hata oluştu."
      );
    }
  }
}
