import { create } from "zustand";
import type { HealthCheckResponse } from "../application/services/DatabaseService";

export type NavTab = "pos" | "products" | "inventory" | "purchases" | "customers" | "cash" | "reports" | "settings" | "tables";

interface AppState {
  currentTab: NavTab;
  systemStatus: HealthCheckResponse | null;
  activeCashierName: string;
  username: string;
  userRole: string;
  isAuthenticated: boolean;
  setCurrentTab: (tab: NavTab) => void;
  setSystemStatus: (status: HealthCheckResponse) => void;
  login: (name: string, role: string, username: string) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: "pos",
  systemStatus: null,
  activeCashierName: "",
  username: "",
  userRole: "",
  isAuthenticated: false,
  setCurrentTab: (tab: NavTab) => set({ currentTab: tab }),
  setSystemStatus: (status: HealthCheckResponse) => set({ systemStatus: status }),
  login: (name, role, username) => set({ activeCashierName: name, userRole: role, username, isAuthenticated: true }),
  logout: () => set({ activeCashierName: "", userRole: "", username: "", isAuthenticated: false }),
}));
