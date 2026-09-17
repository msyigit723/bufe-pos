import sqlite3

db_path = r'C:\Users\Ali Altın\AppData\Local\BufePOS\BufePOS.db'
migration_path = r'C:\Users\Ali Altın\Desktop\bufe-pos\src-tauri\migrations\0009_customer_payments.sql'

with open(migration_path, 'r', encoding='utf-8') as f:
    sql_script = f.read()

conn = sqlite3.connect(db_path)
try:
    cursor = conn.cursor()
    
    # Check if migration was already applied
    cursor.execute("SELECT COUNT(*) FROM _schema_migrations WHERE migration_name = '0009_customer_payments.sql'")
    if cursor.fetchone()[0] == 0:
        print("Applying migration...")
        cursor.executescript(sql_script)
        cursor.execute("INSERT INTO _schema_migrations (migration_name) VALUES ('0009_customer_payments.sql')")
        conn.commit()
        print("Migration applied successfully.")
    else:
        print("Migration already applied.")
except Exception as e:
    print(f"Error applying migration: {e}")
finally:
    conn.close()
