import { create } from "zustand";
import type { HealthCheckResponse } from "../application/services/DatabaseService";

export type NavTab = "pos" | "products" | "inventory" | "purchases" | "customers" | "cash" | "reports" | "settings";

interface AppState {
  currentTab: NavTab;
  systemStatus: HealthCheckResponse | null;
  activeCashierName: string;
  setCurrentTab: (tab: NavTab) => void;
  setSystemStatus: (status: HealthCheckResponse) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: "pos",
  systemStatus: null,
  activeCashierName: "Yönetici (Admin)",
  setCurrentTab: (tab: NavTab) => set({ currentTab: tab }),
  setSystemStatus: (status: HealthCheckResponse) => set({ systemStatus: status }),
}));
