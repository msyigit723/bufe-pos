import { Money } from "../src/domain/value-objects/Money.js";
import { Product } from "../src/domain/entities/Product.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`✓ PASS: ${message}`);
}

console.log("=== Domain & Money Test Suite ===");

// 1. Money from Lira
const m1 = Money.fromLira(100.50);
assert(m1.getKurus() === 10050, "100.50 TL must equal 10050 Kurus (INTEGER)");
assert(m1.getLira() === 100.50, "10050 Kurus must convert back to 100.50 TL");

// 2. Money from Kurus
const m2 = Money.fromKurus(3500);
assert(m2.getKurus() === 3500, "3500 Kurus should store 3500");
assert(m2.getLira() === 35.00, "3500 Kurus must convert to 35.00 TL");

// 3. Addition
const sum = m1.add(m2);
assert(sum.getKurus() === 13550, "10050 + 3500 = 13550 Kurus");
assert(sum.getLira() === 135.50, "13550 Kurus = 135.50 TL");

// 4. Subtraction
const diff = m1.subtract(m2);
assert(diff.getKurus() === 6550, "10050 - 3500 = 6550 Kurus");
assert(diff.getLira() === 65.50, "6550 Kurus = 65.50 TL");

// 5. Multiplication
const mult = m2.multiply(3);
assert(mult.getKurus() === 10500, "3500 * 3 = 10500 Kurus");
assert(mult.getLira() === 105.00, "10500 Kurus = 105.00 TL");

// 6. Turkish Format check
const formatted = m1.formatTL();
assert(formatted.includes("100,50") || formatted.includes("100.50"), `Formatted currency string should contain valid representation: ${formatted}`);

// 7. Product Entity check
const product = new Product({
  id: 1,
  code: "PRD-001",
  name: "Su 0.5L",
  unitName: "Adet",
  costPriceKurus: 300,
  salePriceKurus: 1000,
  vatRate: 1,
  minStockLevel: 10,
  trackSKT: false,
  isActive: true,
  barcodes: ["869000000001"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

assert(product.costPrice.getKurus() === 300, "Product cost price should be 300 Kurus (3.00 TL)");
assert(product.salePrice.getKurus() === 1000, "Product sale price should be 1000 Kurus (10.00 TL)");
assert(product.barcodes.length === 1, "Product should have 1 barcode");

console.log("=== All Domain & Value-Object tests PASSED successfully ===");
