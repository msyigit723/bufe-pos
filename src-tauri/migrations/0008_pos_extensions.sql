-- Migration 0008: Add Cancellation and Refunds support

-- Add cancellation and status tracking to sales table
ALTER TABLE sales ADD COLUMN status VARCHAR(20) DEFAULT 'COMPLETED' CHECK(status IN ('COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'));
ALTER TABLE sales ADD COLUMN cancelled_at DATETIME;
ALTER TABLE sales ADD COLUMN cancel_reason VARCHAR(255);
ALTER TABLE sales ADD COLUMN cancelled_by INTEGER REFERENCES users(id);
ALTER TABLE sales ADD COLUMN refunded_amount_kurus INTEGER DEFAULT 0;

-- Track refunded quantity on sale items
ALTER TABLE sale_items ADD COLUMN refunded_quantity DECIMAL(10,3) DEFAULT 0.000;

-- Create refunds table to track multiple partial refunds traceably
CREATE TABLE refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    amount_kurus INTEGER NOT NULL,
    reason VARCHAR(255),
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refund_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    refund_id INTEGER NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
    sale_item_id INTEGER NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
    quantity DECIMAL(10,3) NOT NULL,
    amount_kurus INTEGER NOT NULL
);

CREATE TABLE refund_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    refund_id INTEGER NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
    payment_type VARCHAR(20) NOT NULL,
    amount_kurus INTEGER NOT NULL
);
