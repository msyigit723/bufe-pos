import sqlite3
db = sqlite3.connect(r'C:\Users\Ali Altın\AppData\Local\BufePOS\BufePOS.db')
print(db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='cash_movements'").fetchone()[0])
