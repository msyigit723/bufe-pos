import { Money } from "../src/domain/value-objects/Money";
import { Barcode } from "../src/domain/value-objects/Barcode";
import { Product } from "../src/domain/entities/Product";
import { Category } from "../src/domain/entities/Category";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
}

console.log("\n==========================================");
console.log("=== PHASE 2 DOMAIN UNIT TESTS (TS) ===");
console.log("==========================================\n");

// 1. Money Value Object Tests
console.log("--- 1. Money Value Object & Kuruş Math ---");
const m1 = Money.fromLira(12.5);
assert(m1.toKurus() === 1250, "12.50 TL should equal 1250 Kuruş integer");
assert(m1.getLira() === 12.5, "1250 Kuruş should convert back to 12.50 TL");

// Test precision without floating-point errors (0.1 + 0.2 = 0.3)
const m2 = Money.fromLira(0.1);
const m3 = Money.fromLira(0.2);
const mSum = m2.add(m3);
assert(mSum.toKurus() === 30, "0.10 TL + 0.20 TL must equal 30 Kuruş exact");

const mDiff = mSum.subtract(Money.fromKurus(10));
assert(mDiff.toKurus() === 20, "30 Kuruş - 10 Kuruş must equal 20 Kuruş");

const mMulti = Money.fromLira(15.75).multiply(3);
assert(mMulti.toKurus() === 4725, "15.75 TL * 3 must equal 4725 Kuruş");

const m100 = Money.fromLira(100.50);
assert(m100.toKurus() === 10050, "100.50 TL must equal 10050 Kuruş integer");

const mSum2 = m100.add(Money.fromKurus(3500));
assert(mSum2.toKurus() === 13550, "10050 + 3500 must equal 13550 Kuruş");

const mDiff2 = m100.subtract(Money.fromKurus(3500));
assert(mDiff2.toKurus() === 6550, "10050 - 3500 must equal 6550 Kuruş");

console.log("\n--- 2. Barcode Value Object & EAN-13 / EAN-8 Validation ---");
// Valid EAN-13 with correct check digit (869050403212 -> calculate check digit)
const validEan13Check = Barcode.calculateEan13CheckDigit("869050403212");
const testEan13 = `869050403212${validEan13Check}`;
const barcodeVo = new Barcode(testEan13);
assert(barcodeVo.getType() === "EAN-13", "Should detect EAN-13 format");
assert(barcodeVo.isValidEanChecksum(), `Barcode ${testEan13} checksum should be valid`);

// Valid EAN-8 validation
const validEan8Check = Barcode.calculateEan8CheckDigit("8690504");
const testEan8 = `8690504${validEan8Check}`;
const barcodeVo8 = new Barcode(testEan8);
assert(barcodeVo8.getType() === "EAN-8", "Should detect EAN-8 format");
assert(barcodeVo8.isValidEanChecksum(), `Barcode ${testEan8} checksum should be valid`);

// Invalid format / whitespace cleaning
const spacedBarcode = new Barcode("  8690000000018  ");
assert(spacedBarcode.getValue() === "8690000000018", "Barcode value should be trimmed");
assert(spacedBarcode.getType() === "EAN-13", "Spaced barcode should detect EAN-13");

let invalidBarcodeRejected = false;
try {
  new Barcode("   ");
} catch {
  invalidBarcodeRejected = true;
}
assert(invalidBarcodeRejected, "Empty barcode must be rejected");

console.log("\n--- 3. Product Entity Validation ---");
const prod = Product.create({
  id: 1,
  code: "PRD-001",
  name: "Ülker Çikolatalı Gofret",
  categoryId: 1,
  categoryName: "Gofret & Çikolata",
  unitName: "Adet",
  costPriceKurus: 650,
  salePriceKurus: 1200,
  vatRate: 20,
  minStockLevel: 10,
  trackSKT: true,
  isActive: true,
  barcodes: [
    { id: 1, barcode: testEan13, isPrimary: true, multiplier: 1 },
    { id: 2, barcode: "8690504032999", isPrimary: false, multiplier: 12 },
  ],
});

assert(prod.id === 1, "Product id must match");
assert(prod.primaryBarcode === testEan13, "Primary barcode getter should return primary barcode");
assert(prod.barcodes.length === 2, "Product should hold 2 barcodes");
assert(prod.costPrice.toKurus() === 650, "Cost price must be 650 kurus");
assert(prod.salePrice.toKurus() === 1200, "Sale price must be 1200 kurus");

// Invariants
let invariantFailed = false;
try {
  Product.create({
    code: "",
    name: "Hatalı Ürün",
    costPriceKurus: 100,
    salePriceKurus: 200,
  });
} catch {
  invariantFailed = true;
}
assert(invariantFailed, "Product code cannot be empty");

console.log("\n--- 4. Category Entity Validation ---");
const cat = Category.create({
  id: 1,
  name: "Sıcak İçecekler",
  sortOrder: 2,
  colorCode: "#EF4444",
  productCount: 14,
});

assert(cat.name === "Sıcak İçecekler", "Category name must match");
assert(cat.productCount === 14, "Category productCount must match");
assert(cat.colorCode === "#EF4444", "Category colorCode must match");

console.log("\n==========================================");
console.log("🎉 ALL DOMAIN & BUSINESS TESTS PASSED!");
console.log("==========================================\n");
