import sqlite3
db_path = r'C:\Users\Ali Altın\AppData\Local\BufePOS\BufePOS.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name IN ('products', 'product_barcodes')")
rows = cursor.fetchall()
for row in rows:
    print(row[0])
conn.close()
