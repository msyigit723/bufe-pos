import os

path = r'C:\Users\Ali Altın\Desktop\bufe-pos\src-tauri\src\commands\mod.rs'

cancel_logic = """
// --- PHASE 6: İPTAL İŞLEMİ ---

#[tauri::command]
pub fn cancel_sale(sale_id: i64, reason: Option<String>) -> Result<(), String> {
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let (status, receipt_no, cash_register_id, customer_id): (String, String, Option<i64>, Option<i64>) = tx.query_row(
        "SELECT status, receipt_no, cash_register_id, customer_id FROM sales WHERE id = ?",
        params![sale_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
    ).map_err(|_| "Satış bulunamadı.".to_string())?;

    if status != "COMPLETED" {
        return Err("Sadece durumu 'TAMAMLANDI' olan satışlar iptal edilebilir.".to_string());
    }

    // 1. İptal Stok İşlemleri
    let mut stmt = tx.prepare("SELECT product_id, quantity FROM sale_items WHERE sale_id = ?").unwrap();
    let items = stmt.query_map(params![sale_id], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, f64>(1)?))
    }).unwrap();

    let warehouse_id = 1; // Varsayılan depo

    for item in items {
        if let Ok((p_id, qty)) = item {
            let track_stock: bool = tx.query_row("SELECT track_stock FROM products WHERE id = ?", params![p_id], |row| row.get(0)).unwrap_or(false);
            if track_stock {
                tx.execute("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?", params![qty, p_id]).map_err(|e| e.to_string())?;
                tx.execute(
                    "INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, user_id, note, reference_type, reference_id) VALUES (?, ?, 'SATIS_IADE', ?, 1, ?, 'SALE', ?)", 
                    params![p_id, warehouse_id, qty, format!("İptal Fiş: {}", receipt_no), sale_id]
                ).map_err(|e| e.to_string())?;
            }
        }
    }

    // 2. İptal Ödeme / Kasa İşlemleri
    let mut stmt_pay = tx.prepare("SELECT payment_type, amount_kurus FROM sale_payments WHERE sale_id = ?").unwrap();
    let payments = stmt_pay.query_map(params![sale_id], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    }).unwrap();

    for pay in payments {
        if let Ok((ptype, amt)) = pay {
            if ptype == "NAKIT" {
                if let Some(c_id) = cash_register_id {
                    tx.execute("UPDATE cash_registers SET current_balance_kurus = current_balance_kurus - ? WHERE id = ?", params![amt, c_id]).map_err(|e| e.to_string())?;
                    tx.execute(
                        "INSERT INTO cash_movements (cash_register_id, movement_type, amount_kurus, user_id, note, sale_id) VALUES (?, 'NAKIT_CIKIS', ?, 1, ?, ?)",
                        params![c_id, amt, format!("Satış iptali - Fiş: {}", receipt_no), sale_id]
                    ).map_err(|e| e.to_string())?;
                }
            } else if ptype == "CARI_VERESIYE" {
                if let Some(c_id) = customer_id {
                    tx.execute("UPDATE customers SET balance_kurus = balance_kurus - ? WHERE id = ?", params![amt, c_id]).map_err(|e| e.to_string())?;
                }
            }
        }
    }

    // 3. Durum Güncelleme
    tx.execute(
        "UPDATE sales SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP, cancel_reason = ?, cancelled_by = 1 WHERE id = ?",
        params![reason, sale_id]
    ).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
"""

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if "pub fn cancel_sale" not in content:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content + "\n" + cancel_logic)
