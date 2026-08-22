-- Migration 0001: Initial Schema for Büfe POS
-- All financial amounts are stored as INTEGER in Kurus (100.50 TL = 10050)

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    color_code VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    unit_name VARCHAR(15) DEFAULT 'Adet',
    cost_price_kurus INTEGER NOT NULL DEFAULT 0,
    sale_price_kurus INTEGER NOT NULL DEFAULT 0,
    vat_rate DECIMAL(4,2) NOT NULL DEFAULT 20.00,
    min_stock_level DECIMAL(10,3) DEFAULT 5.000,
    track_skt BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Product Barcodes
CREATE TABLE IF NOT EXISTS product_barcodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode VARCHAR(50) NOT NULL UNIQUE,
    is_primary BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Stock
CREATE TABLE IF NOT EXISTS stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, warehouse_id)
);

-- 6. Users & RBAC
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY(role_id, permission_id)
);

-- 7. Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    movement_type VARCHAR(20) NOT NULL CHECK(movement_type IN ('SATIS', 'ALIS', 'SATIS_IADE', 'ALIS_IADE', 'SAYIM_FAZLASI', 'SAYIM_EKSIGI', 'ZAYI', 'FIRE', 'DEPO_TRANSFER')),
    quantity DECIMAL(12,3) NOT NULL,
    unit_price_kurus INTEGER DEFAULT 0,
    reference_type VARCHAR(30),
    reference_id INTEGER,
    note VARCHAR(255),
    user_id INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Customers & Suppliers
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(200),
    tax_office VARCHAR(50),
    tax_number VARCHAR(50),
    balance_kurus INTEGER DEFAULT 0,
    credit_limit_kurus INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(30) UNIQUE,
    name VARCHAR(100) NOT NULL,
    company_title VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(200),
    tax_office VARCHAR(50),
    tax_number VARCHAR(50),
    balance_kurus INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Cash Registers & Sessions
CREATE TABLE IF NOT EXISTS cash_registers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    current_balance_kurus INTEGER DEFAULT 0,
    is_open BOOLEAN DEFAULT 0,
    opened_at DATETIME,
    closed_at DATETIME,
    opened_by_user_id INTEGER REFERENCES users(id),
    closed_by_user_id INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cash_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cash_register_id INTEGER NOT NULL REFERENCES cash_registers(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    opening_balance_kurus INTEGER NOT NULL DEFAULT 0,
    closing_balance_kurus INTEGER,
    expected_balance_kurus INTEGER,
    status VARCHAR(15) DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED')),
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME
);

-- 10. Sales & Items & Payments
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_id VARCHAR(36) NOT NULL UNIQUE,
    receipt_no VARCHAR(30) NOT NULL UNIQUE,
    customer_id INTEGER REFERENCES customers(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    cash_register_id INTEGER REFERENCES cash_registers(id),
    subtotal_kurus INTEGER NOT NULL DEFAULT 0,
    vat_amount_kurus INTEGER NOT NULL DEFAULT 0,
    discount_amount_kurus INTEGER NOT NULL DEFAULT 0,
    total_amount_kurus INTEGER NOT NULL DEFAULT 0,
    payment_status VARCHAR(15) DEFAULT 'PAID' CHECK(payment_status IN ('PAID', 'UNPAID', 'PARTIAL')),
    is_returned BOOLEAN DEFAULT 0,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    barcode VARCHAR(50),
    product_name VARCHAR(100) NOT NULL,
    unit_price_kurus INTEGER NOT NULL,
    cost_price_kurus INTEGER NOT NULL DEFAULT 0,
    quantity DECIMAL(10,3) NOT NULL,
    vat_rate DECIMAL(4,2) NOT NULL DEFAULT 20.00,
    vat_amount_kurus INTEGER NOT NULL DEFAULT 0,
    discount_amount_kurus INTEGER DEFAULT 0,
    line_total_kurus INTEGER NOT NULL,
    is_returned BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_type VARCHAR(20) NOT NULL CHECK(payment_type IN ('NAKIT', 'KREDI_KARTI', 'CARI_VERESIYE', 'QR')),
    amount_kurus INTEGER NOT NULL,
    payment_provider VARCHAR(50) DEFAULT 'MANUAL',
    transaction_ref VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Cash Movements
CREATE TABLE IF NOT EXISTS cash_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cash_register_id INTEGER NOT NULL REFERENCES cash_registers(id),
    movement_type VARCHAR(30) NOT NULL CHECK(movement_type IN ('SATIS_TAHSILAT', 'GIDER', 'NAKIT_GIRIS', 'NAKIT_CIKIS', 'VERESIYE_TAHSILAT', 'TEDARIKCI_ODEME')),
    amount_kurus INTEGER NOT NULL,
    category VARCHAR(50),
    note VARCHAR(255),
    sale_id INTEGER REFERENCES sales(id),
    customer_id INTEGER REFERENCES customers(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Offline Sync Queue (Outbox Pattern)
CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_name VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    action VARCHAR(10) NOT NULL CHECK(action IN ('CREATE', 'UPDATE', 'DELETE')),
    payload TEXT NOT NULL,
    status VARCHAR(15) DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PROCESSING', 'SYNCED', 'FAILED')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced_at DATETIME
);

-- 14. Application Settings
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(100),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_barcodes_barcode ON product_barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod_date ON stock_movements(product_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_receipt_no ON sales(receipt_no);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_sync_id ON sales(sync_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);

-- DEFAULT SEED DATA FOR PHASE 1
INSERT OR IGNORE INTO warehouses (id, code, name, is_default) VALUES (1, 'ANA_DEPO', 'Ana Büfe Deposu', 1);
INSERT OR IGNORE INTO cash_registers (id, name, current_balance_kurus) VALUES (1, 'Ana Kasa', 0);
INSERT OR IGNORE INTO roles (id, name, description) VALUES 
    (1, 'ADMIN', 'Tam Sistem Yöneticisi'),
    (2, 'CASHIER', 'Kasiyer Satış Elemanı'),
    (3, 'INVENTORY', 'Stok ve Depo Görevlisi');

INSERT OR IGNORE INTO settings (key, value, description) VALUES
    ('business_name', 'Büfe Otomasyonu', 'İşletme Adı'),
    ('receipt_footer', 'Teşekkür Ederiz Yine Bekleriz', 'Fiş Alt Bilgisi'),
    ('default_vat_rate', '20.00', 'Varsayılan KDV Oranı');
