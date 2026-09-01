import React, { useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  Users,
  Wallet,
  BarChart3,
  Settings,
  CheckCircle2,
  Database,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Coffee,
} from "lucide-react";
import type { NavTab } from "../../stores/useAppStore";
import { useAppStore } from "../../stores/useAppStore";
import { DatabaseService } from "../../application/services/DatabaseService";

import { ProductsPage } from "../../features/products/ProductsPage";
import { PosPage } from "../../features/pos/PosPage";
import { CashRegisterPage } from "../../features/cash/CashRegisterPage";
import { DailyReportsPage } from "../../features/reports/DailyReportsPage";
import { CustomersPage } from "../../features/customers/CustomersPage";
import { InventoryPage } from "../../features/inventory/InventoryPage";
import { PurchasesPage } from "../../features/purchases/PurchasesPage";
import { SettingsPage } from "../../features/settings/SettingsPage";
import { TablesPage } from "../../features/tables/TablesPage";

export const AppShell: React.FC = () => {
  const { currentTab, setCurrentTab, systemStatus, setSystemStatus, activeCashierName } =
    useAppStore();

  const fetchHealthCheck = useCallback(async () => {
    try {
      await DatabaseService.runMigrations();
      const status = await DatabaseService.dbHealthCheck();
      setSystemStatus(status);
    } catch (e) {
      console.error("Database initialization failed:", e);
      setSystemStatus({
        foreign_keys_active: false,
        wal_mode_active: false,
        total_tables: 0,
        status: "ERROR",
      });
    }
  }, [setSystemStatus]);

  useEffect(() => {
    fetchHealthCheck();
  }, [fetchHealthCheck]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        setCurrentTab("pos");
      } else if (e.key === "F2") {
        e.preventDefault();
        setCurrentTab("products");
      } else if (e.key === "F3") {
        e.preventDefault();
        setCurrentTab("cash");
      } else if (e.key === "F4") {
        e.preventDefault();
        setCurrentTab("reports");
      } else if (e.key === "F5") {
        e.preventDefault();
        setCurrentTab("inventory");
      } else if (e.key === "F6") {
        e.preventDefault();
        setCurrentTab("customers");
      } else if (e.key === "F7") {
        e.preventDefault();
        setCurrentTab("purchases");
      } else if (e.key === "F8") {
        e.preventDefault();
        setCurrentTab("settings");
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [setCurrentTab]);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: "pos", label: "POS Satış", icon: <ShoppingCart className="w-5 h-5" />, shortcut: "F1" },
    { id: "tables", label: "Masalar", icon: <Coffee className="w-5 h-5" />, shortcut: "F9" },
    { id: "products", label: "Ürünler", icon: <Package className="w-5 h-5" />, shortcut: "F2" },
    { id: "inventory", label: "Stok", icon: <Boxes className="w-5 h-5" />, shortcut: "F5" },
    { id: "purchases", label: "Alış", icon: <Truck className="w-5 h-5" />, shortcut: "F7" },
    { id: "customers", label: "Cari", icon: <Users className="w-5 h-5" />, shortcut: "F6" },
    { id: "cash", label: "Kasa", icon: <Wallet className="w-5 h-5" />, shortcut: "F3" },
    { id: "reports", label: "Raporlar", icon: <BarChart3 className="w-5 h-5" />, shortcut: "F4" },
    { id: "settings", label: "Ayarlar", icon: <Settings className="w-5 h-5" />, shortcut: "F8" },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-slate-100 font-sans select-none overflow-hidden">
      {/* TOP HEADER */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg shadow-md">
            BP
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wide text-white">BÜFE POS OTOMASYONU</h1>
            <p className="text-xs text-slate-400">Küçük İşletme & Perakende POS</p>
          </div>
        </div>

        {/* TOP NAVIGATION TABS */}
        <nav className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all min-h-[40px] ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? "bg-blue-700 text-white" : "bg-slate-800 text-slate-400"
                  }`}>
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* CASHIER INFO & REFRESH */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="block text-xs font-bold text-slate-200">{activeCashierName}</span>
            <span className="block text-[10px] text-emerald-400 font-medium">● Kasa Aktif</span>
          </div>
          <button
            onClick={fetchHealthCheck}
            title="Sistem Durumunu Yenile"
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden flex flex-col bg-slate-950/50">
        {currentTab === "pos" ? (
          <PosPage />
        ) : currentTab === "tables" ? (
          <TablesPage />
        ) : currentTab === "products" ? (
          <ProductsPage />
        ) : currentTab === "inventory" ? (
          <InventoryPage />
        ) : currentTab === "purchases" ? (
          <PurchasesPage />
        ) : currentTab === "customers" ? (
          <CustomersPage />
        ) : currentTab === "cash" ? (
          <CashRegisterPage />
        ) : currentTab === "reports" ? (
          <DailyReportsPage />
        ) : currentTab === "settings" ? (
          <SettingsPage />
        ) : null}
      </main>

      {/* SYSTEM HEALTH BAR (DEVELOPER & ARCHITECTURE STATUS) */}
      <footer className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <span className="flex items-center space-x-1 text-slate-300 font-semibold">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Tauri v2 + Rust</span>
          </span>

          <span className="flex items-center space-x-1">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>SQLite WAL:</span>
            <span className={systemStatus?.wal_mode_active ? "text-emerald-400 font-bold" : "text-rose-400"}>
              {systemStatus?.wal_mode_active ? "Aktif (WAL)" : "Kontrol Ediliyor..."}
            </span>
          </span>

          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Foreign Keys:</span>
            <span className={systemStatus?.foreign_keys_active ? "text-emerald-400 font-bold" : "text-rose-400"}>
              {systemStatus?.foreign_keys_active ? "Aktif (PRAGMA)" : "Pasif"}
            </span>
          </span>

          <span className="flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Veritabanı Tablo Sayısı:</span>
            <span className="text-slate-200 font-bold">{systemStatus?.total_tables ?? 0} Tablo</span>
          </span>
        </div>

        <div className="flex items-center space-x-4 text-[11px] text-slate-500">
          <span>Format: Kuruş (INTEGER)</span>
          <span>Güvenlik: Argon2id</span>
          <span className="text-emerald-400 font-bold">Durum: {systemStatus?.status === "MOCK_DEV_MODE" || systemStatus?.status === "READY" ? "HAZIR" : "BAŞLATILIYOR"}</span>
        </div>
      </footer>
    </div>
  );
};
