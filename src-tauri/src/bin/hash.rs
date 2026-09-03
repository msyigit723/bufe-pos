
#[path = "../security/mod.rs"] mod security;
use rusqlite::{Connection, Result};
fn main() -> Result<()> {
    let app_dir = dirs::data_local_dir().unwrap().join("BufePOS");
    let db_path = app_dir.join("BufePOS.db");
    let conn = Connection::open(&db_path)?;
    let mut stmt = conn.prepare("SELECT id, username, password_hash, is_active FROM users")?;
    let user_iter = stmt.query_map([], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, row.get::<_, bool>(3)?))
    })?;
    for user in user_iter {
        let (id, un, hash, active) = user.unwrap();
        println!("ID: {}, User: {}, Active: {}", id, un, active);
        println!("  Hash from DB: {}", hash);
        if un == "admin" {
            let valid = security::SecurityManager::verify_password("ZeryamAdmin2026", &hash).unwrap_or(false);
            println!("  ZeryamAdmin2026 verified: {}", valid);
        } else if un == "personel" {
            let valid = security::SecurityManager::verify_password("ZeryamStaff2026", &hash).unwrap_or(false);
            println!("  ZeryamStaff2026 verified: {}", valid);
        }
    }
    Ok(())
}