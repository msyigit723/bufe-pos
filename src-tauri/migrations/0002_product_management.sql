-- Migration 0002: Product & Category Management Enhancements
-- Adds specialized indexes, automatic updated_at trigger, and default categories

-- 1. Optimized Indexes for Category and Product lookups
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- 2. Automatic updated_at trigger for products
CREATE TRIGGER IF NOT EXISTS trg_products_updated_at
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 3. Default Büfe Categories (INSERT OR IGNORE to guarantee idempotency)
INSERT OR IGNORE INTO categories (id, name, sort_order, color_code, is_active) VALUES
    (1, 'İçecekler', 1, '#3B82F6', 1),
    (2, 'Gıda / Atıştırmalık', 2, '#10B981', 1),
    (3, 'Tütün Ürünleri', 3, '#64748B', 1),
    (4, 'Gazete / Dergi', 4, '#F59E0B', 1),
    (5, 'Diğer', 5, '#8B5CF6', 1);
