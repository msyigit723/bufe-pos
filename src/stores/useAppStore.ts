import { create } from "zustand";
import type { HealthCheckResponse } from "../application/services/DatabaseService";

export type NavTab = "pos" | "products" | "cash" | "reports" | "settings" | "tables" | "inventory";

interface AppState {
  currentTab: NavTab;
  systemStatus: HealthCheckResponse | null;
  activeCashierName: string;
  username: string;
  userRole: string;
  userId: number;
  isAuthenticated: boolean;
  setCurrentTab: (tab: NavTab) => void;
  setSystemStatus: (status: HealthCheckResponse) => void;
  login: (name: string, role: string, username: string, userId: number) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentTab: "pos",
  systemStatus: null,
  activeCashierName: "",
  username: "",
  userRole: "",
  userId: 0,
  isAuthenticated: false,
  setCurrentTab: (tab: NavTab) => set({ currentTab: tab }),
  setSystemStatus: (status: HealthCheckResponse) => set({ systemStatus: status }),
  login: (name, role, username, userId) => set({ activeCashierName: name, userRole: role, username, userId, isAuthenticated: true }),
  logout: () => set({ activeCashierName: "", userRole: "", username: "", userId: 0, isAuthenticated: false }),
}));
