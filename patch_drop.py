import os
import re

path = r'C:\Users\Ali Altın\Desktop\bufe-pos\src-tauri\src\commands\mod.rs'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# cancel_sale dropping
cancel_drop = """
    // 3. Durum Güncelleme
    drop(stmt);
    drop(stmt_pay);
    tx.execute(
"""
content = content.replace(
    '    // 3. Durum Güncelleme\n    tx.execute(',
    cancel_drop
)

# refund_sale dropping
# stmt is in get_sale_details, but we use stmt_pay in refund_sale
refund_drop = """
    let new_status = if new_refunded >= orig_total { "REFUNDED" } else { "PARTIALLY_REFUNDED" };
    drop(stmt_pay);

    tx.execute("UPDATE sales SET refunded_amount_kurus = ?, status = ? WHERE id = ?", params![new_refunded, new_status, sale_id]).unwrap();
"""
content = content.replace(
    '    let new_status = if new_refunded >= orig_total { "REFUNDED" } else { "PARTIALLY_REFUNDED" };\n\n    tx.execute("UPDATE sales SET refunded_amount_kurus = ?, status = ? WHERE id = ?", params![new_refunded, new_status, sale_id]).unwrap();',
    refund_drop
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
