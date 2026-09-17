-- Migrate existing VERESIYE_TAHSILAT cash movements to customer_payments if they don't exist
INSERT INTO customer_payments (customer_id, amount_kurus, payment_type, cash_register_id, user_id, created_at)
SELECT cm.customer_id, cm.amount_kurus, 'NAKIT', cm.cash_register_id, cm.user_id, cm.created_at
FROM cash_movements cm
WHERE cm.movement_type = 'VERESIYE_TAHSILAT'
  AND NOT EXISTS (
      SELECT 1 FROM customer_payments cp 
      WHERE cp.customer_id = cm.customer_id 
        AND cp.amount_kurus = cm.amount_kurus 
        AND cp.created_at = cm.created_at
  );
