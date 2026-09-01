import { invoke } from "@tauri-apps/api/core";

export interface HealthCheckResponse {
  foreign_keys_active: boolean;
  wal_mode_active: boolean;
  total_tables: number;
  status: string;
}

export class DatabaseService {
  public static async dbHealthCheck(): Promise<HealthCheckResponse> {
    return await invoke<HealthCheckResponse>("db_health_check");
  }

  public static async runMigrations(): Promise<string> {
    return await invoke<string>("run_migrations");
  }

  public static async hashPassword(password: string): Promise<string> {
    return await invoke<string>("hash_password", { password });
  }

  public static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await invoke<boolean>("verify_password", { password, hash });
  }
}
