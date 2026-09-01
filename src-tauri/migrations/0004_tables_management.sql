-- Migration 0004: Tables Management for Tea Garden (Masa Yönetimi)

CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT 1,
    status VARCHAR(20) DEFAULT 'EMPTY' CHECK(status IN ('EMPTY', 'OCCUPIED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS table_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price_kurus INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed basic tables
INSERT OR IGNORE INTO tables (name, is_active, status) VALUES 
('Masa 1', 1, 'EMPTY'),
('Masa 2', 1, 'EMPTY'),
('Masa 3', 1, 'EMPTY'),
('Masa 4', 1, 'EMPTY'),
('Masa 5', 1, 'EMPTY'),
('Masa 6', 1, 'EMPTY');
