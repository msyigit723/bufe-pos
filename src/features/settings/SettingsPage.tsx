import React, { useState, useEffect } from "react";
import {
  SettingsService,
  type AppSettingsDto,
} from "../../application/services/SettingsService";

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettingsDto>({
    business_name: "",
    phone: "",
    address: "",
    receipt_footer: "",
    default_vat_rate: 20.0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [backingUp, setBackingUp] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await SettingsService.getAppSettings();
      setSettings(data);
    } catch (err: unknown) {
      console.error("Ayarlar yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await SettingsService.updateAppSettings(settings);
      setSuccessMsg("İşletme ayarları başarıyla kaydedildi.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Ayarlar kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      setBackingUp(true);
      setBackupMsg(null);
      const res = await SettingsService.backupDatabase();
      const sizeKB = (res.size_bytes / 1024).toFixed(1);
      setBackupMsg(`✅ Veritabanı başarıyla yedeklendi (${sizeKB} KB):\n${res.backup_path}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Yedekleme alınamadı.");
    } finally {
      setBackingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 font-semibold">
        Ayarlar yükleniyor...
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <span className="p-2 bg-slate-500/10 text-slate-700 dark:text-slate-300 rounded-xl">⚙️</span>
          Sistem ve İşletme Ayarları
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Büfe işletme bilgileri, fiş şablonu ve tek tıkla veritabanı yedekleme.
        </p>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm font-semibold animate-fade-in flex items-center gap-2">
          <span>✅</span> {successMsg}
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* İşletme ve Fiş Bilgileri */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <span>🏪</span> İşletme ve Fiş Bilgileri
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                İşletme / Büfe Adı *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Güneş Büfe & Tekel"
                value={settings.business_name}
                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Telefon Numarası
              </label>
              <input
                type="text"
                placeholder="0212 XXX XX XX"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              İşletme Adresi (Fişte Görünür)
            </label>
            <input
              type="text"
              placeholder="Örn: Atatürk Cad. No:14/A Kadıköy / İstanbul"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Fiş Altı Teşekkür Mesajı
              </label>
              <input
                type="text"
                placeholder="Teşekkür Ederiz Yine Bekleriz"
                value={settings.receipt_footer}
                onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Varsayılan KDV Oranı (%)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={settings.default_vat_rate}
                onChange={(e) => setSettings({ ...settings, default_vat_rate: parseFloat(e.target.value) || 20 })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition shadow-sm disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "💾 Ayarları Kaydet"}
            </button>
          </div>
        </div>
      </form>

      {/* Parola Değiştirme */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <span>🔒</span> Parola Değiştir
        </h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const target = e.target as any;
          const currentPassword = target.currentPassword.value;
          const newPassword = target.newPassword.value;
          
          if (!currentPassword || !newPassword) return;
          
          try {
            const { invoke } = await import('@tauri-apps/api/core');
            const { useAppStore } = await import('../../stores/useAppStore');
            const username = useAppStore.getState().username || (useAppStore.getState().userRole === 'ADMIN' ? 'admin' : 'personel'); // Fallback map
            
            await invoke('change_user_password', {
              username,
              currentPassword,
              newPassword
            });
            alert('Parolanız başarıyla güncellendi.');
            target.reset();
          } catch (err: any) {
            alert('Hata: ' + err.toString());
          }
        }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Mevcut Parola
              </label>
              <input
                type="password"
                name="currentPassword"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Yeni Parola
              </label>
              <input
                type="password"
                name="newPassword"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>
          <div className="pt-2 text-right">
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl text-sm transition shadow-sm"
            >
              Parolayı Güncelle
            </button>
          </div>
        </form>
      </div>

      {/* Veritabanı Yedekleme */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <span>💾</span> Güvenlik & Veritabanı Yedekleme
        </h2>

        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tüm ürünlerinizi, satış geçmişinizi, kasa hareketlerinizi ve cari müşteri kayıtlarınızı tek tıkla güvenli SQLite yedeği olarak kaydedin.
        </p>

        {backupMsg && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-mono whitespace-pre-line">
            {backupMsg}
          </div>
        )}

        <button
          type="button"
          onClick={handleBackup}
          disabled={backingUp}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-base rounded-2xl transition shadow-md flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <span>📦</span>
          <span>{backingUp ? "Yedek Alınıyor..." : "VERİTABANINI YEDEKLE"}</span>
        </button>
      </div>
    </div>
  );
};
