use crate::database::DatabaseManager;
use crate::security::SecurityManager;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub fn get_db_manager() -> DatabaseManager {
    if let Ok(test_dir) = std::env::var("BUFEPOS_TEST_DB_DIR") {
        return DatabaseManager::new(std::path::PathBuf::from(test_dir));
    }
    let app_dir = dirs::data_local_dir()
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from(".")))
        .join("BufePOS");
    DatabaseManager::new(app_dir)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HealthCheckResponse {
    pub foreign_keys_active: bool,
    pub wal_mode_active: bool,
    pub total_tables: usize,
    pub status: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CategoryDto {
    pub id: i64,
    pub name: String,
    pub sort_order: i32,
    pub color_code: String,
    pub is_active: bool,
    pub product_count: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateCategoryInput {
    pub name: String,
    pub sort_order: Option<i32>,
    pub color_code: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UpdateCategoryInput {
    pub id: i64,
    pub name: String,
    pub sort_order: i32,
    pub color_code: String,
    pub is_active: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BarcodeDto {
    pub id: i64,
    pub product_id: i64,
    pub barcode: String,
    pub is_primary: bool,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProductDto {
    pub id: i64,
    pub code: String,
    pub name: String,
    pub category_id: Option<i64>,
    pub category_name: Option<String>,
    pub unit_name: String,
    pub cost_price_kurus: i64,
    pub sale_price_kurus: i64,
    pub vat_rate: f64,
    pub min_stock_level: f64,
    pub track_skt: bool,
    pub is_active: bool,
    pub barcodes: Vec<BarcodeDto>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ProductFilterInput {
    pub search: Option<String>,
    pub category_id: Option<i64>,
    pub is_active: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateProductInput {
    pub code: String,
    pub name: String,
    pub category_id: Option<i64>,
    pub unit_name: Option<String>,
    pub cost_price_kurus: i64,
    pub sale_price_kurus: i64,
    pub vat_rate: Option<f64>,
    pub min_stock_level: Option<f64>,
    pub track_skt: Option<bool>,
    pub is_active: Option<bool>,
    pub initial_barcode: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UpdateProductInput {
    pub id: i64,
    pub code: String,
    pub name: String,
    pub category_id: Option<i64>,
    pub unit_name: String,
    pub cost_price_kurus: i64,
    pub sale_price_kurus: i64,
    pub vat_rate: f64,
    pub min_stock_level: f64,
    pub track_skt: bool,
    pub is_active: bool,
}

// -------------------------------------------------------------
// System & Health Commands
// -------------------------------------------------------------

#[tauri::command]
pub fn db_health_check() -> Result<HealthCheckResponse, String> {
    let db_manager = get_db_manager();
    match db_manager.health_check() {
        Ok((fk_active, wal_active, total_tables)) => Ok(HealthCheckResponse {
            foreign_keys_active: fk_active,
            wal_mode_active: wal_active,
            total_tables,
            status: "OK".to_string(),
        }),
        Err(e) => Err(format!("SaÄŸlÄ±k kontrolÃ¼ baÅŸarÄ±sÄ±z: {}", e)),
    }
}

#[tauri::command]
pub fn run_migrations() -> Result<String, String> {
    let db_manager = get_db_manager();
    db_manager
        .run_all_migrations()
        .map(|_| "TÃ¼m veritabanÄ± migration iÅŸlemleri baÅŸarÄ±yla tamamlandÄ±.".to_string())
        .map_err(|e| format!("Migration hatasÄ±: {}", e))
}

#[tauri::command]
pub fn hash_password(password: String) -> Result<String, String> {
    SecurityManager::hash_password(&password)
}

#[tauri::command]
pub fn verify_password(password: String, hash: String) -> Result<bool, String> {
    SecurityManager::verify_password(&password, &hash)
}

// -------------------------------------------------------------
// Category Commands
// -------------------------------------------------------------

#[tauri::command]
pub fn list_categories() -> Result<Vec<CategoryDto>, String> {
    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT c.id, c.name, c.sort_order, c.color_code, c.is_active,
                    (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) as product_count
             FROM categories c
             ORDER BY c.sort_order ASC, c.name ASC",
        )
        .map_err(|e| format!("Kategori listesi sorgulanamadÄ±: {}", e))?;

    let categories = stmt
        .query_map([], |row| {
            Ok(CategoryDto {
                id: row.get(0)?,
                name: row.get(1)?,
                sort_order: row.get(2)?,
                color_code: row.get(3)?,
                is_active: row.get(4)?,
                product_count: row.get(5)?,
            })
        })
        .map_err(|e| format!("Kategori verisi okunamadÄ±: {}", e))?
        .collect::<Result<Vec<CategoryDto>, _>>()
        .map_err(|e| format!("Kategoriler listelenirken hata: {}", e))?;

    Ok(categories)
}

#[tauri::command]
pub fn create_category(input: CreateCategoryInput) -> Result<CategoryDto, String> {
    let trimmed_name = input.name.trim();
    if trimmed_name.is_empty() {
        return Err("Kategori adÄ± boÅŸ bÄ±rakÄ±lamaz.".to_string());
    }

    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let sort_order = input.sort_order.unwrap_or(0);
    let color_code = input.color_code.unwrap_or_else(|| "#3B82F6".to_string());

    let result = conn.execute(
        "INSERT INTO categories (name, sort_order, color_code, is_active) VALUES (?, ?, ?, 1)",
        params![trimmed_name, sort_order, color_code],
    );

    match result {
        Ok(_) => {
            let id = conn.last_insert_rowid();
            Ok(CategoryDto {
                id,
                name: trimmed_name.to_string(),
                sort_order,
                color_code,
                is_active: true,
                product_count: 0,
            })
        }
        Err(rusqlite::Error::SqliteFailure(err, _))
            if err.extended_code == 2067 || err.extended_code == 1555 =>
        {
            Err("Bu isimde bir kategori zaten mevcut.".to_string())
        }
        Err(e) => Err(format!("Kategori eklenemedi: {}", e)),
    }
}

#[tauri::command]
pub fn update_category(input: UpdateCategoryInput) -> Result<CategoryDto, String> {
    let trimmed_name = input.name.trim();
    if trimmed_name.is_empty() {
        return Err("Kategori adÄ± boÅŸ bÄ±rakÄ±lamaz.".to_string());
    }

    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let result = conn.execute(
        "UPDATE categories SET name = ?, sort_order = ?, color_code = ?, is_active = ? WHERE id = ?",
        params![trimmed_name, input.sort_order, input.color_code, input.is_active, input.id],
    );

    match result {
        Ok(rows) if rows > 0 => {
            let product_count: i64 = conn
                .query_row(
                    "SELECT COUNT(*) FROM products WHERE category_id = ?",
                    params![input.id],
                    |row| row.get(0),
                )
                .unwrap_or(0);

            Ok(CategoryDto {
                id: input.id,
                name: trimmed_name.to_string(),
                sort_order: input.sort_order,
                color_code: input.color_code,
                is_active: input.is_active,
                product_count,
            })
        }
        Ok(_) => Err("Kategori bulunamadÄ±.".to_string()),
        Err(rusqlite::Error::SqliteFailure(err, _))
            if err.extended_code == 2067 || err.extended_code == 1555 =>
        {
            Err("Bu isimde baÅŸka bir kategori zaten mevcut.".to_string())
        }
        Err(e) => Err(format!("Kategori gÃ¼ncellenemedi: {}", e)),
    }
}

#[tauri::command]
pub fn delete_category(id: i64) -> Result<bool, String> {
    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    // Check if there are attached products
    let product_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM products WHERE category_id = ?",
            params![id],
            |row| row.get(0),
        )
        .map_err(|e| format!("Kategori kontrolÃ¼ yapÄ±lamadÄ±: {}", e))?;

    if product_count > 0 {
        return Err(
            "Bu kategoriye baÄŸlÄ± Ã¼rÃ¼nler bulunduÄŸu iÃ§in kategori silinemiyor. Ã–nce Ã¼rÃ¼nlerin kategorisini deÄŸiÅŸtirin."
                .to_string(),
        );
    }

    let rows = conn
        .execute("DELETE FROM categories WHERE id = ?", params![id])
        .map_err(|e| format!("Kategori silinemedi: {}", e))?;

    Ok(rows > 0)
}

// -------------------------------------------------------------
// Barcode Helper & Commands
// -------------------------------------------------------------

fn fetch_barcodes_for_products(
    conn: &Connection,
    product_ids: &[i64],
) -> Result<std::collections::HashMap<i64, Vec<BarcodeDto>>, rusqlite::Error> {
    let mut map: std::collections::HashMap<i64, Vec<BarcodeDto>> = std::collections::HashMap::new();
    if product_ids.is_empty() {
        return Ok(map);
    }

    // Load barcodes
    let placeholders = product_ids
        .iter()
        .map(|_| "?")
        .collect::<Vec<_>>()
        .join(",");
    let sql = format!(
        "SELECT id, product_id, barcode, is_primary, created_at FROM product_barcodes WHERE product_id IN ({}) ORDER BY is_primary DESC, id ASC",
        placeholders
    );

    let mut stmt = conn.prepare(&sql)?;
    let params_vec: Vec<&dyn rusqlite::ToSql> = product_ids
        .iter()
        .map(|id| id as &dyn rusqlite::ToSql)
        .collect();

    let rows = stmt.query_map(params_vec.as_slice(), |row| {
        Ok(BarcodeDto {
            id: row.get(0)?,
            product_id: row.get(1)?,
            barcode: row.get(2)?,
            is_primary: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;

    for row in rows {
        let b = row?;
        map.entry(b.product_id).or_default().push(b);
    }

    Ok(map)
}

#[tauri::command]
pub fn add_product_barcode(
    product_id: i64,
    barcode: String,
    is_primary: bool,
) -> Result<BarcodeDto, String> {
    let trimmed = barcode.trim();
    if trimmed.is_empty() {
        return Err("Barkod boÅŸ bÄ±rakÄ±lamaz.".to_string());
    }

    let db_manager = get_db_manager();
    let mut conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let tx = conn
        .transaction()
        .map_err(|e| format!("Transaction baÅŸlatÄ±lamadÄ±: {}", e))?;

    // Check if barcode already exists on ANY product
    let existing_owner: Option<i64> = tx
        .query_row(
            "SELECT product_id FROM product_barcodes WHERE barcode = ?",
            params![trimmed],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Barkod sorgulanamadÄ±: {}", e))?;

    if let Some(owner_id) = existing_owner {
        if owner_id == product_id {
            return Err("Bu barkod bu Ã¼rÃ¼nde zaten kayÄ±tlÄ±.".to_string());
        } else {
            return Err("Bu barkod baÅŸka bir Ã¼rÃ¼nde kayÄ±tlÄ±.".to_string());
        }
    }

    // If marked as primary, reset existing primary barcodes for this product
    if is_primary {
        tx.execute(
            "UPDATE product_barcodes SET is_primary = 0 WHERE product_id = ?",
            params![product_id],
        )
        .map_err(|e| format!("Birincil barkod gÃ¼ncellenemedi: {}", e))?;
    } else {
        // If product has NO barcodes yet, make this first barcode primary automatically
        let count: i64 = tx
            .query_row(
                "SELECT COUNT(*) FROM product_barcodes WHERE product_id = ?",
                params![product_id],
                |row| row.get(0),
            )
            .unwrap_or(0);
        if count == 0 {
            // make it primary
        }
    }

    // Determine primary flag
    let existing_count: i64 = tx
        .query_row(
            "SELECT COUNT(*) FROM product_barcodes WHERE product_id = ?",
            params![product_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let actual_primary = is_primary || existing_count == 0;

    tx.execute(
        "INSERT INTO product_barcodes (product_id, barcode, is_primary) VALUES (?, ?, ?)",
        params![product_id, trimmed, actual_primary],
    )
    .map_err(|e| format!("Barkod eklenemedi: {}", e))?;

    let barcode_id = tx.last_insert_rowid();
    tx.commit()
        .map_err(|e| format!("KayÄ±t tamamlanamadÄ±: {}", e))?;

    Ok(BarcodeDto {
        id: barcode_id,
        product_id,
        barcode: trimmed.to_string(),
        is_primary: actual_primary,
        created_at: chrono_now_string(),
    })
}

#[tauri::command]
pub fn remove_product_barcode(barcode_id: i64) -> Result<bool, String> {
    let db_manager = get_db_manager();
    let mut conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let tx = conn
        .transaction()
        .map_err(|e| format!("Transaction baÅŸlatÄ±lamadÄ±: {}", e))?;

    // Check if this was primary
    let info: Option<(i64, bool)> = tx
        .query_row(
            "SELECT product_id, is_primary FROM product_barcodes WHERE id = ?",
            params![barcode_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(|e| format!("Barkod kontrolÃ¼ yapÄ±lamadÄ±: {}", e))?;

    if let Some((product_id, was_primary)) = info {
        tx.execute("DELETE FROM product_barcodes WHERE id = ?", params![barcode_id])
            .map_err(|e| format!("Barkod silinemedi: {}", e))?;

        // If it was primary, promote another barcode of this product to primary if available
        if was_primary {
            let next_barcode_id: Option<i64> = tx
                .query_row(
                    "SELECT id FROM product_barcodes WHERE product_id = ? ORDER BY id ASC LIMIT 1",
                    params![product_id],
                    |row| row.get(0),
                )
                .optional()
                .unwrap_or(None);

            if let Some(nid) = next_barcode_id {
                let _ = tx.execute(
                    "UPDATE product_barcodes SET is_primary = 1 WHERE id = ?",
                    params![nid],
                );
            }
        }

        tx.commit()
            .map_err(|e| format!("KayÄ±t tamamlanamadÄ±: {}", e))?;
        Ok(true)
    } else {
        Err("Barkod bulunamadÄ±.".to_string())
    }
}

#[tauri::command]
pub fn set_primary_barcode(product_id: i64, barcode_id: i64) -> Result<bool, String> {
    let db_manager = get_db_manager();
    let mut conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let tx = conn
        .transaction()
        .map_err(|e| format!("Transaction baÅŸlatÄ±lamadÄ±: {}", e))?;

    // Reset all
    tx.execute(
        "UPDATE product_barcodes SET is_primary = 0 WHERE product_id = ?",
        params![product_id],
    )
    .map_err(|e| format!("Birincil barkod sÄ±fÄ±rlanamadÄ±: {}", e))?;

    // Set selected
    let rows = tx
        .execute(
            "UPDATE product_barcodes SET is_primary = 1 WHERE id = ? AND product_id = ?",
            params![barcode_id, product_id],
        )
        .map_err(|e| format!("Birincil barkod ayarlanamadÄ±: {}", e))?;

    tx.commit()
        .map_err(|e| format!("KayÄ±t tamamlanamadÄ±: {}", e))?;
    Ok(rows > 0)
}

// -------------------------------------------------------------
// Product Commands
// -------------------------------------------------------------

fn chrono_now_string() -> String {
    // Return standard ISO format string or CURRENT_TIMESTAMP approximation
    let now = std::time::SystemTime::now();
    format!("{:?}", now)
}

#[tauri::command]
pub fn list_products(filter: Option<ProductFilterInput>) -> Result<Vec<ProductDto>, String> {
    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let filter = filter.unwrap_or_default();

    let mut query = String::from(
        "SELECT p.id, p.code, p.name, p.category_id, c.name as category_name,
                p.unit_name, p.cost_price_kurus, p.sale_price_kurus, p.vat_rate,
                p.min_stock_level, p.track_skt, p.is_active, REPLACE(p.created_at, ' ', 'T') || 'Z' as created_at, REPLACE(p.updated_at, ' ', 'T') || 'Z' as updated_at
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE 1=1 ",
    );

    let mut conditions = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(ref cat_id) = filter.category_id {
        conditions.push("p.category_id = ?");
        params_vec.push(Box::new(*cat_id));
    }

    if let Some(is_act) = filter.is_active {
        conditions.push("p.is_active = ?");
        params_vec.push(Box::new(if is_act { 1 } else { 0 }));
    }

    if let Some(ref search) = filter.search {
        let trimmed = search.trim();
        if !trimmed.is_empty() {
            let pattern = format!("%{}%", trimmed);
            conditions.push(
                "(p.name LIKE ? OR p.code LIKE ? OR p.id IN (SELECT product_id FROM product_barcodes WHERE barcode LIKE ?))",
            );
            params_vec.push(Box::new(pattern.clone()));
            params_vec.push(Box::new(pattern.clone()));
            params_vec.push(Box::new(pattern));
        }
    }

    for cond in conditions {
        query.push_str(" AND ");
        query.push_str(cond);
    }

    query.push_str(" ORDER BY p.name ASC");

    let mut stmt = conn
        .prepare(&query)
        .map_err(|e| format!("ÃœrÃ¼n listeleme sorgusu hazÄ±rlanamadÄ±: {}", e))?;

    let borrowed_params: Vec<&dyn rusqlite::ToSql> =
        params_vec.iter().map(|b| b.as_ref()).collect();

    struct PartialProduct {
        id: i64,
        code: String,
        name: String,
        category_id: Option<i64>,
        category_name: Option<String>,
        unit_name: String,
        cost_price_kurus: i64,
        sale_price_kurus: i64,
        vat_rate: f64,
        min_stock_level: f64,
        track_skt: bool,
        is_active: bool,
        created_at: String,
        updated_at: String,
    }

    let rows = stmt
        .query_map(borrowed_params.as_slice(), |row| {
            Ok(PartialProduct {
                id: row.get(0)?,
                code: row.get(1)?,
                name: row.get(2)?,
                category_id: row.get(3)?,
                category_name: row.get(4)?,
                unit_name: row.get(5)?,
                cost_price_kurus: row.get(6)?,
                sale_price_kurus: row.get(7)?,
                vat_rate: row.get(8)?,
                min_stock_level: row.get(9)?,
                track_skt: row.get(10)?,
                is_active: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })
        .map_err(|e| format!("ÃœrÃ¼n satÄ±rlarÄ± okunamadÄ±: {}", e))?;

    let mut partials = Vec::new();
    let mut product_ids = Vec::new();

    for r in rows {
        let p = r.map_err(|e| format!("ÃœrÃ¼n parse hatasÄ±: {}", e))?;
        product_ids.push(p.id);
        partials.push(p);
    }

    let barcodes_map = fetch_barcodes_for_products(&conn, &product_ids)
        .map_err(|e| format!("Barkodlar yÃ¼klenemedi: {}", e))?;

    let result = partials
        .into_iter()
        .map(|p| {
            let b_list = barcodes_map.get(&p.id).cloned().unwrap_or_default();
            ProductDto {
                id: p.id,
                code: p.code,
                name: p.name,
                category_id: p.category_id,
                category_name: p.category_name,
                unit_name: p.unit_name,
                cost_price_kurus: p.cost_price_kurus,
                sale_price_kurus: p.sale_price_kurus,
                vat_rate: p.vat_rate,
                min_stock_level: p.min_stock_level,
                track_skt: p.track_skt,
                is_active: p.is_active,
                barcodes: b_list,
                created_at: p.created_at,
                updated_at: p.updated_at,
            }
        })
        .collect();

    Ok(result)
}

#[tauri::command]
pub fn get_product_by_id(id: i64) -> Result<Option<ProductDto>, String> {
    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let product_row = conn
        .query_row(
            "SELECT p.id, p.code, p.name, p.category_id, c.name as category_name,
                    p.unit_name, p.cost_price_kurus, p.sale_price_kurus, p.vat_rate,
                    p.min_stock_level, p.track_skt, p.is_active, REPLACE(p.created_at, ' ', 'T') || 'Z' as created_at, REPLACE(p.updated_at, ' ', 'T') || 'Z' as updated_at
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?",
            params![id],
            |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, Option<i64>>(3)?,
                    row.get::<_, Option<String>>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, i64>(6)?,
                    row.get::<_, i64>(7)?,
                    row.get::<_, f64>(8)?,
                    row.get::<_, f64>(9)?,
                    row.get::<_, bool>(10)?,
                    row.get::<_, bool>(11)?,
                    row.get::<_, String>(12)?,
                    row.get::<_, String>(13)?,
                ))
            },
        )
        .optional()
        .map_err(|e| format!("ÃœrÃ¼n sorgulanamadÄ±: {}", e))?;

    if let Some((
        pid,
        code,
        name,
        category_id,
        category_name,
        unit_name,
        cost_price_kurus,
        sale_price_kurus,
        vat_rate,
        min_stock_level,
        track_skt,
        is_active,
        created_at,
        updated_at,
    )) = product_row
    {
        let barcodes_map = fetch_barcodes_for_products(&conn, &[pid])
            .map_err(|e| format!("Barkodlar alÄ±namadÄ±: {}", e))?;
        let barcodes = barcodes_map.get(&pid).cloned().unwrap_or_default();

        Ok(Some(ProductDto {
            id: pid,
            code,
            name,
            category_id,
            category_name,
            unit_name,
            cost_price_kurus,
            sale_price_kurus,
            vat_rate,
            min_stock_level,
            track_skt,
            is_active,
            barcodes,
            created_at,
            updated_at,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn search_product_by_barcode(barcode: String) -> Result<Option<ProductDto>, String> {
    let trimmed = barcode.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }

    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let product_id: Option<i64> = conn
        .query_row(
            "SELECT product_id FROM product_barcodes WHERE barcode = ?",
            params![trimmed],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| format!("Barkod aranamadÄ±: {}", e))?;

    if let Some(pid) = product_id {
        get_product_by_id(pid)
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn create_product(input: CreateProductInput) -> Result<ProductDto, String> {
    let trimmed_name = input.name.trim();
    if trimmed_name.is_empty() {
        return Err("ÃœrÃ¼n adÄ± boÅŸ bÄ±rakÄ±lamaz.".to_string());
    }

    let mut trimmed_code = input.code.trim().to_string();
    if trimmed_code.is_empty() {
        // Auto-generate SKU: PRD-XXXXX
        trimmed_code = format!("PRD-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase());
    }

    if input.cost_price_kurus < 0 {
        return Err("AlÄ±ÅŸ fiyatÄ± negatif olamaz.".to_string());
    }

    if input.sale_price_kurus < 0 {
        return Err("SatÄ±ÅŸ fiyatÄ± negatif olamaz.".to_string());
    }

    let unit_name = input.unit_name.unwrap_or_else(|| "Adet".to_string());
    let vat_rate = input.vat_rate.unwrap_or(20.0);
    let min_stock = input.min_stock_level.unwrap_or(5.0);
    let track_skt = input.track_skt.unwrap_or(false);
    let is_active = input.is_active.unwrap_or(true);

    let db_manager = get_db_manager();
    let mut conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    // Check barcode beforehand if provided
    let initial_barcode = input.initial_barcode.map(|b| b.trim().to_string()).filter(|b| !b.is_empty());
    if let Some(ref bc) = initial_barcode {
        let existing: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM product_barcodes WHERE barcode = ?",
                params![bc],
                |row| row.get::<_, i64>(0),
            )
            .map(|c| c > 0)
            .unwrap_or(false);

        if existing {
            return Err("Bu barkod baÅŸka bir Ã¼rÃ¼nde kayÄ±tlÄ±.".to_string());
        }
    }

    let tx = conn
        .transaction()
        .map_err(|e| format!("Transaction baÅŸlatÄ±lamadÄ±: {}", e))?;

    let insert_result = tx.execute(
        "INSERT INTO products (code, name, category_id, unit_name, cost_price_kurus, sale_price_kurus, vat_rate, min_stock_level, track_skt, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            trimmed_code,
            trimmed_name,
            input.category_id,
            unit_name,
            input.cost_price_kurus,
            input.sale_price_kurus,
            vat_rate,
            min_stock,
            is_active,
            track_skt,
        ],
    );

    let product_id = match insert_result {
        Ok(_) => tx.last_insert_rowid(),
        Err(rusqlite::Error::SqliteFailure(err, _))
            if err.extended_code == 2067 || err.extended_code == 1555 =>
        {
            return Err("Bu Ã¼rÃ¼n kodu/SKU ile kayÄ±tlÄ± baÅŸka bir Ã¼rÃ¼n mevcut.".to_string());
        }
        Err(e) => return Err(format!("ÃœrÃ¼n eklenemedi: {}", e)),
    };

    let mut barcodes = Vec::new();
    if let Some(bc) = initial_barcode {
        tx.execute(
            "INSERT INTO product_barcodes (product_id, barcode, is_primary) VALUES (?, ?, 1)",
            params![product_id, bc],
        )
        .map_err(|e| format!("Barkod eklenirken hata: {}", e))?;

        let bc_id = tx.last_insert_rowid();
        barcodes.push(BarcodeDto {
            id: bc_id,
            product_id,
            barcode: bc,
            is_primary: true,
            created_at: chrono_now_string(),
        });
    }

    tx.commit()
        .map_err(|e| format!("KayÄ±t onaylanamadÄ±: {}", e))?;

    // Return full product
    get_product_by_id(product_id)?
        .ok_or_else(|| "OluÅŸturulan Ã¼rÃ¼n bilgisi okunamadÄ±.".to_string())
}

#[tauri::command]
pub fn update_product(input: UpdateProductInput) -> Result<ProductDto, String> {
    let trimmed_name = input.name.trim();
    if trimmed_name.is_empty() {
        return Err("ÃœrÃ¼n adÄ± boÅŸ bÄ±rakÄ±lamaz.".to_string());
    }

    let trimmed_code = input.code.trim();
    if trimmed_code.is_empty() {
        return Err("ÃœrÃ¼n kodu boÅŸ bÄ±rakÄ±lamaz.".to_string());
    }

    if input.cost_price_kurus < 0 {
        return Err("AlÄ±ÅŸ fiyatÄ± negatif olamaz.".to_string());
    }

    if input.sale_price_kurus < 0 {
        return Err("SatÄ±ÅŸ fiyatÄ± negatif olamaz.".to_string());
    }

    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let result = conn.execute(
        "UPDATE products SET code = ?, name = ?, category_id = ?, unit_name = ?, cost_price_kurus = ?, sale_price_kurus = ?, vat_rate = ?, min_stock_level = ?, track_skt = ?, is_active = ? WHERE id = ?",
        params![
            trimmed_code,
            trimmed_name,
            input.category_id,
            input.unit_name,
            input.cost_price_kurus,
            input.sale_price_kurus,
            input.vat_rate,
            input.min_stock_level,
            input.track_skt,
            input.is_active,
            input.id,
        ],
    );

    match result {
        Ok(rows) if rows > 0 => get_product_by_id(input.id)?
            .ok_or_else(|| "GÃ¼ncellenen Ã¼rÃ¼n okunamadÄ±.".to_string()),
        Ok(_) => Err("GÃ¼ncellenecek Ã¼rÃ¼n bulunamadÄ±.".to_string()),
        Err(rusqlite::Error::SqliteFailure(err, _))
            if err.extended_code == 2067 || err.extended_code == 1555 =>
        {
            Err("Bu Ã¼rÃ¼n kodu/SKU baÅŸka bir Ã¼rÃ¼ne ait.".to_string())
        }
        Err(e) => Err(format!("ÃœrÃ¼n gÃ¼ncellenemedi: {}", e)),
    }
}

#[tauri::command]
pub fn set_product_active(id: i64, is_active: bool) -> Result<bool, String> {
    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let rows = conn
        .execute(
            "UPDATE products SET is_active = ? WHERE id = ?",
            params![is_active, id],
        )
        .map_err(|e| format!("ÃœrÃ¼n durumu gÃ¼ncellenemedi: {}", e))?;

    Ok(rows > 0)
}

#[tauri::command]
pub fn delete_product(id: i64) -> Result<bool, String> {
    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    // Check if product has sales or stock movements
    let sales_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sale_items WHERE product_id = ?",
            params![id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let stock_movements_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM stock_movements WHERE product_id = ?",
            params![id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if sales_count > 0 || stock_movements_count > 0 {
        return Err(
            "Bu Ã¼rÃ¼ne ait satÄ±ÅŸ veya stok hareketleri bulunduÄŸu iÃ§in fiziksel olarak silinemez. Bunun yerine Ã¼rÃ¼nÃ¼ pasife alabilirsiniz."
                .to_string(),
        );
    }

    let rows = conn
        .execute("DELETE FROM products WHERE id = ?", params![id])
        .map_err(|e| format!("ÃœrÃ¼n silinemedi: {}", e))?;

    Ok(rows > 0)
}
// ==================== POS SALES (PHASE 3) ====================

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProcessSaleItemInput {
    pub product_id: i64,
    pub barcode: Option<String>,
    pub quantity: f64,
    pub unit_price_kurus: i64,
    pub discount_amount_kurus: i64,
    pub vat_rate: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProcessSalePaymentInput {
    pub payment_type: String,
    pub amount_kurus: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProcessSaleInput {
    pub items: Vec<ProcessSaleItemInput>,
    pub payments: Vec<ProcessSalePaymentInput>,
    pub customer_id: Option<i64>,
    pub cash_register_id: Option<i64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SaleItemResultDto {
    pub product_id: i64,
    pub product_name: String,
    pub barcode: Option<String>,
    pub quantity: f64,
    pub unit_price_kurus: i64,
    pub discount_amount_kurus: i64,
    pub vat_amount_kurus: i64,
    pub line_total_kurus: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SalePaymentResultDto {
    pub payment_type: String,
    pub amount_kurus: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SaleResultDto {
    pub sale_id: i64,
    pub receipt_no: String,
    pub subtotal_kurus: i64,
    pub discount_amount_kurus: i64,
    pub vat_amount_kurus: i64,
    pub total_amount_kurus: i64,
    pub items: Vec<SaleItemResultDto>,
    pub payments: Vec<SalePaymentResultDto>,
    pub change_amount_kurus: i64,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SaleSummaryDto {
    pub id: i64,
    pub receipt_no: String,
    pub total_amount_kurus: i64,
    pub payment_status: String,
    pub item_count: i64,
    pub created_at: String,
    pub status: String,
    pub refunded_amount_kurus: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PosInitialStateDto {
    pub default_warehouse_id: i64,
    pub default_cash_register_id: i64,
    pub cash_register_name: String,
    pub cashier_name: String,
    pub cashier_id: i64,
}

#[tauri::command]
pub fn process_sale(input: ProcessSaleInput) -> Result<SaleResultDto, String> {
    if input.items.is_empty() {
        return Err("SatÄ±ÅŸta en az bir Ã¼rÃ¼n olmalÄ±dÄ±r.".to_string());
    }

    for item in &input.items {
        if item.quantity <= 0.0 {
            return Err("Miktar 0'dan bÃ¼yÃ¼k olmalÄ±dÄ±r.".to_string());
        }
        if item.unit_price_kurus < 0 {
            return Err("Birim fiyat 0'dan kÃ¼Ã§Ã¼k olamaz.".to_string());
        }
        if item.discount_amount_kurus < 0 {
            return Err("Ä°ndirim tutarÄ± 0'dan kÃ¼Ã§Ã¼k olamaz.".to_string());
        }
    }

    let valid_payment_types = ["NAKIT", "KREDI_KARTI", "CARI_VERESIYE", "QR"];
    for payment in &input.payments {
        if !valid_payment_types.contains(&payment.payment_type.as_str()) {
            return Err(format!("GeÃ§ersiz Ã¶deme tipi: {}", payment.payment_type));
        }
    }

    // PHASE 5: Veresiye satÄ±ÅŸ â†’ mÃ¼ÅŸteri zorunlu
    let has_veresiye = input.payments.iter().any(|p| p.payment_type == "CARI_VERESIYE");
    if has_veresiye && input.customer_id.is_none() {
        return Err("Veresiye satÄ±ÅŸ iÃ§in mÃ¼ÅŸteri seÃ§ilmelidir.".to_string());
    }

    let mut subtotal_kurus = 0;
    let mut discount_amount_kurus = 0;
    let mut vat_amount_kurus = 0;
    let mut grand_total_kurus = 0;

    for item in &input.items {
        let quantity_as_i64 = item.quantity as i64;
        let line_total_before_discount = item.unit_price_kurus * quantity_as_i64;
        let line_total = line_total_before_discount - item.discount_amount_kurus;
        
        let vat_amount = ((line_total as f64 * item.vat_rate) / (100.0 + item.vat_rate)).round() as i64;

        subtotal_kurus += line_total_before_discount;
        discount_amount_kurus += item.discount_amount_kurus;
        vat_amount_kurus += vat_amount;
        grand_total_kurus += line_total;
    }

    let total_payment: i64 = input.payments.iter().map(|p| p.amount_kurus).sum();

    let has_nakit = input.payments.iter().any(|p| p.payment_type == "NAKIT");
    if has_nakit {
        if total_payment < grand_total_kurus {
            return Err("Ã–deme tutarÄ± toplam tutardan az olamaz.".to_string());
        }
    } else {
        if total_payment != grand_total_kurus {
            return Err("Nakit dÄ±ÅŸÄ± Ã¶demelerde Ã¶deme tutarÄ± toplam tutara eÅŸit olmalÄ±dÄ±r.".to_string());
        }
    }

    let db_manager = get_db_manager();
    let mut conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    
    let tx = conn.transaction().map_err(|e| format!("Ä°ÅŸlem baÅŸlatÄ±lamadÄ±: {}", e))?;

    // Check products
    for item in &input.items {
        let is_active: Result<bool, _> = tx.query_row(
            "SELECT is_active FROM products WHERE id = ?",
            params![item.product_id],
            |row| row.get(0),
        );
        match is_active {
            Ok(true) => {},
            Ok(false) => return Err(format!("ÃœrÃ¼n pasif durumda: ID {}", item.product_id)),
            Err(_) => return Err(format!("ÃœrÃ¼n bulunamadÄ±: ID {}", item.product_id)),
        }
    }

    let today: String = tx.query_row(
        "SELECT strftime('%Y%m%d', 'now', 'localtime')",
        [],
        |row| row.get(0),
    ).unwrap_or_else(|_| "20240101".to_string());

    let receipt_pattern = format!("FIS-{}-%", today);
    let count: i64 = tx.query_row(
        "SELECT COUNT(*) FROM sales WHERE receipt_no LIKE ?",
        params![receipt_pattern],
        |row| row.get(0),
    ).unwrap_or(0);
    
    let receipt_no = format!("FIS-{}-{:06}", today, count + 1);
    let sync_id = uuid::Uuid::new_v4().to_string();
    let user_id = 1; // Default admin
    let warehouse_id = 1;
    let cash_register_id = input.cash_register_id.unwrap_or(1);
    let payment_status = "PAID";

    // Insert sale
    tx.execute(
        "INSERT INTO sales (sync_id, receipt_no, customer_id, warehouse_id, cash_register_id, subtotal_kurus, vat_amount_kurus, discount_amount_kurus, total_amount_kurus, payment_status, user_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![sync_id, receipt_no, input.customer_id, warehouse_id, cash_register_id, subtotal_kurus, vat_amount_kurus, discount_amount_kurus, grand_total_kurus, payment_status, user_id],
    ).map_err(|e| format!("SatÄ±ÅŸ kaydedilemedi: {}", e))?;

    let sale_id = tx.last_insert_rowid();

    let mut result_items = Vec::new();

    // Insert sale items and update stock
    for item in &input.items {
        let (product_name, cost_price_kurus): (String, i64) = tx.query_row(
            "SELECT name, cost_price_kurus FROM products WHERE id = ?",
            params![item.product_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        ).map_err(|e| format!("ÃœrÃ¼n bilgisi alÄ±namadÄ±: {}", e))?;

        let quantity_as_i64 = item.quantity as i64;
        let line_total = (item.unit_price_kurus * quantity_as_i64) - item.discount_amount_kurus;
        let vat_amount = ((line_total as f64 * item.vat_rate) / (100.0 + item.vat_rate)).round() as i64;

        tx.execute(
            "INSERT INTO sale_items (sale_id, product_id, barcode, product_name, unit_price_kurus, cost_price_kurus, quantity, vat_rate, vat_amount_kurus, discount_amount_kurus, line_total_kurus)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![sale_id, item.product_id, item.barcode, product_name, item.unit_price_kurus, cost_price_kurus, item.quantity, item.vat_rate, vat_amount, item.discount_amount_kurus, line_total],
        ).map_err(|e| format!("SatÄ±ÅŸ kalemi kaydedilemedi: {}", e))?;

        tx.execute(
            "INSERT INTO stock (product_id, warehouse_id, quantity) 
             VALUES (?, ?, ?) 
             ON CONFLICT(product_id, warehouse_id) DO UPDATE SET quantity = quantity + excluded.quantity",
            params![item.product_id, warehouse_id, -item.quantity],
        ).map_err(|e| format!("Stok gÃ¼ncellenemedi: {}", e))?;

        tx.execute(
            "INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, reference_id, reference_type)
             VALUES (?, ?, 'SATIS', ?, ?, 'SALE')",
            params![item.product_id, warehouse_id, -item.quantity, sale_id],
        ).map_err(|e| format!("Stok hareketi kaydedilemedi: {}", e))?;

        result_items.push(SaleItemResultDto {
            product_id: item.product_id,
            product_name,
            barcode: item.barcode.clone(),
            quantity: item.quantity,
            unit_price_kurus: item.unit_price_kurus,
            discount_amount_kurus: item.discount_amount_kurus,
            vat_amount_kurus: vat_amount,
            line_total_kurus: line_total,
        });
    }

    let mut result_payments = Vec::new();
    let mut nakit_amount = 0;

    for payment in &input.payments {
        tx.execute(
            "INSERT INTO sale_payments (sale_id, payment_type, amount_kurus) VALUES (?, ?, ?)",
            params![sale_id, payment.payment_type, payment.amount_kurus],
        ).map_err(|e| format!("Ã–deme kaydedilemedi: {}", e))?;

        if payment.payment_type == "NAKIT" {
            nakit_amount += payment.amount_kurus;
        }

        result_payments.push(SalePaymentResultDto {
            payment_type: payment.payment_type.clone(),
            amount_kurus: payment.amount_kurus,
        });
    }

    let mut change_amount_kurus = 0;
    if total_payment > grand_total_kurus {
        change_amount_kurus = total_payment - grand_total_kurus;
        nakit_amount -= change_amount_kurus;
    }

    if nakit_amount > 0 {
        tx.execute(
            "UPDATE cash_registers SET current_balance_kurus = current_balance_kurus + ? WHERE id = ?",
            params![nakit_amount, cash_register_id],
        ).map_err(|e| format!("Kasa bakiyesi gÃ¼ncellenemedi: {}", e))?;

        tx.execute(
            "INSERT INTO cash_movements (cash_register_id, movement_type, amount_kurus, sale_id, user_id)
             VALUES (?, 'SATIS_TAHSILAT', ?, ?, ?)",
            params![cash_register_id, nakit_amount, sale_id, user_id],
        ).map_err(|e| format!("Kasa hareketi kaydedilemedi: {}", e))?;
    }

    // PHASE 5: Veresiye satÄ±ÅŸ â†’ mÃ¼ÅŸteri bakiyesini gÃ¼ncelle
    if has_veresiye {
        let veresiye_amount: i64 = input.payments.iter()
            .filter(|p| p.payment_type == "CARI_VERESIYE")
            .map(|p| p.amount_kurus)
            .sum();
        if veresiye_amount > 0 {
            if let Some(cid) = input.customer_id {
                tx.execute(
                    "UPDATE customers SET balance_kurus = balance_kurus + ? WHERE id = ?",
                    params![veresiye_amount, cid],
                ).map_err(|e| format!("MÃ¼ÅŸteri bakiyesi gÃ¼ncellenemedi: {}", e))?;
            }
        }
    }

    let created_at: String = tx.query_row(
        "SELECT REPLACE(created_at, ' ', 'T') || 'Z' FROM sales WHERE id = ?",
        params![sale_id],
        |row| row.get(0),
    ).unwrap_or_default();

    tx.commit().map_err(|e| format!("Ä°ÅŸlem tamamlanamadÄ±: {}", e))?;

    Ok(SaleResultDto {
        sale_id,
        receipt_no,
        subtotal_kurus,
        discount_amount_kurus,
        vat_amount_kurus,
        total_amount_kurus: grand_total_kurus,
        items: result_items,
        payments: result_payments,
        change_amount_kurus,
        created_at,
    })
}

#[tauri::command]
pub fn get_recent_sales(limit: Option<i64>) -> Result<Vec<SaleSummaryDto>, String> {
    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;
    let limit = limit.unwrap_or(20);

    let mut stmt = conn.prepare(
        "SELECT s.id, s.receipt_no, s.total_amount_kurus, s.payment_status, REPLACE(s.created_at, ' ', 'T') || 'Z' as created_at, COUNT(si.id) as item_count, s.status, COALESCE(s.refunded_amount_kurus, 0)
         FROM sales s
         LEFT JOIN sale_items si ON s.id = si.sale_id
         GROUP BY s.id
         ORDER BY s.created_at DESC
         LIMIT ?"
    ).map_err(|e| format!("Sorgu hazÄ±rlanamadÄ±: {}", e))?;

    let iter = stmt.query_map(params![limit], |row| {
        Ok(SaleSummaryDto {
            id: row.get(0)?,
            receipt_no: row.get(1)?,
            total_amount_kurus: row.get(2)?,
            payment_status: row.get(3)?,
            created_at: row.get(4)?,
            item_count: row.get(5)?,
            status: row.get(6)?,
            refunded_amount_kurus: row.get(7)?,
        })
    }).map_err(|e| format!("Satışlar okunamadı: {}", e))?;

    let mut sales = Vec::new();
    for sale in iter {
        if let Ok(s) = sale {
            sales.push(s);
        }
    }

    Ok(sales)
}

#[tauri::command]
pub fn get_sales_history(days: i32) -> Result<Vec<SaleSummaryDto>, String> {
    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT s.id, s.receipt_no, s.total_amount_kurus, s.payment_status, REPLACE(s.created_at, ' ', 'T') || 'Z' as created_at, COUNT(si.id) as item_count, s.status, COALESCE(s.refunded_amount_kurus, 0)
         FROM sales s
         LEFT JOIN sale_items si ON s.id = si.sale_id
         WHERE datetime(s.created_at, 'localtime') >= datetime('now', 'localtime', ?)
         GROUP BY s.id
         ORDER BY s.created_at DESC"
    ).map_err(|e| format!("Sorgu hazırlanamadı: {}", e))?;

    let days_modifier = format!("-{} days", days);
    
    let iter = stmt.query_map(params![days_modifier], |row| {
        Ok(SaleSummaryDto {
            id: row.get(0)?,
            receipt_no: row.get(1)?,
            total_amount_kurus: row.get(2)?,
            payment_status: row.get(3)?,
            created_at: row.get(4)?,
            item_count: row.get(5)?,
            status: row.get(6)?,
            refunded_amount_kurus: row.get(7)?,
        })
    }).map_err(|e| format!("Satışlar okunamadı: {}", e))?;

    let mut sales = Vec::new();
    for sale in iter {
        if let Ok(s) = sale {
            sales.push(s);
        }
    }

    Ok(sales)
}

#[tauri::command]
pub fn get_pos_initial_state() -> Result<PosInitialStateDto, String> {
    let db_manager = get_db_manager();
    let conn = db_manager.get_connection().map_err(|e| e.to_string())?;

    let default_warehouse_id = 1;
    let default_cash_register_id = 1;
    
    let cash_register_name: String = conn.query_row(
        "SELECT name FROM cash_registers WHERE id = ?",
        params![default_cash_register_id],
        |row| row.get(0),
    ).unwrap_or_else(|_| "Ana Kasa".to_string());

    let (cashier_id, cashier_name) = conn.query_row(
        "SELECT id, full_name FROM users WHERE id = 1",
        [],
        |row| Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?)),
    ).unwrap_or((1, "YÃ¶netici (Admin)".to_string()));

    Ok(PosInitialStateDto {
        default_warehouse_id,
        default_cash_register_id,
        cash_register_name,
        cashier_name,
        cashier_id,
    })
}

// --- PHASE 4: KASA YÃ–NETÄ°MÄ° VE RAPORLAR ---

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CashSessionDto {
    pub id: i64,
    pub cash_register_id: i64,
    pub user_id: i64,
    pub opening_balance_kurus: i64,
    pub closing_balance_kurus: Option<i64>,
    pub expected_balance_kurus: Option<i64>,
    pub status: String,
    pub opened_at: String,
    pub closed_at: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CashMovementDto {
    pub id: i64,
    pub movement_type: String,
    pub amount_kurus: i64,
    pub note: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DailySalesSummaryDto {
    pub total_sales_kurus: i64,
    pub sale_count: i64,
    pub total_items_sold: i64,
    pub total_discount_kurus: i64,
    pub total_vat_kurus: i64,
    pub cash_total_kurus: i64,
    pub credit_card_total_kurus: i64,
    pub qr_total_kurus: i64,
    pub veresiye_total_kurus: i64,
}

#[tauri::command]
pub fn open_cash_register(cash_register_id: i64, opening_balance_kurus: i64) -> Result<i64, String> {
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    // Check if already open
    let existing: Result<i64, _> = tx.query_row(
        "SELECT id FROM cash_sessions WHERE cash_register_id = ? AND status = 'OPEN'",
        params![cash_register_id],
        |row| row.get(0),
    );
    if existing.is_ok() {
        return Err("Bu kasa zaten aÃ§Ä±k.".to_string());
    }

    tx.execute(
        "INSERT INTO cash_sessions (cash_register_id, user_id, opening_balance_kurus, status) VALUES (?, 1, ?, 'OPEN')",
        params![cash_register_id, opening_balance_kurus],
    ).map_err(|e| e.to_string())?;
    
    let session_id = tx.last_insert_rowid();

    tx.execute(
        "UPDATE cash_registers SET current_balance_kurus = ?, is_open = 1, opened_at = CURRENT_TIMESTAMP WHERE id = ?",
        params![opening_balance_kurus, cash_register_id],
    ).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(session_id)
}

#[tauri::command]
pub fn get_active_cash_session(cash_register_id: i64) -> Result<Option<CashSessionDto>, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let result = conn.query_row(
        "SELECT id, cash_register_id, user_id, opening_balance_kurus, closing_balance_kurus, expected_balance_kurus, status, opened_at, closed_at 
         FROM cash_sessions WHERE cash_register_id = ? AND status = 'OPEN'",
        params![cash_register_id],
        |row| Ok(CashSessionDto {
            id: row.get(0)?,
            cash_register_id: row.get(1)?,
            user_id: row.get(2)?,
            opening_balance_kurus: row.get(3)?,
            closing_balance_kurus: row.get(4)?,
            expected_balance_kurus: row.get(5)?,
            status: row.get(6)?,
            opened_at: row.get(7)?,
            closed_at: row.get(8)?,
        }),
    ).optional().map_err(|e| e.to_string())?;
    Ok(result)
}

#[tauri::command]
pub fn add_cash_movement(cash_register_id: i64, movement_type: String, amount_kurus: i64, note: Option<String>) -> Result<(), String> {
    if amount_kurus <= 0 {
        return Err("Tutar sÄ±fÄ±rdan bÃ¼yÃ¼k olmalÄ±dÄ±r.".to_string());
    }
    
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    let is_open: bool = tx.query_row(
        "SELECT is_open FROM cash_registers WHERE id = ?",
        params![cash_register_id],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !is_open {
        return Err("KapalÄ± kasaya hareket eklenemez.".to_string());
    }

    let multiplier = if movement_type == "NAKIT_GIRIS" || movement_type == "SATIS_TAHSILAT" || movement_type == "VERESIYE_TAHSILAT" { 1 } else { -1 };
    let net_amount = amount_kurus * multiplier;

    tx.execute(
        "INSERT INTO cash_movements (cash_register_id, movement_type, amount_kurus, note, user_id) VALUES (?, ?, ?, ?, 1)",
        params![cash_register_id, movement_type, net_amount, note],
    ).map_err(|e| e.to_string())?;

    tx.execute(
        "UPDATE cash_registers SET current_balance_kurus = current_balance_kurus + ? WHERE id = ?",
        params![net_amount, cash_register_id],
    ).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn close_cash_register(session_id: i64, expected_balance_kurus: i64, actual_balance_kurus: i64) -> Result<(), String> {
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let cash_register_id: i64 = tx.query_row(
        "SELECT cash_register_id FROM cash_sessions WHERE id = ?",
        params![session_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    tx.execute(
        "UPDATE cash_sessions SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP, expected_balance_kurus = ?, closing_balance_kurus = ? WHERE id = ?",
        params![expected_balance_kurus, actual_balance_kurus, session_id],
    ).map_err(|e| e.to_string())?;

    tx.execute(
        "UPDATE cash_registers SET is_open = 0, closed_at = CURRENT_TIMESTAMP, current_balance_kurus = ? WHERE id = ?",
        params![actual_balance_kurus, cash_register_id],
    ).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_cash_movements(cash_register_id: i64) -> Result<Vec<CashMovementDto>, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    // Get movements since the session opened, or just today if closed
    let mut stmt = conn.prepare(
        "SELECT id, movement_type, amount_kurus, note, REPLACE(created_at, ' ', 'T') || 'Z' as created_at 
         FROM cash_movements 
         WHERE cash_register_id = ? AND date(created_at, 'localtime') = date('now', 'localtime')
         ORDER BY id DESC"
    ).map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map(params![cash_register_id], |row| {
        Ok(CashMovementDto {
            id: row.get(0)?,
            movement_type: row.get(1)?,
            amount_kurus: row.get(2)?,
            note: row.get(3)?,
            created_at: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut results = Vec::new();
    for r in rows {
        if let Ok(m) = r { results.push(m); }
    }
    Ok(results)
}

#[tauri::command]
pub fn get_daily_sales_summary(start_date: String, end_date: String) -> Result<DailySalesSummaryDto, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let sale_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sales WHERE status != 'CANCELLED' AND datetime(created_at, 'localtime') >= ? AND datetime(created_at, 'localtime') <= ?",
        params![start_date, end_date],
        |row| row.get(0),
    ).unwrap_or(0);

    let mut stmt = conn.prepare(
        "SELECT 
            COALESCE(SUM(total_amount_kurus), 0) as gross_sales,
            COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN total_amount_kurus ELSE 0 END), 0) as cancelled_amount,
            COALESCE(SUM(refunded_amount_kurus), 0) as refunded_amount,
            COALESCE(SUM(discount_amount_kurus), 0) as total_discount,
            COALESCE(SUM(vat_amount_kurus), 0) as total_vat
         FROM sales WHERE datetime(created_at, 'localtime') >= ? AND datetime(created_at, 'localtime') <= ?"
    ).map_err(|e| e.to_string())?;
    
    let (gross_sales_kurus, cancelled_amount_kurus, refunded_amount_kurus, total_discount_kurus, total_vat_kurus) = stmt.query_row(params![start_date, end_date], |row| {
        Ok((
            row.get::<_, i64>(0)?,
            row.get::<_, i64>(1)?,
            row.get::<_, i64>(2)?,
            row.get::<_, i64>(3)?,
            row.get::<_, i64>(4)?
        ))
    }).unwrap_or((0, 0, 0, 0, 0));

    let net_sales_kurus = gross_sales_kurus - cancelled_amount_kurus - refunded_amount_kurus;

    let total_items_sold: f64 = conn.query_row(
        "SELECT COALESCE(SUM(sale_items.quantity), 0) FROM sale_items 
         JOIN sales ON sales.id = sale_items.sale_id
         WHERE sales.status != 'CANCELLED' AND datetime(sales.created_at, 'localtime') >= ? AND datetime(sales.created_at, 'localtime') <= ?",
        params![start_date, end_date],
        |row| row.get(0),
    ).unwrap_or(0.0);

    let mut stmt_pay = conn.prepare(
        "SELECT payment_type, COALESCE(SUM(amount_kurus), 0) FROM sale_payments 
         JOIN sales ON sales.id = sale_payments.sale_id
         WHERE sales.status != 'CANCELLED' AND datetime(sales.created_at, 'localtime') >= ? AND datetime(sales.created_at, 'localtime') <= ?
         GROUP BY payment_type"
    ).map_err(|e| e.to_string())?;
    
    let rows = stmt_pay.query_map(params![start_date, end_date], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
    }).unwrap();

    let mut cash_total_kurus = 0;
    let mut credit_card_total_kurus = 0;
    let mut qr_total_kurus = 0;
    let mut veresiye_total_kurus = 0;

    for r in rows {
        if let Ok((ptype, amt)) = r {
            match ptype.as_str() {
                "NAKIT" => cash_total_kurus += amt,
                "KREDI_KARTI" => credit_card_total_kurus += amt,
                "QR" => qr_total_kurus += amt,
                "CARI_VERESIYE" => veresiye_total_kurus += amt,
                _ => {}
            }
        }
    }

    Ok(DailySalesSummaryDto {
        total_sales_kurus: net_sales_kurus,
        sale_count,
        total_items_sold: total_items_sold as i64,
        total_discount_kurus,
        total_vat_kurus,
        cash_total_kurus,
        credit_card_total_kurus,
        qr_total_kurus,
        veresiye_total_kurus,
    })
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DailyRevenueDto {
    pub date: String,
    pub gross_sales_kurus: i64,
    pub cancelled_amount_kurus: i64,
    pub refunded_amount_kurus: i64,
    pub net_revenue_kurus: i64,
    pub cash_revenue_kurus: i64,
    pub card_revenue_kurus: i64,
    pub credit_revenue_kurus: i64,
    pub debt_collection_kurus: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MonthlyRevenueReportDto {
    pub year: i32,
    pub month: i32,
    pub total_net_revenue_kurus: i64,
    pub total_cash_revenue_kurus: i64,
    pub total_card_revenue_kurus: i64,
    pub total_credit_revenue_kurus: i64,
    pub total_debt_collection_kurus: i64,
    pub total_cancelled_amount_kurus: i64,
    pub total_refunded_amount_kurus: i64,
    pub days: Vec<DailyRevenueDto>,
}

#[tauri::command]
pub fn get_monthly_revenue_report(year: i32, month: i32) -> Result<MonthlyRevenueReportDto, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    let start_date = format!("{:04}-{:02}-01 00:00:00", year, month);
    let end_date = if month == 12 {
        format!("{:04}-01-01 00:00:00", year + 1)
    } else {
        format!("{:04}-{:02}-01 00:00:00", year, month + 1)
    };

    let mut stmt = conn.prepare("
        WITH RECURSIVE dates(date) AS (
            SELECT date(?)
            UNION ALL
            SELECT date(date, '+1 day')
            FROM dates
            WHERE date < date(?, '-1 day')
        ),
        sales_agg AS (
            SELECT 
                date(created_at, 'localtime') as sale_date,
                COALESCE(SUM(total_amount_kurus), 0) as gross,
                COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN total_amount_kurus ELSE 0 END), 0) as cancelled,
                COALESCE(SUM(refunded_amount_kurus), 0) as refunded
            FROM sales
            WHERE datetime(created_at, 'localtime') >= ? AND datetime(created_at, 'localtime') < ?
            GROUP BY date(created_at, 'localtime')
        ),
        payments_agg AS (
            SELECT 
                date(s.created_at, 'localtime') as p_date,
                COALESCE(SUM(CASE WHEN sp.payment_type = 'NAKIT' THEN sp.amount_kurus ELSE 0 END), 0) as cash,
                COALESCE(SUM(CASE WHEN sp.payment_type = 'KREDI_KARTI' THEN sp.amount_kurus ELSE 0 END), 0) as card,
                COALESCE(SUM(CASE WHEN sp.payment_type = 'CARI_VERESIYE' THEN sp.amount_kurus ELSE 0 END), 0) as credit
            FROM sale_payments sp
            JOIN sales s ON s.id = sp.sale_id
            WHERE s.status != 'CANCELLED' AND datetime(s.created_at, 'localtime') >= ? AND datetime(s.created_at, 'localtime') < ?
            GROUP BY date(s.created_at, 'localtime')
        ),
        debt_agg AS (
            SELECT 
                date(created_at, 'localtime') as d_date,
                COALESCE(SUM(amount_kurus), 0) as collected
            FROM customer_payments
            WHERE datetime(created_at, 'localtime') >= ? AND datetime(created_at, 'localtime') < ?
            GROUP BY date(created_at, 'localtime')
        )
        SELECT 
            d.date,
            COALESCE(s.gross, 0),
            COALESCE(s.cancelled, 0),
            COALESCE(s.refunded, 0),
            COALESCE(p.cash, 0),
            COALESCE(p.card, 0),
            COALESCE(p.credit, 0),
            COALESCE(da.collected, 0)
        FROM dates d
        LEFT JOIN sales_agg s ON d.date = s.sale_date
        LEFT JOIN payments_agg p ON d.date = p.p_date
        LEFT JOIN debt_agg da ON d.date = da.d_date
        ORDER BY d.date ASC
    ").map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![start_date, end_date, start_date, end_date, start_date, end_date, start_date, end_date], |row| {
        let date: String = row.get(0)?;
        let gross: i64 = row.get(1)?;
        let cancelled: i64 = row.get(2)?;
        let refunded: i64 = row.get(3)?;
        let cash: i64 = row.get(4)?;
        let card: i64 = row.get(5)?;
        let credit: i64 = row.get(6)?;
        let collected: i64 = row.get(7)?;
        
        let net = gross - cancelled - refunded;

        Ok(DailyRevenueDto {
            date,
            gross_sales_kurus: gross,
            cancelled_amount_kurus: cancelled,
            refunded_amount_kurus: refunded,
            net_revenue_kurus: net,
            cash_revenue_kurus: cash,
            card_revenue_kurus: card,
            credit_revenue_kurus: credit,
            debt_collection_kurus: collected,
        })
    }).map_err(|e| e.to_string())?;

    let mut report = MonthlyRevenueReportDto {
        year, month,
        total_net_revenue_kurus: 0,
        total_cash_revenue_kurus: 0,
        total_card_revenue_kurus: 0,
        total_credit_revenue_kurus: 0,
        total_debt_collection_kurus: 0,
        total_cancelled_amount_kurus: 0,
        total_refunded_amount_kurus: 0,
        days: vec![]
    };

    for r in rows {
        if let Ok(day) = r {
            report.total_net_revenue_kurus += day.net_revenue_kurus;
            report.total_cash_revenue_kurus += day.cash_revenue_kurus;
            report.total_card_revenue_kurus += day.card_revenue_kurus;
            report.total_credit_revenue_kurus += day.credit_revenue_kurus;
            report.total_debt_collection_kurus += day.debt_collection_kurus;
            report.total_cancelled_amount_kurus += day.cancelled_amount_kurus;
            report.total_refunded_amount_kurus += day.refunded_amount_kurus;
            report.days.push(day);
        }
    }

    Ok(report)
}

// --- PHASE 5: MÃœÅTERÄ° / VERESÄ°YE ---

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CustomerDto {
    pub id: i64,
    pub name: String,
    pub phone: Option<String>,
    pub balance_kurus: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CustomerHistoryDto {
    pub date: String,
    pub description: String,
    pub amount_kurus: i64,
}

#[tauri::command]
pub fn create_customer(name: String, phone: Option<String>) -> Result<i64, String> {
    if name.trim().is_empty() {
        return Err("MÃ¼ÅŸteri adÄ± boÅŸ olamaz.".to_string());
    }
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO customers (name, phone, balance_kurus, is_active) VALUES (?, ?, 0, 1)",
        params![name.trim(), phone],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn update_customer(id: i64, name: String, phone: Option<String>) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("MÃ¼ÅŸteri adÄ± boÅŸ olamaz.".to_string());
    }
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE customers SET name = ?, phone = ? WHERE id = ?",
        params![name.trim(), phone, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_customers(search: Option<String>) -> Result<Vec<CustomerDto>, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let query = match &search {
        Some(s) if !s.trim().is_empty() => {
            format!("SELECT id, name, phone, balance_kurus FROM customers WHERE is_active = 1 AND (name LIKE '%{}%' OR phone LIKE '%{}%') ORDER BY name", s.replace("'", ""), s.replace("'", ""))
        }
        _ => "SELECT id, name, phone, balance_kurus FROM customers WHERE is_active = 1 ORDER BY name".to_string(),
    };
    
    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(CustomerDto {
            id: row.get(0)?,
            name: row.get(1)?,
            phone: row.get(2)?,
            balance_kurus: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut results = Vec::new();
    for r in rows {
        if let Ok(c) = r { results.push(c); }
    }
    Ok(results)
}

#[tauri::command]
pub fn get_customer_history(customer_id: i64) -> Result<Vec<CustomerHistoryDto>, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    // Veresiye satÄ±ÅŸlar
    let mut stmt = conn.prepare(
        "SELECT REPLACE(s.created_at, ' ', 'T') || 'Z', 'Veresiye SatÄ±ÅŸ - ' || s.receipt_no, sp.amount_kurus
         FROM sale_payments sp
         JOIN sales s ON s.id = sp.sale_id
         WHERE s.customer_id = ? AND sp.payment_type = 'CARI_VERESIYE'
         ORDER BY s.created_at DESC"
    ).map_err(|e| e.to_string())?;
    
    let sale_rows = stmt.query_map(params![customer_id], |row| {
        Ok(CustomerHistoryDto {
            date: row.get(0)?,
            description: row.get(1)?,
            amount_kurus: row.get(2)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut results: Vec<CustomerHistoryDto> = Vec::new();
    for r in sale_rows {
        if let Ok(h) = r { results.push(h); }
    }
    
    // Tahsilat hareketleri (negatif = borÃ§ azalmasÄ±)
    let mut stmt2 = conn.prepare(
        "SELECT REPLACE(cm.created_at, ' ', 'T') || 'Z', 'Tahsilat', cm.amount_kurus
         FROM cash_movements cm
         WHERE cm.customer_id = ? AND cm.movement_type = 'VERESIYE_TAHSILAT'
         ORDER BY cm.created_at DESC"
    ).map_err(|e| e.to_string())?;
    
    let pay_rows = stmt2.query_map(params![customer_id], |row| {
        Ok(CustomerHistoryDto {
            date: row.get(0)?,
            description: row.get(1)?,
            amount_kurus: {
                let amt: i64 = row.get(2)?;
                -amt // Tahsilat borcu azaltÄ±r
            },
        })
    }).map_err(|e| e.to_string())?;
    
    for r in pay_rows {
        if let Ok(h) = r { results.push(h); }
    }
    
    // Tarihe gÃ¶re sÄ±rala
    results.sort_by(|a, b| b.date.cmp(&a.date));
    Ok(results)
}

#[tauri::command]
pub fn receive_customer_payment(customer_id: i64, amount_kurus: i64, cash_register_id: i64) -> Result<(), String> {
    if amount_kurus <= 0 {
        return Err("Tahsilat tutarÄ± sÄ±fÄ±rdan bÃ¼yÃ¼k olmalÄ±dÄ±r.".to_string());
    }
    
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    let is_open: bool = tx.query_row(
        "SELECT is_open FROM cash_registers WHERE id = ?",
        params![cash_register_id],
        |row| row.get(0),
    ).unwrap_or(false);
    
    if !is_open {
        return Err("Kasa kapalÄ±. Tahsilat yapÄ±lamaz.".to_string());
    }
    
    // MÃ¼ÅŸteri bakiyesini dÃ¼ÅŸ
    tx.execute(
        "UPDATE customers SET balance_kurus = balance_kurus - ? WHERE id = ?",
        params![amount_kurus, customer_id],
    ).map_err(|e| e.to_string())?;
    
    // Kasa bakiyesini artÄ±r
    tx.execute(
        "UPDATE cash_registers SET current_balance_kurus = current_balance_kurus + ? WHERE id = ?",
        params![amount_kurus, cash_register_id],
    ).map_err(|e| e.to_string())?;
    
    // Kasa hareketi oluÅŸtur
    tx.execute(
        "INSERT INTO cash_movements (cash_register_id, movement_type, amount_kurus, customer_id, user_id) VALUES (?, 'VERESIYE_TAHSILAT', ?, ?, 1)",
        params![cash_register_id, amount_kurus, customer_id],
    ).map_err(|e| e.to_string())?;
    
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

// --- PHASE 6: STOK VE ENVANTER YÃ–NETÄ°MÄ° ---

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InventoryItemDto {
    pub product_id: i64,
    pub product_code: String,
    pub product_name: String,
    pub primary_barcode: Option<String>,
    pub category_name: Option<String>,
    pub unit_name: String,
    pub cost_price_kurus: i64,
    pub sale_price_kurus: i64,
    pub current_stock: f64,
    pub min_stock_level: f64,
    pub status: String, // "NORMAL" | "CRITICAL" | "OUT_OF_STOCK"
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StockMovementDto {
    pub id: i64,
    pub product_id: i64,
    pub product_name: String,
    pub barcode: Option<String>,
    pub movement_type: String,
    pub quantity: f64,
    pub unit_price_kurus: i64,
    pub note: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StockAdjustmentInput {
    pub product_id: i64,
    pub adjustment_type: String, // "GIRIS", "CIKIS", "SAYIM", "FIRE"
    pub quantity: f64,
    pub note: Option<String>,
}

#[tauri::command]
pub fn get_inventory_list(filter: Option<String>, search: Option<String>) -> Result<Vec<InventoryItemDto>, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    let mut query = String::from(
        "SELECT p.id, p.code, p.name,
                (SELECT pb.barcode FROM product_barcodes pb WHERE pb.product_id = p.id AND pb.is_primary = 1 LIMIT 1) as primary_barcode,
                c.name as category_name,
                p.unit_name, p.cost_price_kurus, p.sale_price_kurus,
                COALESCE(s.quantity, 0.0) as current_stock,
                p.min_stock_level
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN stock s ON s.product_id = p.id AND s.warehouse_id = 1
         WHERE p.is_active = 1"
    );

    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(ref s) = search {
        let trimmed = s.trim();
        if !trimmed.is_empty() {
            let pattern = format!("%{}%", trimmed);
            query.push_str(" AND (p.name LIKE ? OR p.code LIKE ? OR p.id IN (SELECT product_id FROM product_barcodes WHERE barcode LIKE ?))");
            params_vec.push(Box::new(pattern.clone()));
            params_vec.push(Box::new(pattern.clone()));
            params_vec.push(Box::new(pattern));
        }
    }

    query.push_str(" ORDER BY p.name ASC");

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let borrowed: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();

    let rows = stmt.query_map(borrowed.as_slice(), |row| {
        let current_stock: f64 = row.get(8)?;
        let min_stock_level: f64 = row.get(9)?;

        let status = if current_stock <= 0.0 {
            "OUT_OF_STOCK".to_string()
        } else if current_stock <= min_stock_level {
            "CRITICAL".to_string()
        } else {
            "NORMAL".to_string()
        };

        Ok(InventoryItemDto {
            product_id: row.get(0)?,
            product_code: row.get(1)?,
            product_name: row.get(2)?,
            primary_barcode: row.get(3)?,
            category_name: row.get(4)?,
            unit_name: row.get(5)?,
            cost_price_kurus: row.get(6)?,
            sale_price_kurus: row.get(7)?,
            current_stock,
            min_stock_level,
            status,
        })
    }).map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    let filter_mode = filter.unwrap_or_else(|| "ALL".to_string());

    for r in rows {
        if let Ok(item) = r {
            match filter_mode.as_str() {
                "CRITICAL" => {
                    if item.status == "CRITICAL" {
                        items.push(item);
                    }
                }
                "OUT_OF_STOCK" => {
                    if item.status == "OUT_OF_STOCK" {
                        items.push(item);
                    }
                }
                _ => items.push(item),
            }
        }
    }

    Ok(items)
}

#[tauri::command]
pub fn add_stock_adjustment(input: StockAdjustmentInput) -> Result<(), String> {
    if input.quantity < 0.0 {
        return Err("Miktar negatif olamaz.".to_string());
    }

    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let current_stock: f64 = tx.query_row(
        "SELECT COALESCE(quantity, 0.0) FROM stock WHERE product_id = ? AND warehouse_id = 1",
        params![input.product_id],
        |row| row.get(0),
    ).unwrap_or(0.0);

    let (delta_qty, movement_type, note_prefix) = match input.adjustment_type.as_str() {
        "GIRIS" => (input.quantity, "SAYIM_FAZLASI", "Stok GiriÅŸi"),
        "CIKIS" => (-input.quantity, "SAYIM_EKSIGI", "Stok Ã‡Ä±kÄ±ÅŸÄ±"),
        "FIRE" => (-input.quantity, "FIRE", "Fire/Zayi"),
        "SAYIM" => {
            let delta = input.quantity - current_stock;
            let mtype = if delta >= 0.0 { "SAYIM_FAZLASI" } else { "SAYIM_EKSIGI" };
            (delta, mtype, "SayÄ±m DÃ¼zeltme")
        }
        _ => return Err("GeÃ§ersiz stok iÅŸlem tÃ¼rÃ¼.".to_string()),
    };

    let new_stock = match input.adjustment_type.as_str() {
        "SAYIM" => input.quantity,
        _ => current_stock + delta_qty,
    };

    // Update or Insert stock
    tx.execute(
        "INSERT INTO stock (product_id, warehouse_id, quantity)
         VALUES (?, 1, ?)
         ON CONFLICT(product_id, warehouse_id) DO UPDATE SET quantity = ?",
        params![input.product_id, new_stock, new_stock],
    ).map_err(|e| format!("Stok gÃ¼ncellenemedi: {}", e))?;

    let note_text = match input.note {
        Some(n) if !n.trim().is_empty() => format!("{} - {}", note_prefix, n.trim()),
        _ => note_prefix.to_string(),
    };

    // Insert movement record
    tx.execute(
        "INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, note, user_id)
         VALUES (?, 1, ?, ?, ?, 1)",
        params![input.product_id, movement_type, delta_qty, note_text],
    ).map_err(|e| format!("Stok hareketi kaydedilemedi: {}", e))?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_stock_movements(product_id: Option<i64>, limit: Option<i64>) -> Result<Vec<StockMovementDto>, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    let limit_val = limit.unwrap_or(50);

    let query = match product_id {
        Some(_) => "SELECT sm.id, sm.product_id, p.name,
                           (SELECT pb.barcode FROM product_barcodes pb WHERE pb.product_id = p.id AND pb.is_primary = 1 LIMIT 1) as barcode,
                           sm.movement_type, sm.quantity, sm.unit_price_kurus, sm.note, REPLACE(sm.created_at, ' ', 'T') || 'Z' as created_at
                    FROM stock_movements sm
                    JOIN products p ON sm.product_id = p.id
                    WHERE sm.product_id = ?
                    ORDER BY sm.id DESC
                    LIMIT ?",
        None => "SELECT sm.id, sm.product_id, p.name,
                        (SELECT pb.barcode FROM product_barcodes pb WHERE pb.product_id = p.id AND pb.is_primary = 1 LIMIT 1) as barcode,
                        sm.movement_type, sm.quantity, sm.unit_price_kurus, sm.note, REPLACE(sm.created_at, ' ', 'T') || 'Z' as created_at
                 FROM stock_movements sm
                 JOIN products p ON sm.product_id = p.id
                 ORDER BY sm.id DESC
                 LIMIT ?",
    };

    let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;

    let mapper = |row: &rusqlite::Row| {
        Ok(StockMovementDto {
            id: row.get(0)?,
            product_id: row.get(1)?,
            product_name: row.get(2)?,
            barcode: row.get(3)?,
            movement_type: row.get(4)?,
            quantity: row.get(5)?,
            unit_price_kurus: row.get(6)?,
            note: row.get(7)?,
            created_at: row.get(8)?,
        })
    };

    let rows = match product_id {
        Some(pid) => stmt.query_map(params![pid, limit_val], mapper),
        None => stmt.query_map(params![limit_val], mapper),
    }.map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for r in rows {
        if let Ok(m) = r { results.push(m); }
    }

    Ok(results)
}

// --- PHASE 7: BASÄ°T ALIÅ VE TEDARÄ°K YÃ–NETÄ°MÄ° ---

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SupplierDto {
    pub id: i64,
    pub name: String,
    pub phone: Option<String>,
    pub note: Option<String>,
    pub balance_kurus: i64,
    pub is_active: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PurchaseItemInput {
    pub product_id: i64,
    pub quantity: f64,
    pub unit_cost_kurus: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProcessPurchaseInput {
    pub supplier_id: Option<i64>,
    pub payment_type: String, // "PESIN" | "VERESIYE"
    pub items: Vec<PurchaseItemInput>,
    pub note: Option<String>,
    pub cash_register_id: Option<i64>,
}

#[tauri::command]
pub fn list_suppliers(search: Option<String>) -> Result<Vec<SupplierDto>, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    let query = match &search {
        Some(s) if !s.trim().is_empty() => {
            format!("SELECT id, name, phone, address as note, balance_kurus, is_active FROM suppliers WHERE is_active = 1 AND (name LIKE '%{}%' OR phone LIKE '%{}%') ORDER BY name", s.replace("'", ""), s.replace("'", ""))
        }
        _ => "SELECT id, name, phone, address as note, balance_kurus, is_active FROM suppliers WHERE is_active = 1 ORDER BY name".to_string(),
    };

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(SupplierDto {
            id: row.get(0)?,
            name: row.get(1)?,
            phone: row.get(2)?,
            note: row.get(3)?,
            balance_kurus: row.get(4)?,
            is_active: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for r in rows {
        if let Ok(s) = r { results.push(s); }
    }
    Ok(results)
}

#[tauri::command]
pub fn create_supplier(name: String, phone: Option<String>, note: Option<String>) -> Result<i64, String> {
    if name.trim().is_empty() {
        return Err("TedarikÃ§i adÄ± boÅŸ olamaz.".to_string());
    }
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO suppliers (name, phone, address, balance_kurus, is_active) VALUES (?, ?, ?, 0, 1)",
        params![name.trim(), phone, note],
    ).map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn update_supplier(id: i64, name: String, phone: Option<String>, note: Option<String>) -> Result<(), String> {
    if name.trim().is_empty() {
        return Err("TedarikÃ§i adÄ± boÅŸ olamaz.".to_string());
    }
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE suppliers SET name = ?, phone = ?, address = ? WHERE id = ?",
        params![name.trim(), phone, note, id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn process_purchase_invoice(input: ProcessPurchaseInput) -> Result<(), String> {
    if input.items.is_empty() {
        return Err("AlÄ±ÅŸ faturasÄ±nda en az bir Ã¼rÃ¼n olmalÄ±dÄ±r.".to_string());
    }

    for item in &input.items {
        if item.quantity <= 0.0 {
            return Err("Miktar sÄ±fÄ±rdan bÃ¼yÃ¼k olmalÄ±dÄ±r.".to_string());
        }
        if item.unit_cost_kurus < 0 {
            return Err("AlÄ±ÅŸ fiyatÄ± negatif olamaz.".to_string());
        }
    }

    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let mut total_purchase_kurus: i64 = 0;

    let supplier_name: String = match input.supplier_id {
        Some(sid) => tx.query_row(
            "SELECT name FROM suppliers WHERE id = ?",
            params![sid],
            |row| row.get(0),
        ).unwrap_or_else(|_| "TedarikÃ§i".to_string()),
        None => "Genel TedarikÃ§i".to_string(),
    };

    for item in &input.items {
        let line_total = (item.unit_cost_kurus as f64 * item.quantity).round() as i64;
        total_purchase_kurus += line_total;

        // 1. Update stock (+quantity)
        tx.execute(
            "INSERT INTO stock (product_id, warehouse_id, quantity)
             VALUES (?, 1, ?)
             ON CONFLICT(product_id, warehouse_id) DO UPDATE SET quantity = quantity + excluded.quantity",
            params![item.product_id, item.quantity],
        ).map_err(|e| format!("Stok gÃ¼ncellenemedi: {}", e))?;

        // 2. Insert stock movement
        tx.execute(
            "INSERT INTO stock_movements (product_id, warehouse_id, movement_type, quantity, unit_price_kurus, reference_type, note, user_id)
             VALUES (?, 1, 'ALIS', ?, ?, 'PURCHASE', ?, 1)",
            params![item.product_id, item.quantity, item.unit_cost_kurus, format!("Mal AlÄ±mÄ± - {}", supplier_name)],
        ).map_err(|e| format!("Stok hareketi kaydedilemedi: {}", e))?;

        // 3. Update product cost price
        tx.execute(
            "UPDATE products SET cost_price_kurus = ? WHERE id = ?",
            params![item.unit_cost_kurus, item.product_id],
        ).map_err(|e| format!("ÃœrÃ¼n alÄ±ÅŸ fiyatÄ± gÃ¼ncellenemedi: {}", e))?;
    }

    // 4. Payment processing
    if input.payment_type == "PESIN" {
        let cash_reg_id = input.cash_register_id.unwrap_or(1);
        let is_open: bool = tx.query_row(
            "SELECT is_open FROM cash_registers WHERE id = ?",
            params![cash_reg_id],
            |row| row.get(0),
        ).unwrap_or(false);

        if !is_open {
            return Err("PeÅŸin mal alÄ±mÄ± iÃ§in kasa aÃ§Ä±k olmalÄ±dÄ±r.".to_string());
        }

        // Deduct from cash register
        tx.execute(
            "UPDATE cash_registers SET current_balance_kurus = current_balance_kurus - ? WHERE id = ?",
            params![total_purchase_kurus, cash_reg_id],
        ).map_err(|e| format!("Kasa bakiyesi gÃ¼ncellenemedi: {}", e))?;

        // Add cash movement
        tx.execute(
            "INSERT INTO cash_movements (cash_register_id, movement_type, amount_kurus, supplier_id, user_id, note)
             VALUES (?, 'TEDARIKCI_ODEME', ?, ?, 1, ?)",
            params![cash_reg_id, -total_purchase_kurus, input.supplier_id, format!("PeÅŸin Mal AlÄ±mÄ± - {}", supplier_name)],
        ).map_err(|e| format!("Kasa hareketi kaydedilemedi: {}", e))?;
    } else if input.payment_type == "VERESIYE" {
        if let Some(sid) = input.supplier_id {
            tx.execute(
                "UPDATE suppliers SET balance_kurus = balance_kurus + ? WHERE id = ?",
                params![total_purchase_kurus, sid],
            ).map_err(|e| format!("TedarikÃ§i bakiyesi gÃ¼ncellenemedi: {}", e))?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn pay_supplier(supplier_id: i64, amount_kurus: i64, cash_register_id: i64, note: Option<String>) -> Result<(), String> {
    if amount_kurus <= 0 {
        return Err("Ã–deme tutarÄ± sÄ±fÄ±rdan bÃ¼yÃ¼k olmalÄ±dÄ±r.".to_string());
    }

    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let is_open: bool = tx.query_row(
        "SELECT is_open FROM cash_registers WHERE id = ?",
        params![cash_register_id],
        |row| row.get(0),
    ).unwrap_or(false);

    if !is_open {
        return Err("Kasa kapalÄ±. TedarikÃ§i Ã¶demesi yapÄ±lamaz.".to_string());
    }

    let supplier_name: String = tx.query_row(
        "SELECT name FROM suppliers WHERE id = ?",
        params![supplier_id],
        |row| row.get(0),
    ).map_err(|_| "TedarikÃ§i bulunamadÄ±.".to_string())?;

    // Reduce supplier debt balance
    tx.execute(
        "UPDATE suppliers SET balance_kurus = balance_kurus - ? WHERE id = ?",
        params![amount_kurus, supplier_id],
    ).map_err(|e| e.to_string())?;

    // Reduce cash register balance
    tx.execute(
        "UPDATE cash_registers SET current_balance_kurus = current_balance_kurus - ? WHERE id = ?",
        params![amount_kurus, cash_register_id],
    ).map_err(|e| e.to_string())?;

    let note_text = note.unwrap_or_else(|| format!("TedarikÃ§i Ã–demesi - {}", supplier_name));

    // Record cash movement
    tx.execute(
        "INSERT INTO cash_movements (cash_register_id, movement_type, amount_kurus, supplier_id, user_id, note)
         VALUES (?, 'TEDARIKCI_ODEME', ?, ?, 1, ?)",
        params![cash_register_id, -amount_kurus, supplier_id, note_text],
    ).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

// --- PHASE 8: AYARLAR VE VERÄ°TABANI YEDEKLEME ---

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppSettingsDto {
    pub business_name: String,
    pub phone: String,
    pub address: String,
    pub receipt_footer: String,
    pub default_vat_rate: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BackupResultDto {
    pub success: bool,
    pub backup_path: String,
    pub size_bytes: u64,
}

#[tauri::command]
pub fn get_app_settings() -> Result<AppSettingsDto, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("SELECT key, value FROM settings").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    }).map_err(|e| e.to_string())?;

    let mut map = std::collections::HashMap::new();
    for r in rows {
        if let Ok((k, v)) = r {
            map.insert(k, v);
        }
    }

    Ok(AppSettingsDto {
        business_name: map.get("business_name").cloned().unwrap_or_else(|| "BÃ¼fe Otomasyonu".to_string()),
        phone: map.get("phone").cloned().unwrap_or_default(),
        address: map.get("address").cloned().unwrap_or_default(),
        receipt_footer: map.get("receipt_footer").cloned().unwrap_or_else(|| "TeÅŸekkÃ¼r Ederiz Yine Bekleriz".to_string()),
        default_vat_rate: map.get("default_vat_rate").and_then(|v| v.parse().ok()).unwrap_or(20.0),
    })
}

#[tauri::command]
pub fn update_app_settings(settings: AppSettingsDto) -> Result<(), String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    let entries = [
        ("business_name", settings.business_name, "Ä°ÅŸletme AdÄ±"),
        ("phone", settings.phone, "Telefon NumarasÄ±"),
        ("address", settings.address, "Ä°ÅŸletme Adresi"),
        ("receipt_footer", settings.receipt_footer, "FiÅŸ Alt MesajÄ±"),
        ("default_vat_rate", settings.default_vat_rate.to_string(), "VarsayÄ±lan KDV OranÄ±"),
    ];

    for (k, v, desc) in entries {
        conn.execute(
            "INSERT INTO settings (key, value, description) VALUES (?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
            params![k, v, desc],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn backup_database(destination_path: Option<String>) -> Result<BackupResultDto, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;

    // Checkpoint WAL to flush all data into main file safely
    let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");

    let source_path = db.get_db_path();
    if !source_path.exists() {
        return Err("VeritabanÄ± dosyasÄ± bulunamadÄ±.".to_string());
    }

    let target_path = match destination_path {
        Some(p) if !p.trim().is_empty() => PathBuf::from(p.trim()),
        _ => {
            let timestamp: String = conn
                .query_row(
                    "SELECT strftime('%Y%m%d_%H%M%S', 'now', 'localtime')",
                    [],
                    |row| row.get(0),
                )
                .unwrap_or_else(|_| "yedek".to_string());
            let backup_dir = dirs::download_dir()
                .or_else(dirs::desktop_dir)
                .unwrap_or_else(|| PathBuf::from("."));
            backup_dir.join(format!("BufePOS_Yedek_{}.db", timestamp))
        }
    };

    if let Some(parent) = target_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    std::fs::copy(&source_path, &target_path)
        .map_err(|e| format!("Yedekleme kopyalanÄ±rken hata: {}", e))?;

    let size = std::fs::metadata(&target_path)
        .map(|m| m.len())
        .unwrap_or(0);

    Ok(BackupResultDto {
        success: true,
        backup_path: target_path.to_string_lossy().to_string(),
        size_bytes: size,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn setup_test_db(test_name: &str) -> (DatabaseManager, PathBuf) {
        let temp_dir = std::env::temp_dir().join(format!("bufepos_cmd_test_{}", test_name));
        let _ = fs::remove_dir_all(&temp_dir);
        let db_manager = DatabaseManager::new(temp_dir.clone());
        let _ = db_manager.run_all_migrations();
        (db_manager, temp_dir)
    }

    #[test]
    fn test_category_crud_and_safety() {
        let (db, temp_dir) = setup_test_db("cat_crud");
        let conn = db.get_connection().unwrap();

        // 1. Create Category
        let res = conn.execute(
            "INSERT INTO categories (name, sort_order, color_code, is_active) VALUES (?, ?, ?, 1)",
            params!["SÄ±cak Ä°Ã§ecekler", 1, "#EF4444"],
        );
        assert!(res.is_ok());
        let cat_id = conn.last_insert_rowid();

        // 2. Attach product to category
        let prod_res = conn.execute(
            "INSERT INTO products (code, name, category_id, unit_name, cost_price_kurus, sale_price_kurus, vat_rate, min_stock_level, is_active, track_skt)
             VALUES (?, ?, ?, 'Adet', 200, 1000, 20.0, 5.0, 1, 0)",
            params!["TST-001", "Demlik Ã‡ay", cat_id],
        );
        assert!(prod_res.is_ok());

        // 3. Count products in category
        let prod_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM products WHERE category_id = ?",
                params![cat_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(prod_count, 1);

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_product_price_and_unique_barcodes() {
        let (db, temp_dir) = setup_test_db("prod_barcode");
        let conn = db.get_connection().unwrap();

        // 1. Create Product 1
        let p1_res = conn.execute(
            "INSERT INTO products (code, name, unit_name, cost_price_kurus, sale_price_kurus, vat_rate, min_stock_level, is_active, track_skt)
             VALUES (?, ?, 'Adet', 500, 1500, 20.0, 5.0, 1, 0)",
            params!["PRD-A", "Su 0.5L"],
        );
        assert!(p1_res.is_ok());
        let p1_id = conn.last_insert_rowid();

        // 2. Add Barcode to Product 1
        let b1_res = conn.execute(
            "INSERT INTO product_barcodes (product_id, barcode, is_primary) VALUES (?, ?, 1)",
            params![p1_id, "869000000001"],
        );
        assert!(b1_res.is_ok());

        // 3. Create Product 2
        let p2_res = conn.execute(
            "INSERT INTO products (code, name, unit_name, cost_price_kurus, sale_price_kurus, vat_rate, min_stock_level, is_active, track_skt)
             VALUES (?, ?, 'Adet', 1000, 2500, 20.0, 5.0, 1, 0)",
            params!["PRD-B", "Maden Suyu"],
        );
        assert!(p2_res.is_ok());
        let p2_id = conn.last_insert_rowid();

        // 4. Try adding duplicate barcode to Product 2 (Must FAIL)
        let dup_res = conn.execute(
            "INSERT INTO product_barcodes (product_id, barcode, is_primary) VALUES (?, ?, 1)",
            params![p2_id, "869000000001"],
        );
        assert!(dup_res.is_err(), "Duplicate barcode on another product must be rejected by UNIQUE constraint");

        let _ = fs::remove_dir_all(&temp_dir);
    }
}

// -------------------------------------------------------------
// Tables Commands (Masalar)
// -------------------------------------------------------------

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TableDto {
    pub id: i64,
    pub name: String,
    pub is_active: bool,
    pub status: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TableOrderDto {
    pub id: i64,
    pub table_id: i64,
    pub product_id: i64,
    pub product_name: String,
    pub quantity: f64,
    pub unit_price_kurus: i64,
}

#[tauri::command]
pub fn list_tables() -> Result<Vec<TableDto>, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare("SELECT id, name, is_active, status FROM tables ORDER BY name ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(TableDto {
            id: row.get(0)?,
            name: row.get(1)?,
            is_active: row.get(2)?,
            status: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut res = vec![];
    for r in rows { res.push(r.map_err(|e| e.to_string())?); }
    Ok(res)
}

#[tauri::command]
pub fn create_table(name: String) -> Result<TableDto, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    conn.execute("INSERT INTO tables (name, is_active, status) VALUES (?, 1, 'EMPTY')", params![name]).map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    Ok(TableDto { id, name, is_active: true, status: "EMPTY".to_string() })
}

#[tauri::command]
pub fn update_table(id: i64, name: String, is_active: bool, status: String) -> Result<bool, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    conn.execute("UPDATE tables SET name=?, is_active=?, status=? WHERE id=?", params![name, is_active, status, id]).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn get_table_orders(table_id: i64) -> Result<Vec<TableOrderDto>, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare("SELECT id, table_id, product_id, product_name, quantity, unit_price_kurus FROM table_orders WHERE table_id = ?").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![table_id], |row| {
        Ok(TableOrderDto {
            id: row.get(0)?,
            table_id: row.get(1)?,
            product_id: row.get(2)?,
            product_name: row.get(3)?,
            quantity: row.get(4)?,
            unit_price_kurus: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;
    
    let mut res = vec![];
    for r in rows { res.push(r.map_err(|e| e.to_string())?); }
    Ok(res)
}

#[tauri::command]
pub fn add_table_order(table_id: i64, product_id: i64, product_name: String, quantity: f64, unit_price_kurus: i64) -> Result<(), String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    conn.execute("INSERT INTO table_orders (table_id, product_id, product_name, quantity, unit_price_kurus) VALUES (?, ?, ?, ?, ?)", 
                 params![table_id, product_id, product_name, quantity, unit_price_kurus]).map_err(|e| e.to_string())?;
    
    conn.execute("UPDATE tables SET status = 'OCCUPIED' WHERE id = ?", params![table_id]).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn clear_table(table_id: i64) -> Result<(), String> {
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM table_orders WHERE table_id = ?", params![table_id]).map_err(|e| e.to_string())?;
    tx.execute("UPDATE tables SET status = 'EMPTY' WHERE id = ?", params![table_id]).map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}


// -------------------------------------------------------------
// User Management Commands
// -------------------------------------------------------------

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UserDto {
    pub id: i64,
    pub username: String,
    pub full_name: String,
    pub role: String,
    pub is_active: bool,
}

#[tauri::command]
pub fn list_users() -> Result<Vec<UserDto>, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare("
        SELECT u.id, u.username, u.full_name, r.name as role, u.is_active
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        ORDER BY u.id ASC
    ").map_err(|e| e.to_string())?;
    
    let rows = stmt.query_map([], |row| {
        Ok(UserDto {
            id: row.get(0)?,
            username: row.get(1)?,
            full_name: row.get(2)?,
            role: row.get::<_, Option<String>>(3)?.unwrap_or_else(|| "PERSONEL".to_string()),
            is_active: row.get(4)?,
        })
    }).unwrap();
    
    let mut res = vec![];
    for r in rows { res.push(r.unwrap()); }
    Ok(res)
}

#[tauri::command]
pub fn get_user_hash(username: String) -> Result<String, String> {
    let db = get_db_manager();
    let conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let hash: Option<String> = conn.query_row(
        "SELECT password_hash FROM users WHERE username = ? AND is_active = 1",
        params![username],
        |row| row.get(0)
    ).optional().map_err(|e| e.to_string())?;
    
    match hash {
        Some(h) => Ok(h),
        None => Err("KullanÄ±cÄ± bulunamadÄ± veya pasif.".to_string()),
    }
}

#[tauri::command]
pub fn change_user_password(username: String, current_password: String, new_password: String) -> Result<bool, String> {
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let hash: Option<String> = tx.query_row(
        "SELECT password_hash FROM users WHERE username = ?",
        params![username],
        |row| row.get(0)
    ).optional().map_err(|e| e.to_string())?;

    let stored_hash = match hash {
        Some(h) => h,
        None => return Err("KullanÄ±cÄ± bulunamadÄ±.".to_string()),
    };

    if !crate::security::SecurityManager::verify_password(&current_password, &stored_hash).unwrap_or(false) {
        return Err("Mevcut parola yanlÄ±ÅŸ.".to_string());
    }

    let new_hash = crate::security::SecurityManager::hash_password(&new_password).map_err(|e| e.to_string())?;

    tx.execute(
        "UPDATE users SET password_hash = ? WHERE username = ?",
        params![new_hash, username]
    ).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
pub fn log_message(msg: String) -> Result<(), String> {
    let _ = std::fs::write("C:\\Users\\Ali AltÄ±n\\Desktop\\bufe-pos\\debug.txt", msg);
    Ok(())
}


// --- PHASE 6: İPTAL İŞLEMİ ---

#[tauri::command]
pub fn cancel_sale(sale_id: i64, user_id: i64, reason: Option<String>) -> Result<(), String> {
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let role: String = conn.query_row(
        "SELECT r.name FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id WHERE u.id = ?",
        [user_id],
        |row| row.get::<_, Option<String>>(0).map(|s| s.unwrap_or_else(|| "PERSONEL".to_string()))
    ).map_err(|_| "Kullanıcı bulunamadı".to_string())?;
    
    if role != "ADMIN" { return Err("Bu işlem için yetkiniz yok.".to_string()); }
    
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
                tx.execute(
                    "UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = ?",
                    params![qty, p_id, warehouse_id]
                ).map_err(|e| e.to_string())?;
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
    drop(stmt);
    drop(stmt_pay);
    tx.execute(

        "UPDATE sales SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP, cancel_reason = ?, cancelled_by = 1 WHERE id = ?",
        params![reason, sale_id]
    ).map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}


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
pub fn refund_sale(sale_id: i64, user_id: i64, items: Vec<RefundItemInput>, reason: Option<String>) -> Result<(), String> {
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let role: String = conn.query_row(
        "SELECT r.name FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id WHERE u.id = ?",
        [user_id],
        |row| row.get::<_, Option<String>>(0).map(|s| s.unwrap_or_else(|| "PERSONEL".to_string()))
    ).map_err(|_| "Kullanıcı bulunamadı".to_string())?;
    
    if role != "ADMIN" { return Err("Bu işlem için yetkiniz yok (Sadece ADMIN).".to_string()); }

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
            tx.execute(
                "UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = 1",
                params![req_item.quantity, p_id]
            ).unwrap();
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
    drop(stmt_pay);

    tx.execute("UPDATE sales SET refunded_amount_kurus = ?, status = ? WHERE id = ?", params![new_refunded, new_status, sale_id]).unwrap();


    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
