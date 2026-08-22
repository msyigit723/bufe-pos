import { Cart } from '../src/domain/entities/Cart';
import { PaymentTypeLabels } from '../src/domain/value-objects/Payment';

console.log('==========================================');
console.log('=== PHASE 3 POS DOMAIN UNIT TESTS (TS) ===');
console.log('==========================================\n');

// Mock Product
const mockProduct1 = {
  id: 1,
  code: 'PRD-CAY',
  name: 'Demlik Çay',
  unitName: 'Adet',
  costPriceKurus: 250,
  salePriceKurus: 1000, // 10 TL
  vatRate: 20,
  minStockLevel: 5,
  isActive: true,
  trackSkt: false,
  primaryBarcode: '8690000000001',
};

const mockProduct2 = {
  id: 2,
  code: 'PRD-SU',
  name: 'Su 0.5L',
  unitName: 'Adet',
  costPriceKurus: 150,
  salePriceKurus: 500, // 5 TL
  vatRate: 20,
  minStockLevel: 10,
  isActive: true,
  trackSkt: false,
  primaryBarcode: '8690000000002',
};

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ PASSED: ${name}`);
  } catch (error: any) {
    console.error(`❌ FAILED: ${name}`);
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

console.log('--- 1. Sepet Oluşturma ve Ürün Ekleme ---');
runTest('Boş sepetin toplamı 0 kuruş olmalıdır', () => {
  const cart = new Cart();
  if (cart.grandTotalKurus !== 0) throw new Error(`Beklenen: 0, Alınan: ${cart.grandTotalKurus}`);
});

runTest('Sepete ürün eklendiğinde satır toplamı ve genel toplam doğru hesaplanmalıdır', () => {
  const cart = new Cart();
  cart.addItem(mockProduct1 as any);
  if (cart.items.length !== 1) throw new Error('Ürün eklenemedi');
  if (Cart.lineTotal(cart.items[0]) !== 1000) throw new Error(`Beklenen satır toplamı: 1000, Alınan: ${Cart.lineTotal(cart.items[0])}`);
  if (cart.grandTotalKurus !== 1000) throw new Error(`Beklenen genel toplam: 1000, Alınan: ${cart.grandTotalKurus}`);
});

runTest('Aynı ürün eklendiğinde yeni satır oluşturmak yerine miktar artırılmalıdır', () => {
  const cart = new Cart();
  cart.addItem(mockProduct1 as any);
  cart.addItem(mockProduct1 as any);
  if (cart.items.length !== 1) throw new Error('Aynı ürün için yeni satır oluşturuldu');
  if (cart.items[0].quantity !== 2) throw new Error(`Beklenen miktar: 2, Alınan: ${cart.items[0].quantity}`);
  if (cart.grandTotalKurus !== 2000) throw new Error(`Beklenen genel toplam: 2000, Alınan: ${cart.grandTotalKurus}`);
});

console.log('\n--- 2. Miktar ve İndirim Değiştirme ---');
runTest('Satır miktarı güncellendiğinde toplamlar yeniden hesaplanmalıdır', () => {
  const cart = new Cart();
  cart.addItem(mockProduct1 as any);
  cart.updateQuantity(mockProduct1.id, 5);
  if (cart.items[0].quantity !== 5) throw new Error('Miktar güncellenemedi');
  if (cart.grandTotalKurus !== 5000) throw new Error(`Beklenen: 5000, Alınan: ${cart.grandTotalKurus}`);
});

runTest('Negatif miktar veya sıfır girilirse hata fırlatılmalıdır', () => {
  const cart = new Cart();
  cart.addItem(mockProduct1 as any);
  let errorCaught = false;
  try {
    cart.updateQuantity(mockProduct1.id, 0);
  } catch (e) {
    errorCaught = true;
  }
  if (!errorCaught) throw new Error('Sıfır miktar için hata fırlatılmadı');
});

runTest('Satıra indirim uygulandığında toplam düşmelidir', () => {
  const cart = new Cart();
  cart.addItem(mockProduct1 as any); // 10 TL
  cart.updateDiscount(mockProduct1.id, 200); // 2 TL indirim
  if (Cart.lineTotal(cart.items[0]) !== 800) throw new Error(`Beklenen satır toplamı: 800, Alınan: ${Cart.lineTotal(cart.items[0])}`);
  if (cart.grandTotalKurus !== 800) throw new Error(`Beklenen genel toplam: 800, Alınan: ${cart.grandTotalKurus}`);
});

console.log('\n--- 3. Sepet Silme ve Temizleme ---');
runTest('Sepetten ürün çıkarılabilmelidir', () => {
  const cart = new Cart();
  cart.addItem(mockProduct1 as any);
  cart.addItem(mockProduct2 as any);
  cart.removeItem(mockProduct1.id);
  if (cart.items.length !== 1) throw new Error('Ürün sepetten silinemedi');
  if (cart.grandTotalKurus !== 500) throw new Error(`Beklenen genel toplam: 500, Alınan: ${cart.grandTotalKurus}`);
});

runTest('Sepet tamamen temizlenebilmelidir', () => {
  const cart = new Cart();
  cart.addItem(mockProduct1 as any);
  cart.clear();
  if (cart.items.length !== 0) throw new Error('Sepet temizlenemedi');
  if (cart.grandTotalKurus !== 0) throw new Error(`Beklenen genel toplam: 0, Alınan: ${cart.grandTotalKurus}`);
});

console.log('\n==========================================');
console.log('🎉 ALL POS DOMAIN TESTS PASSED!');
console.log('==========================================\n');
