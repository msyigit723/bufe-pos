import React, { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { LoginPage } from "../features/auth/LoginPage";
import { useAppStore } from "../stores/useAppStore";
import { DatabaseService } from "../application/services/DatabaseService";
import { invoke } from "@tauri-apps/api/core";

export const App: React.FC = () => {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Running database migrations...');
        await invoke('log_message', { msg: 'React is attempting migrations...' });
        await DatabaseService.runMigrations();
        await invoke('log_message', { msg: 'React migrations success!' });
      } catch (error: any) {
        console.error('Migration failed:', error);
        await invoke('log_message', { msg: 'React migrations failed: ' + error.toString() });
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, []);

  if (!isReady) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Yükleniyor...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppShell />;
};

export default App;
