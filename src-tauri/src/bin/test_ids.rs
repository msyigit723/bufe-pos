use app_lib::commands::*;
fn main() {
    let db = get_db_manager();
    db.run_all_migrations().unwrap();
    let inv = get_inventory_list(None, None).unwrap();
    for p in inv {
        println!("{}: {}", p.product_id, p.product_name);
    }
}
