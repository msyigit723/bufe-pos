import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  PurchaseService,
  type SupplierDto,
  type PurchaseItemInput,
} from "../../application/services/PurchaseService";
import { ProductService } from "../../application/services/ProductService";
import { type Product } from "../../domain/entities/Product";

interface CartPurchaseItem extends PurchaseItemInput {
  productName: string;
  barcode?: string;
  unitName: string;
}

export const PurchasesPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Supplier Modal (Create / Edit)
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierDto | null>(null);
  const [supName, setSupName] = useState<string>("");
  const [supPhone, setSupPhone] = useState<string>("");
  const [supNote, setSupNote] = useState<string>("");
  const [savingSup, setSavingSup] = useState<boolean>(false);

  // Purchase Invoice Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | "">("");
  const [paymentType, setPaymentType] = useState<"PESIN" | "VERESIYE">("PESIN");
  const [invoiceNote, setInvoiceNote] = useState<string>("");
  const [invoiceItems, setInvoiceItems] = useState<CartPurchaseItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [savingInvoice, setSavingInvoice] = useState<boolean>(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Pay Supplier Modal
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [payingSupplier, setPayingSupplier] = useState<SupplierDto | null>(null);
  const [payAmountTL, setPayAmountTL] = useState<string>("");
  const [payNote, setPayNote] = useState<string>("");
  const [savingPay, setSavingPay] = useState<boolean>(false);

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await PurchaseService.listSuppliers(search);
      setSuppliers(data);
    } catch (err: unknown) {
      console.error("Tedarikçiler yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Focus barcode when invoice modal opens
  useEffect(() => {
    if (showInvoiceModal) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [showInvoiceModal]);

  const handleOpenSupplierModal = (sup?: SupplierDto) => {
    if (sup) {
      setEditingSupplier(sup);
      setSupName(sup.name);
      setSupPhone(sup.phone || "");
      setSupNote(sup.note || "");
    } else {
      setEditingSupplier(null);
      setSupName("");
      setSupPhone("");
      setSupNote("");
    }
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      alert("Tedarikçi adı boş olamaz.");
      return;
    }

    try {
      setSavingSup(true);
      if (editingSupplier) {
        await PurchaseService.updateSupplier(editingSupplier.id, supName.trim(), supPhone, supNote);
        setSuccessMsg("Tedarikçi güncellendi.");
      } else {
        await PurchaseService.createSupplier(supName.trim(), supPhone, supNote);
        setSuccessMsg("Yeni tedarikçi eklendi.");
      }
      setShowSupplierModal(false);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadSuppliers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Tedarikçi kaydedilemedi.");
    } finally {
      setSavingSup(false);
    }
  };

  const handleOpenInvoiceModal = () => {
    setSelectedSupplierId(suppliers[0]?.id || "");
    setPaymentType("PESIN");
    setInvoiceNote("");
    setInvoiceItems([]);
    setBarcodeInput("");
    setShowInvoiceModal(true);
  };

  const handleBarcodeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    try {
      // Search by barcode first
      let prod: Product | null = await ProductService.searchProductByBarcode(query);

      // If not found by barcode, search by product name/code in list
      if (!prod) {
        const list = await ProductService.listProducts({ search: query, isActive: true });
        if (list.length > 0) {
          prod = list[0];
        }
      }

      if (!prod) {
        alert(`"${query}" ile eşleşen ürün bulunamadı.`);
        return;
      }

      // Add to invoice items
      setInvoiceItems((prev) => {
        const existingIndex = prev.findIndex((it) => it.productId === prod!.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex].quantity += 1;
          return updated;
        } else {
          return [
            ...prev,
            {
              productId: prod!.id,
              productName: prod!.name,
              barcode: prod!.primaryBarcode || undefined,
              unitName: prod!.unitName,
              quantity: 1,
              unitCostKurus: prod!.costPrice.toKurus(),
            },
          ];
        }
      });

      setBarcodeInput("");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Ürün aranırken hata oluştu.");
    }
  };

  const handleUpdateItemQty = (index: number, qty: number) => {
    if (qty <= 0) return;
    setInvoiceItems((prev) => {
      const copy = [...prev];
      copy[index].quantity = qty;
      return copy;
    });
  };

  const handleUpdateItemCost = (index: number, costTL: number) => {
    if (costTL < 0) return;
    setInvoiceItems((prev) => {
      const copy = [...prev];
      copy[index].unitCostKurus = Math.round(costTL * 100);
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateInvoiceTotalKurus = () => {
    return invoiceItems.reduce((acc, it) => acc + Math.round(it.quantity * it.unitCostKurus), 0);
  };

  const handleSaveInvoice = async () => {
    if (invoiceItems.length === 0) {
      alert("Lütfen alış faturasına en az bir ürün ekleyiniz.");
      return;
    }

    try {
      setSavingInvoice(true);
      await PurchaseService.processPurchaseInvoice({
        supplierId: selectedSupplierId ? Number(selectedSupplierId) : undefined,
        paymentType,
        items: invoiceItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitCostKurus: it.unitCostKurus,
        })),
        note: invoiceNote,
      });

      setShowInvoiceModal(false);
      setSuccessMsg("Mal alımı başarıyla tamamlandı, stoklar artırıldı.");
      setTimeout(() => setSuccessMsg(null), 3000);
      loadSuppliers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Alış faturası işlenemedi.");
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleOpenPayModal = (sup: SupplierDto) => {
    setPayingSupplier(sup);
    setPayAmountTL("");
    setPayNote("");
    setShowPayModal(true);
  };

  const handleSavePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier) return;

    const amt = parseFloat(payAmountTL);
    if (isNaN(amt) || amt <= 0) {
      alert("Lütfen geçerli bir tutar giriniz.");
      return;
    }

    try {
      setSavingPay(true);
      await PurchaseService.paySupplier(
        payingSupplier.id,
        Math.round(amt * 100),
        1, // Default cash register
        payNote
      );

      setShowPayModal(false);
      setSuccessMsg(`${payingSupplier.name} firmasına ödeme kaydedildi.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadSuppliers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Ödeme kaydedilemedi.");
    } finally {
      setSavingPay(false);
    }
  };

  const totalDebtKurus = suppliers.reduce((acc, s) => acc + s.balance_kurus, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">🚚</span>
            Alış ve Tedarik Yönetimi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Toptancı mal alımı, barkodla stok artırma ve tedarikçi borç/ödeme takibi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenSupplierModal()}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition text-sm flex items-center gap-2"
          >
            ➕ Yeni Tedarikçi
          </button>
          <button
            onClick={handleOpenInvoiceModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm text-sm flex items-center gap-2"
          >
            📥 Mal Alış Faturası Gir
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-sm font-semibold animate-fade-in flex items-center gap-2">
          <span>✅</span> {successMsg}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kayıtlı Tedarikçi / Toptancı</div>
          <div className="text-2xl font-black text-slate-800 dark:text-white mt-1">{suppliers.length}</div>
          <div className="text-xs text-slate-400 mt-1">Aktif toptancı sayısı</div>
        </div>

        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30">
          <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Toplam Tedarikçi Borcu
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {(totalDebtKurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
          </div>
          <div className="text-xs text-rose-600/70 mt-1">Vadeli/veresiye mal alım bakiyesi</div>
        </div>
      </div>

      {/* Supplier List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <span className="text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Tedarikçi adı veya telefon ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-800 dark:text-white focus:outline-none placeholder-slate-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="py-3 px-4">Tedarikçi Adı</th>
                <th className="py-3 px-4">Telefon</th>
                <th className="py-3 px-4">Not / Adres</th>
                <th className="py-3 px-4 text-right">Borç Bakiyesi</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tedarikçiler yükleniyor...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Henüz kayıtlı tedarikçi bulunmuyor.
                  </td>
                </tr>
              ) : (
                suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                      {sup.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">
                      {sup.phone || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {sup.note || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-800 dark:text-white">
                      {sup.balance_kurus > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          {(sup.balance_kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                        </span>
                      ) : (
                        <span className="text-slate-400">0,00 ₺</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenPayModal(sup)}
                        className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg text-xs transition"
                      >
                        💳 Ödeme Yap
                      </button>
                      <button
                        onClick={() => handleOpenSupplierModal(sup)}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs transition"
                      >
                        Düzenle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MAL ALIŞ FATURASI GİRİŞ MODALI */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <span>📥</span> Mal Alış Faturası & Stok Girişi
              </h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Top Config Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tedarikçi
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm font-semibold focus:outline-none"
                >
                  <option value="">-- Genel Tedarikçi --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Ödeme Şekli
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentType("PESIN")}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      paymentType === "PESIN"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                    }`}
                  >
                    💵 Peşin (Kasa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType("VERESIYE")}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      paymentType === "VERESIYE"
                        ? "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-400"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                    }`}
                  >
                    📋 Veresiye (Borç)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Fatura Notu
                </label>
                <input
                  type="text"
                  placeholder="İrsaliye no, fatura no..."
                  value={invoiceNote}
                  onChange={(e) => setInvoiceNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Barcode / Product Add Input */}
            <form onSubmit={handleBarcodeSearch} className="flex gap-2">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Barkod okutun veya ürün adı yazıp Enter'a basın..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-indigo-500/50 rounded-xl text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:border-indigo-600"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition"
              >
                ➕ Ekle
              </button>
            </form>

            {/* Items Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <th className="py-2.5 px-3">Ürün</th>
                    <th className="py-2.5 px-3 text-center">Miktar</th>
                    <th className="py-2.5 px-3 text-right">Birim Alış (₺)</th>
                    <th className="py-2.5 px-3 text-right">Satır Toplamı (₺)</th>
                    <th className="py-2.5 px-3 text-center">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {invoiceItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        Barkod okutarak veya ürün arayarak alış listesine ürün ekleyin.
                      </td>
                    </tr>
                  ) : (
                    invoiceItems.map((item, idx) => {
                      const lineTotalTL = (item.quantity * item.unitCostKurus) / 100;
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-white">
                            {item.productName}
                            {item.barcode && (
                              <span className="block text-xs font-normal text-slate-400 font-mono">
                                {item.barcode}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQty(idx, parseFloat(e.target.value) || 1)}
                              className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-800 dark:text-white text-sm"
                            />{" "}
                            <span className="text-xs text-slate-400">{item.unitName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={(item.unitCostKurus / 100).toFixed(2)}
                              onChange={(e) => handleUpdateItemCost(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-right font-bold text-slate-800 dark:text-white text-sm"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-800 dark:text-white">
                            {lineTotalTL.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700 font-bold text-base"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Total and Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-xs text-slate-400 uppercase font-bold">Toplam Alış Tutarı</div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {(calculateInvoiceTotalKurus() / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={savingInvoice || invoiceItems.length === 0}
                  onClick={handleSaveInvoice}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-sm disabled:opacity-50"
                >
                  {savingInvoice ? "Kaydediliyor..." : "✅ Alışı Onayla ve Stoğu Artır"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEDARİKÇİ EKLE / DÜZENLE MODALI */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-800 dark:text-white">
                {editingSupplier ? "Tedarikçi Düzenle" : "Yeni Tedarikçi Ekle"}
              </h3>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Tedarikçi / Firma Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Özgıda Toptan A.Ş."
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Telefon Numarası
                </label>
                <input
                  type="text"
                  placeholder="05XX XXX XX XX"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Not / Adres
                </label>
                <input
                  type="text"
                  placeholder="Gıda toptancısı, meşrubat dağıtıcısı..."
                  value={supNote}
                  onChange={(e) => setSupNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={savingSup}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-sm disabled:opacity-50"
                >
                  {savingSup ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEDARİKÇİYE ÖDEME YAP MODALI */}
      {showPayModal && payingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <span>💳</span> Tedarikçi Ödemesi Yap
              </h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-xs text-slate-400">Firma:</div>
              <div className="font-bold text-slate-800 dark:text-white text-base">{payingSupplier.name}</div>
              <div className="text-xs text-slate-400 mt-1">Mevcut Borç:</div>
              <div className="font-black text-rose-600 dark:text-rose-400 text-lg">
                {(payingSupplier.balance_kurus / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
              </div>
            </div>

            <form onSubmit={handleSavePay} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Ödenecek Tutar (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={payAmountTL}
                  onChange={(e) => setPayAmountTL(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Açıklama (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Haftalık toptan ödemesi..."
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={savingPay}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-sm disabled:opacity-50"
                >
                  {savingPay ? "Kaydediliyor..." : "Kasadan Öde"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
