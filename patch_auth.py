import os
import re

path = r'C:\Users\Ali Altın\Desktop\bufe-pos\src-tauri\src\commands\mod.rs'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace cancel_sale signature
content = content.replace(
    'pub fn cancel_sale(sale_id: i64, reason: Option<String>) -> Result<(), String> {',
    '''pub fn cancel_sale(sale_id: i64, user_id: i64, reason: Option<String>) -> Result<(), String> {
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let role: String = conn.query_row("SELECT role FROM users WHERE id = ?", [user_id], |row| row.get(0)).map_err(|_| "Kullanıcı bulunamadı".to_string())?;
    if role != "ADMIN" { return Err("Bu işlem için yetkiniz yok.".to_string()); }
    
    let tx = conn.transaction().map_err(|e| e.to_string())?;
'''
)
# We also have let db = get_db_manager() etc. in the original, so the above replacement replaces the first 4 lines:
# Oh wait, my replace might duplicate `let db = get_db_manager();`. Let's do it safely using regex.

import re

# Safely patch cancel_sale
cancel_pattern = r'pub fn cancel_sale\(sale_id: i64, reason: Option<String>\) -> Result<\(\), String> \{\s*let db = get_db_manager\(\);\s*let mut conn = db\.get_connection\(\)\.map_err\(\|e\| e\.to_string\(\)\)\?;\s*let tx = conn\.transaction\(\)\.map_err\(\|e\| e\.to_string\(\)\)\?;'

cancel_replacement = r'''pub fn cancel_sale(sale_id: i64, user_id: i64, reason: Option<String>) -> Result<(), String> {
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let role: String = conn.query_row("SELECT role FROM users WHERE id = ?", [user_id], |row| row.get(0)).map_err(|_| "Kullanıcı bulunamadı".to_string())?;
    if role != "ADMIN" { return Err("Bu işlem için yetkiniz yok (Sadece ADMIN).".to_string()); }

    let tx = conn.transaction().map_err(|e| e.to_string())?;'''

content = re.sub(cancel_pattern, cancel_replacement, content)

# Safely patch refund_sale
refund_pattern = r'pub fn refund_sale\(sale_id: i64, items: Vec<RefundItemInput>, reason: Option<String>\) -> Result<\(\), String> \{\s*let db = get_db_manager\(\);\s*let mut conn = db\.get_connection\(\)\.map_err\(\|e\| e\.to_string\(\)\)\?;\s*let tx = conn\.transaction\(\)\.map_err\(\|e\| e\.to_string\(\)\)\?;'

refund_replacement = r'''pub fn refund_sale(sale_id: i64, user_id: i64, items: Vec<RefundItemInput>, reason: Option<String>) -> Result<(), String> {
    let db = get_db_manager();
    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    
    let role: String = conn.query_row("SELECT role FROM users WHERE id = ?", [user_id], |row| row.get(0)).map_err(|_| "Kullanıcı bulunamadı".to_string())?;
    if role != "ADMIN" { return Err("Bu işlem için yetkiniz yok (Sadece ADMIN).".to_string()); }

    let tx = conn.transaction().map_err(|e| e.to_string())?;'''

content = re.sub(refund_pattern, refund_replacement, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
