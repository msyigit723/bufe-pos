use rusqlite::{Connection, Result};
use std::fs;
use std::path::PathBuf;

pub struct DatabaseManager {
    db_path: PathBuf,
}

impl DatabaseManager {
    pub fn new(app_dir: PathBuf) -> Self {
        fs::create_dir_all(&app_dir).ok();
        let db_path = app_dir.join("BufePOS.db");
        Self { db_path }
    }

    pub fn get_db_path(&self) -> PathBuf {
        self.db_path.clone()
    }

    pub fn get_connection(&self) -> Result<Connection> {
        let conn = Connection::open(&self.db_path)?;
        
        // Enforce mandatory Pragmas for SQLite as per Phase 1 specification
        conn.execute_batch(
            "
            PRAGMA foreign_keys = ON;
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            "
        )?;

        Ok(conn)
    }

    pub fn run_migration(&self, migration_name: &str, migration_sql: &str) -> Result<()> {
        let mut conn = self.get_connection()?;
        
        // Create migration tracker table if it does not exist
        conn.execute(
            "CREATE TABLE IF NOT EXISTS _schema_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                migration_name VARCHAR(100) NOT NULL UNIQUE,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        // Check if migration has already been applied
        let already_applied: bool = conn
            .query_row(
                "SELECT COUNT(*) FROM _schema_migrations WHERE migration_name = ?",
                [migration_name],
                |row| row.get::<_, i64>(0),
            )
            .map(|count| count > 0)
            .unwrap_or(false);

        if !already_applied {
            let tx = conn.transaction()?;
            tx.execute_batch(migration_sql)?;
            tx.execute(
                "INSERT INTO _schema_migrations (migration_name) VALUES (?)",
                [migration_name],
            )?;
            tx.commit()?;
        }

        Ok(())
    }

    pub fn run_all_migrations(&self) -> Result<()> {
        let migrations = [
            ("0001_initial_schema.sql", include_str!("../../migrations/0001_initial_schema.sql")),
            ("0002_product_management.sql", include_str!("../../migrations/0002_product_management.sql")),
            ("0003_pos_sales_support.sql", include_str!("../../migrations/0003_pos_sales_support.sql")),
        ];

        for (name, sql) in migrations {
            self.run_migration(name, sql)?;
        }

        Ok(())
    }

    pub fn health_check(&self) -> Result<(bool, bool, usize)> {
        let conn = self.get_connection()?;
        
        let fk_active: i32 = conn.query_row("PRAGMA foreign_keys", [], |row| row.get(0))?;
        let journal_mode: String = conn.query_row("PRAGMA journal_mode", [], |row| row.get(0))?;
        
        let table_count: usize = conn.query_row(
            "SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
            [],
            |row| row.get(0),
        )?;

        let is_wal = journal_mode.to_lowercase() == "wal";
        let is_fk = fk_active == 1;

        Ok((is_fk, is_wal, table_count))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn setup_test_db(test_name: &str) -> (DatabaseManager, PathBuf) {
        let temp_dir = std::env::temp_dir().join(format!("bufepos_test_{}", test_name));
        let _ = fs::remove_dir_all(&temp_dir);
        let db_manager = DatabaseManager::new(temp_dir.clone());
        (db_manager, temp_dir)
    }

    #[test]
    fn test_sqlite_pragmas_and_health_check() {
        let (db, temp_dir) = setup_test_db("pragmas");
        let (fk_active, wal_active, _table_count) = db.health_check().expect("Health check should succeed");
        
        assert!(fk_active, "Foreign Keys must be active (PRAGMA foreign_keys = ON)");
        assert!(wal_active, "Journal mode must be WAL (PRAGMA journal_mode = WAL)");
        
        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_migration_runner_and_idempotency() {
        let (db, temp_dir) = setup_test_db("migrations");

        // First execution of all migrations
        let result1 = db.run_all_migrations();
        assert!(result1.is_ok(), "First migration run should succeed");

        let (fk, wal, table_count) = db.health_check().expect("Health check after migration");
        assert!(fk);
        assert!(wal);
        assert!(table_count >= 14, "Expected at least 14 tables, found {}", table_count);

        // Second execution (Idempotency test)
        let result2 = db.run_all_migrations();
        assert!(result2.is_ok(), "Second migration run must be idempotent and succeed without error");

        let _ = fs::remove_dir_all(&temp_dir);
    }
}

