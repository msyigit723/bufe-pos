-- Migration 0005: Idempotent Seed Data

-- Insert default categories if they don't exist
INSERT OR IGNORE INTO categories (id, name, sort_order, color_code, is_active) VALUES
(6, 'Soğuk İçecekler', 6, '#3B82F6', 1),
(7, 'Sıcak İçecekler', 7, '#EF4444', 1),
(8, 'Yiyecekler', 8, '#F59E0B', 1),
(9, 'Atıştırmalık', 9, '#10B981', 1);

-- Insert seed products if they don't exist
INSERT OR IGNORE INTO products (id, code, name, category_id, unit_name, cost_price_kurus, sale_price_kurus, is_active) VALUES
(101, 'SEED-CAY', 'Çay', 7, 'Bardak', 1000, 3500, 1),
(102, 'SEED-TURK-KAHVESI', 'Türk Kahvesi', 7, 'Fincan', 1500, 5000, 1),
(103, 'SEED-KAHVE', 'Kahve', 7, 'Fincan', 1500, 4500, 1),
(104, 'SEED-TOST', 'Tost', 8, 'Porsiyon', 2000, 7000, 1),
(105, 'SEED-KASARLI-TOST', 'Kaşarlı Tost', 8, 'Porsiyon', 2500, 8000, 1),
(106, 'SEED-POPKEK', 'Popkek', 9, 'Adet', 1000, 2000, 1),
(107, 'SEED-CRAX', 'Crax', 9, 'Adet', 1000, 2200, 1),
(108, 'SEED-COLA', 'Coca Cola', 6, 'Adet', 2000, 4000, 1),
(109, 'SEED-FANTA', 'Fanta', 6, 'Adet', 2000, 3800, 1),
(110, 'SEED-SU', 'Su', 6, 'Adet', 300, 1000, 1),
(111, 'SEED-CIPS', 'Cips', 9, 'Adet', 1500, 3500, 1),
(112, 'SEED-CIKOLATA', 'Çikolata', 9, 'Adet', 1000, 2500, 1),
(113, 'SEED-BISKUVI', 'Bisküvi', 9, 'Adet', 1000, 2500, 1);

-- We specify specific IDs above so we can add barcodes to the barcoded items (IDs 106-113)
INSERT OR IGNORE INTO product_barcodes (product_id, barcode, is_primary) VALUES
(106, '8690840134101', 1), -- Fake popkek barcode
(107, '8690840134102', 1), -- Fake crax barcode
(108, '8690840134103', 1), -- Fake cola barcode
(109, '8690840134104', 1), -- Fake fanta barcode
(110, '8690840134105', 1), -- Fake su barcode
(111, '8690840134106', 1), -- Fake cips barcode
(112, '8690840134107', 1), -- Fake cikolata barcode
(113, '8690840134108', 1); -- Fake biskuvi barcode

-- Insert Users (Passwords are managed in 0006)
INSERT OR IGNORE INTO users (id, username, password_hash, full_name, is_active) VALUES
(1, 'admin', '$argon2id$v=19$m=19456,t=2,p=1$1PSHdP1RIUI3XMJBaIDHeg$jbmYLtxamDdNRiki/T/DNbKu2L5G7hnTrN/SGWBTvio', 'Sistem Yöneticisi', 1),
(2, 'personel', '$argon2id$v=19$m=19456,t=2,p=1$1zfluzqgVNCuuZ1CWY+9mw$h2Yuvkqufmcqu3jtYKgNWP6/3bVkO+IQbaeTWJzOL68', 'Kasa Görevlisi', 1);

-- Admin has role 1 (ADMIN), Personel has role 2 (CASHIER)
INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES
(1, 1),
(2, 2);
