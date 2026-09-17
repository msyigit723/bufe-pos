import os

path = r'C:\Users\Ali Altın\Desktop\bufe-pos\src-tauri\src\commands\mod.rs'

refund_logic = """
// --- PHASE 7: İADE İŞLEMİ ---

#[derive(Serialize, Deserialize, Debug)]
pub struct SaleDetailItemDto {
    pub id: i64,
    pub product_id: i64,
    pub product_name: String,
    pub quantity: f64,
    pub refunded_quantity: f64,
    pub unit_price_kurus: i64,
    pub line_total_kurus: i64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SaleDetailDto {
    pub id: i64,
    pub receipt_no: String,
    pub status: String,
    pub total_amount_kurus: i64,
    pub refunded_amount_kurus: i64,
    pub items: Vec<SaleDetailItemDto>,
    pub created_at: String,
}

#[tauri::command]
pub fn get_sale_details(sale_id: i64) -> Result<SaleDetailDto, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    let (id, receipt_no, status, total, refunded, created_at): (i64, String, String, i64, i64, String) = conn.query_row(
        "SELECT id, receipt_no, status, total_amount_kurus, COALESCE(refunded_amount_kurus, 0), REPLACE(created_at, ' ', 'T') || 'Z'
         FROM sales WHERE id = ?",
        params![sale_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?, row.get(5)?))
    ).map_err(|_| "Satış bulunamadı.".to_string())?;

    let mut stmt = conn.prepare(
        "SELECT si.id, si.product_id, p.name, si.quantity, si.refunded_quantity, si.unit_price_kurus, si.line_total_kurus 
         FROM sale_items si 
         JOIN products p ON p.id = si.product_id 
         WHERE si.sale_id = ?"
    ).unwrap();

    let iter = stmt.query_map(params![sale_id], |row| {
        Ok(SaleDetailItemDto {
            id: row.get(0)?,
            product_id: row.get(1)?,
            product_name: row.get(2)?,
            quantity: row.get(3)?,
            refunded_quantity: row.get(4)?,
            unit_price_kurus: row.get(5)?,
            line_total_kurus: row.get(6)?,
        })
    }).unwrap();

    let mut items = Vec::new();
    for item in iter {
        if let Ok(i) = item {
            items.push(i);
        }
    }

    Ok(SaleDetailDto { id, receipt_no, status, total_amount_kurus: total, refunded_amount_kurus: refunded, items, created_at })
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RefundItemInput {
    pub sale_item_id: i64,
    pub quantity: f64,
}

#[tauri::command]
pub fn refund_sale(sale_id: i64, items: Vec<RefundItemInput>, reason: Option<String>) -> Result<(), String> {
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let (status, receipt_no, cash_register_id, customer_id): (String, String, Option<i64>, Option<i64>) = tx.query_row(
        "SELECT status, receipt_no, cash_register_id, customer_id FROM sales WHERE id = ?",
        params![sale_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
    ).map_err(|_| "Satış bulunamadı".to_string())?;

    if status == "CANCELLED" {
        return Err("İptal edilmiş satış iade edilemez.".to_string());
    }

    let mut total_refund_kurus = 0;

    tx.execute("INSERT INTO refunds (sale_id, amount_kurus, reason, user_id) VALUES (?, 0, ?, 1)", params![sale_id, reason.clone()]).map_err(|e| e.to_string())?;
    let refund_id = tx.last_insert_rowid();

    for req_item in items {
        if req_item.quantity <= 0.0 { continue; }
        let (p_id, unit_price, max_qty, refunded_qty): (i64, i64, f64, f64) = tx.query_row(
            "SELECT product_id, unit_price_kurus, quantity, refunded_quantity FROM sale_items WHERE id = ? AND sale_id = ?",
            params![req_item.sale_item_id, sale_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
        ).map_err(|_| "Ürün bulunamadı.".to_string())?;

        if req_item.quantity > (max_qty - refunded_qty) {
            return Err("İade miktarı kalan miktardan büyük olamaz.".to_string());
        }

        let refund_val = (unit_price as f64 * req_item.quantity) as i64;
        total_refund_kurus += refund_val;

        tx.execute("UPDATE sale_items SET refunded_quantity = refunded_quantity + ? WHERE id = ?", params![req_item.quantity, req_item.sale_item_id]).unwrap();

        tx.execute("INSERT INTO refund_items (refund_id, sale_item_id, quantity, amount_kurus) VALUES (?, ?, ?, ?)",
            params![refund_id, req_item.sale_item_id, req_item.quantity, refund_val]).unwrap();

        let track_stock: bool = tx.query_row("SELECT track_stock FROM products WHERE id = ?", params![p_id], |row| row.get(0)).unwrap_or(false);
        if track_stock {
            tx.execute("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?", params![req_item.quantity, p_id]).unwrap();
            tx.execute(
                "INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, user_id, note, reference_type, reference_id) VALUES (?, 1, 'SATIS_IADE', ?, 1, ?, 'REFUND', ?)", 
                params![p_id, req_item.quantity, format!("İade Fiş: {}", receipt_no), refund_id]
            ).unwrap();
        }
    }

    if total_refund_kurus <= 0 {
        return Err("İade edilecek ürün seçilmedi.".to_string());
    }

    tx.execute("UPDATE refunds SET amount_kurus = ? WHERE id = ?", params![total_refund_kurus, refund_id]).unwrap();

    // Akıllı iade ödeme tahsisi: Nakit varsa Nakit'ten, Kredi Kartı varsa Karttan, Veresiye varsa Veresiyeden düş.
    // Basitlik için sadece tek ödeme yöntemini kabul edelim veya en güvenli yol: NAKIT
    // Tamamı veresiye ise bakiyeyi düşelim.
    let mut stmt_pay = tx.prepare("SELECT payment_type, amount_kurus FROM sale_payments WHERE sale_id = ?").unwrap();
    let payments = stmt_pay.query_map(params![sale_id], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    }).unwrap();

    let mut total_paid_orig = 0;
    let mut has_veresiye = false;
    for p in payments {
        if let Ok((pt, amt)) = p {
            total_paid_orig += amt;
            if pt == "CARI_VERESIYE" { has_veresiye = true; }
        }
    }

    if has_veresiye && total_paid_orig > 0 {
        if let Some(c_id) = customer_id {
            tx.execute("UPDATE customers SET balance_kurus = balance_kurus - ? WHERE id = ?", params![total_refund_kurus, c_id]).unwrap();
        }
    } else {
        if let Some(c_id) = cash_register_id {
            tx.execute("UPDATE cash_registers SET current_balance_kurus = current_balance_kurus - ? WHERE id = ?", params![total_refund_kurus, c_id]).unwrap();
            tx.execute(
                "INSERT INTO cash_movements (cash_register_id, movement_type, amount_kurus, user_id, note, sale_id) VALUES (?, 'NAKIT_CIKIS', ?, 1, ?, ?)",
                params![c_id, total_refund_kurus, format!("İade - Fiş: {}", receipt_no), sale_id]
            ).unwrap();
        }
    }

    let (orig_total, current_refunded): (i64, i64) = tx.query_row("SELECT total_amount_kurus, COALESCE(refunded_amount_kurus, 0) FROM sales WHERE id = ?", params![sale_id], |row| Ok((row.get(0)?, row.get(1)?))).unwrap();
    
    let new_refunded = current_refunded + total_refund_kurus;
    let new_status = if new_refunded >= orig_total { "REFUNDED" } else { "PARTIALLY_REFUNDED" };

    tx.execute("UPDATE sales SET refunded_amount_kurus = ?, status = ? WHERE id = ?", params![new_refunded, new_status, sale_id]).unwrap();

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
"""

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if "pub fn refund_sale" not in content:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content + "\n" + refund_logic)
