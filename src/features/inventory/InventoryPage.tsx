import React, { useState, useEffect, useCallback } from "react";
import {
  InventoryService,
  type InventoryItemDto,
  type StockMovementDto,
} from "../../application/services/InventoryService";

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "OUT_OF_STOCK">("ALL");
  const [search, setSearch] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Adjustment Modal
  const [showAdjModal, setShowAdjModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItemDto | null>(null);
  const [adjType, setAdjType] = useState<"GIRIS" | "CIKIS" | "SAYIM" | "FIRE">("GIRIS");
  const [adjQuantity, setAdjQuantity] = useState<string>("");
  const [adjNote, setAdjNote] = useState<string>("");
  const [savingAdj, setSavingAdj] = useState<boolean>(false);

  // Movement History Modal
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyItems, setHistoryItems] = useState<StockMovementDto[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyProduct, setHistoryProduct] = useState<InventoryItemDto | null>(null);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InventoryService.getInventoryList(filter, search);
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Stok listesi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleOpenAdjustModal = (item?: InventoryItemDto) => {
    setSelectedProduct(item || items[0] || null);
    setAdjType("GIRIS");
    setAdjQuantity("");
    setAdjNote("");
    setShowAdjModal(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = parseFloat(adjQuantity);
    if (isNaN(qty) || qty <= 0) {
      alert("Lütfen geçerli bir miktar giriniz (0'dan büyük).");
      return;
    }

    try {
      setSavingAdj(true);
      await InventoryService.addStockAdjustment({
        productId: selectedProduct.product_id,
        adjustmentType: adjType,
        quantity: qty,
        note: adjNote,
      });
      setShowAdjModal(false);
      setSuccessMsg(`${selectedProduct.product_name} için stok başarıyla güncellendi.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadInventory();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Stok güncellenemedi.");
    } finally {
      setSavingAdj(false);
    }
  };

  const handleOpenHistoryModal = async (item?: InventoryItemDto) => {
    setHistoryProduct(item || null);
    setShowHistoryModal(true);
    try {
      setLoadingHistory(true);
      const data = await InventoryService.getStockMovements(item?.product_id, 100);
      setHistoryItems(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Counts for summary
  const totalCount = items.length;
  const criticalCount = items.filter((i) => i.status === "CRITICAL").length;
  const outOfStockCount = items.filter((i) => i.status === "OUT_OF_STOCK").length;

  return (
    <div className="p-6 h-full overflow-y-auto max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <span className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">📦</span>
            Stok ve Envanter Yönetimi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mevcut depo stokları, kritik stok seviyeleri ve hızlı sayım/düzeltme işlemleri.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenHistoryModal()}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition text-sm flex items-center gap-2"
          >
            📋 Hareket Geçmişi
          </button>
          <button
            onClick={() => handleOpenAdjustModal()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-sm text-sm flex items-center gap-2"
          >
            ⚡ Stok Düzelt / Sayım
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm font-semibold animate-fade-in flex items-center gap-2">
          <span>✅</span> {successMsg}
        </div>
      )}

      {/* Filter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setFilter("ALL")}
          className={`p-4 rounded-2xl border text-left transition ${
            filter === "ALL"
              ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tüm Ürünler</div>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{totalCount}</div>
          <div className="text-xs text-slate-400 mt-1">Depodaki aktif ürün çeşitliliği</div>
        </button>

        <button
          onClick={() => setFilter("CRITICAL")}
          className={`p-4 rounded-2xl border text-left transition ${
            filter === "CRITICAL"
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            ⚠️ Kritik Seviyede
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{criticalCount}</div>
          <div className="text-xs text-amber-600/70 mt-1">Kritik stok seviyesinin altında</div>
        </button>

        <button
          onClick={() => setFilter("OUT_OF_STOCK")}
          className={`p-4 rounded-2xl border text-left transition ${
            filter === "OUT_OF_STOCK"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            🚫 Stokta Yok (Bitenler)
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{outOfStockCount}</div>
          <div className="text-xs text-rose-600/70 mt-1">Stok miktarı 0 veya negatif</div>
        </button>
      </div>

      {/* Search and Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Ürün adı, barkod veya ürün kodu ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 dark:text-white focus:outline-none placeholder-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
            >
              Temizle
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4">Ürün Adı</th>
                <th className="py-3 px-4">Barkod / Kod</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Mevcut Stok</th>
                <th className="py-3 px-4 text-center">Kritik Limit</th>
                <th className="py-3 px-4 text-center">Durum</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Stok bilgileri yükleniyor...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-rose-500 font-medium">
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Kayıtlı veya kritere uygun ürün bulunamadı.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.product_id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                      {item.product_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {item.primary_barcode || item.product_code || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {item.category_name || "Genel"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-slate-800 dark:text-white text-base">
                      {item.current_stock}{" "}
                      <span className="text-xs font-normal text-slate-400">{item.unit_name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                      {item.min_stock_level} {item.unit_name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.status === "OUT_OF_STOCK" ? (
                        <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold rounded-lg text-xs">
                          Tükendi
                        </span>
                      ) : item.status === "CRITICAL" ? (
                        <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold rounded-lg text-xs">
                          Kritik
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg text-xs">
                          Yeterli
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenHistoryModal(item)}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition"
                      >
                        Geçmiş
                      </button>
                      <button
                        onClick={() => handleOpenAdjustModal(item)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-sm"
                      >
                        Düzelt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOK DÜZELTME MODALI */}
      {showAdjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <span>⚡</span> Stok Düzeltme & Sayım
              </h3>
              <button
                onClick={() => setShowAdjModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ürün
                </label>
                <select
                  value={selectedProduct?.product_id || ""}
                  onChange={(e) => {
                    const pid = parseInt(e.target.value);
                    const prod = items.find((i) => i.product_id === pid) || null;
                    setSelectedProduct(prod);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {items.map((it) => (
                    <option key={it.product_id} value={it.product_id}>
                      {it.product_name} (Mevcut: {it.current_stock} {it.unit_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment Type */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  İşlem Türü
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjType("GIRIS")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      adjType === "GIRIS"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    ➕ Stok Girişi
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType("CIKIS")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      adjType === "CIKIS"
                        ? "bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-400"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    ➖ Stok Çıkışı
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType("SAYIM")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      adjType === "SAYIM"
                        ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-400"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    🎯 Sayım Düzeltme
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType("FIRE")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                      adjType === "FIRE"
                        ? "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-400"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    🗑️ Fire / Zayi
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {adjType === "SAYIM" ? "Yeni Gerçek Stok Miktarı" : "Eklenecek / Çıkarılacak Miktar"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0"
                  value={adjQuantity}
                  onChange={(e) => setAdjQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Açıklama / Not (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Haftalık sayım farkı, kırılan şişe..."
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={savingAdj}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-sm disabled:opacity-50"
                >
                  {savingAdj ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HAREKET GEÇMİŞİ MODALI */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <span>📋</span> Stok Hareket Geçmişi
                </h3>
                {historyProduct && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Seçili Ürün: <span className="font-bold">{historyProduct.product_name}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider sticky top-0">
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Ürün</th>
                    <th className="py-2.5 px-3">İşlem</th>
                    <th className="py-2.5 px-3 text-center">Miktar</th>
                    <th className="py-2.5 px-3">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Hareketler yükleniyor...
                      </td>
                    </tr>
                  ) : historyItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Henüz bir stok hareketi bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    historyItems.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-500">{m.created_at}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-white">
                          {m.product_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              m.quantity > 0
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                            }`}
                          >
                            {m.movement_type}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-center font-bold ${
                            m.quantity > 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{m.note || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
