CREATE TABLE IF NOT EXISTS customer_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    amount_kurus INTEGER NOT NULL,
    payment_type VARCHAR(20) NOT NULL CHECK(payment_type IN ('NAKIT', 'KREDI_KARTI')),
    cash_register_id INTEGER REFERENCES cash_registers(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
