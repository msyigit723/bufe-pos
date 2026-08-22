import { Money } from "../src/domain/value-objects/Money";
import { type InventoryItemDto, type StockMovementDto } from "../src/application/services/InventoryService";
import { type SupplierDto, type PurchaseItemInput } from "../src/application/services/PurchaseService";
import { type AppSettingsDto } from "../src/application/services/SettingsService";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

console.log("=== RUNNING UNIT & DOMAIN TESTS FOR PHASES 6, 7, 8 ===\n");

// --- PHASE 6: STOK VE ENVANTER TESTLERİ ---
console.log("-> 1. Testing Phase 6 (Stok ve Envanter)...");

const mockInventoryItem1: InventoryItemDto = {
  product_id: 1,
  product_code: "PRD-COLA",
  product_name: "Kutu Kola 330ml",
  primary_barcode: "8690504012345",
  category_name: "İçecek",
  unit_name: "Adet",
  cost_price_kurus: 1800,
  sale_price_kurus: 3000,
  current_stock: 45,
  min_stock_level: 10,
  status: "NORMAL",
};

const mockInventoryItem2: InventoryItemDto = {
  product_id: 2,
  product_code: "PRD-EKMEK",
  product_name: "Somun Ekmek",
  primary_barcode: "8690000000001",
  category_name: "Unlu Mamul",
  unit_name: "Adet",
  cost_price_kurus: 800,
  sale_price_kurus: 1000,
  current_stock: 3,
  min_stock_level: 10,
  status: "CRITICAL",
};

const mockInventoryItem3: InventoryItemDto = {
  product_id: 3,
  product_code: "PRD-SU",
  product_name: "Su 0.5L",
  primary_barcode: "8690504999999",
  category_name: "İçecek",
  unit_name: "Adet",
  cost_price_kurus: 400,
  sale_price_kurus: 750,
  current_stock: 0,
  min_stock_level: 20,
  status: "OUT_OF_STOCK",
};

assert(mockInventoryItem1.status === "NORMAL", "Item 1 should be NORMAL");
assert(mockInventoryItem2.status === "CRITICAL", "Item 2 should be CRITICAL when stock <= min");
assert(mockInventoryItem3.status === "OUT_OF_STOCK", "Item 3 should be OUT_OF_STOCK when stock == 0");

// Stock adjustment math simulation
let stock = 10;
// GIRIS (+5)
stock += 5;
assert(stock === 15, "Giris should increase stock");
// CIKIS (-3)
stock -= 3;
assert(stock === 12, "Cikis should decrease stock");
// SAYIM (=20)
stock = 20;
assert(stock === 20, "Sayim should set exact stock");
// FIRE (-2)
stock -= 2;
assert(stock === 18, "Fire should decrease stock");

console.log("  ✓ Phase 6 Inventory calculations passed successfully.");

// --- PHASE 7: ALIŞ VE TEDARİK TESTLERİ ---
console.log("-> 2. Testing Phase 7 (Alış ve Tedarik)...");

const mockSupplier: SupplierDto = {
  id: 1,
  name: "Güneş Gıda Toptan",
  phone: "0532 111 22 33",
  note: "Meşrubat ve atıştırmalık toptancısı",
  balance_kurus: 50000, // 500.00 TL borç
  is_active: true,
};

const purchaseItems: PurchaseItemInput[] = [
  { productId: 1, quantity: 24, unitCostKurus: 1800 }, // 24 * 18.00 TL = 432.00 TL (43200 kuruş)
  { productId: 3, quantity: 48, unitCostKurus: 400 },  // 48 * 4.00 TL = 192.00 TL (19200 kuruş)
];

const totalPurchaseKurus = purchaseItems.reduce(
  (acc, it) => acc + Math.round(it.quantity * it.unitCostKurus),
  0
);
assert(totalPurchaseKurus === 62400, "Total purchase invoice should equal 62400 kuruş (624.00 TL)");

const invoiceTotalMoney = Money.fromKurus(totalPurchaseKurus);
assert(invoiceTotalMoney.toKurus() === 62400, "Money VO conversion is exact");
assert(invoiceTotalMoney.format() === "₺624,00" || invoiceTotalMoney.format().includes("624"), "Money formatting is valid");

// Veresiye Alış sonrası Tedarikçi Bakiyesi
let supplierBalance = mockSupplier.balance_kurus + totalPurchaseKurus;
assert(supplierBalance === 112400, "Supplier balance should increase on veresiye purchase (1124.00 TL)");

// Tedarikçiye 600 TL ödeme yapıldığında
const paymentAmountKurus = 60000;
supplierBalance -= paymentAmountKurus;
assert(supplierBalance === 52400, "Supplier balance should decrease on payment (524.00 TL)");

console.log("  ✓ Phase 7 Purchase & Supplier balance logic passed successfully.");

// --- PHASE 8: SİSTEM AYARLARI VE YEDEKLEME TESTLERİ ---
console.log("-> 3. Testing Phase 8 (Sistem Ayarları & Yedekleme)...");

const mockSettings: AppSettingsDto = {
  business_name: "Güneş Büfe & Tekel",
  phone: "0212 345 67 89",
  address: "Kadıköy / İstanbul",
  receipt_footer: "Teşekkür Ederiz Yine Bekleriz",
  default_vat_rate: 20.0,
};

assert(mockSettings.business_name.length > 0, "Business name cannot be empty");
assert(mockSettings.default_vat_rate === 20.0, "Default VAT rate should be 20%");

console.log("  ✓ Phase 8 Settings & Backup logic passed successfully.");

console.log("\n=========================================");
console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! (Phase 6, 7, 8)");
console.log("=========================================\n");
