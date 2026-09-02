
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
        println!("ID: {}, User: {}, Hash: {}, Active: {}", id, un, hash, active);
    }
    Ok(())
}