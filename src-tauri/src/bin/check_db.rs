#[path = "../commands/mod.rs"] mod commands;
#[path = "../database/mod.rs"] mod database;
#[path = "../security/mod.rs"] mod security;
fn main() {
    let db = commands::get_db_manager();
    db.run_all_migrations().unwrap();
    println!("Database Path: {:?}", db.get_db_path());
    let conn = db.get_connection().unwrap();
    let mut stmt = conn.prepare("PRAGMA table_info(users)").unwrap();
    let col_iter = stmt.query_map([], |row| {
        Ok(format!("{} | {} | {}", 
            row.get::<_, i64>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?
        ))
    }).unwrap();

    println!("Columns in users:");
    for col in col_iter {
        println!("{}", col.unwrap());
    }
    
    let mut stmt = conn.prepare("SELECT * FROM users").unwrap();
    let user_iter = stmt.query_map([], |row| {
        Ok(format!("{} | {} | {}", 
            row.get::<_, i64>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(3)?
        ))
    }).unwrap();
    
    for u in user_iter {
        println!("{}", u.unwrap());
    }
}