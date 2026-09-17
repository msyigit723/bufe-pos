import sqlite3

db_path = r'C:\Users\Ali Altın\AppData\Local\BufePOS\BufePOS.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name;")
tables = cursor.fetchall()

for table in tables:
    if table[0] != 'sqlite_sequence':
        print(f"--- TABLE {table[0]} ---")
        print(table[1])
        print("")

conn.close()
