import { invoke } from "@tauri-apps/api/core";
import { Logger } from "../../infrastructure/logging/Logger";

export interface AppSettingsDto {
  business_name: string;
  phone: string;
  address: string;
  receipt_footer: string;
  default_vat_rate: number;
}

export interface BackupResultDto {
  success: boolean;
  backup_path: string;
  size_bytes: number;
}

export class SettingsService {
  public static async getAppSettings(): Promise<AppSettingsDto> {
    try {
      return await invoke<AppSettingsDto>("get_app_settings");
    } catch (error) {
      Logger.error("Ayarlar alınamadı", error);
      return {
        business_name: "Büfe Otomasyonu",
        phone: "",
        address: "",
        receipt_footer: "Teşekkür Ederiz Yine Bekleriz",
        default_vat_rate: 20.0,
      };
    }
  }

  public static async updateAppSettings(settings: AppSettingsDto): Promise<void> {
    try {
      await invoke("update_app_settings", { settings });
    } catch (error) {
      Logger.error("Ayarlar kaydedilemedi", error);
      throw new Error(typeof error === "string" ? error : "Ayarlar kaydedilemedi.");
    }
  }

  public static async backupDatabase(destinationPath?: string): Promise<BackupResultDto> {
    try {
      return await invoke<BackupResultDto>("backup_database", {
        destinationPath: destinationPath || null,
      });
    } catch (error) {
      Logger.error("Veritabanı yedekleme başarısız", error);
      throw new Error(
        typeof error === "string" ? error : "Veritabanı yedeklenirken hata oluştu."
      );
    }
  }
}
