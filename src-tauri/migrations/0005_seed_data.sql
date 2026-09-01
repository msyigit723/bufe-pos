-- Migration 0005: Idempotent Seed Data

-- Insert default categories if they don't exist
INSERT OR IGNORE INTO categories (id, name, sort_order, color_code, is_active) VALUES
(6, 'Soğuk İçecekler', 6, '#3B82F6', 1),
(7, 'Sıcak İçecekler', 7, '#EF4444', 1),
(8, 'Yiyecekler', 8, '#F59E0B', 1),
(9, 'Atıştırmalık', 9, '#10B981', 1);

-- Insert seed products if they don't exist
INSERT OR IGNORE INTO products (code, name, category_id, unit_name, cost_price_kurus, sale_price_kurus, is_active)
VALUES
('SEED-SU', 'Su (0.5L)', 6, 'Adet', 300, 1000, 1),
('SEED-COLA', 'Coca Cola (330ml)', 6, 'Adet', 1500, 3000, 1),
('SEED-FANTA', 'Fanta (330ml)', 6, 'Adet', 1500, 3000, 1),
('SEED-CAY', 'Çay', 7, 'Bardak', 100, 1500, 1),
('SEED-TURK-KAHVESI', 'Türk Kahvesi', 7, 'Fincan', 300, 4000, 1),
('SEED-TOST', 'Tost', 8, 'Porsiyon', 1000, 4000, 1),
('SEED-KASARLI-TOST', 'Kaşarlı Tost', 8, 'Porsiyon', 1500, 5000, 1),
('SEED-CIPS', 'Cips (Klasik)', 9, 'Adet', 1000, 2500, 1),
('SEED-CIKOLATA', 'Çikolata', 9, 'Adet', 500, 1500, 1);

-- We don't add barcodes for these so they can be shown in the Quick Sales section.
