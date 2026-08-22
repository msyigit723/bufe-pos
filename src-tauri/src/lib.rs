pub mod commands;
pub mod database;
pub mod security;

use commands::{
    add_product_barcode, create_category, create_product, db_health_check, delete_category,
    delete_product, get_product_by_id, hash_password, list_categories, list_products,
    remove_product_barcode, run_migrations, search_product_by_barcode, set_primary_barcode,
    set_product_active, update_category, update_product, verify_password, process_sale,
    get_recent_sales, get_pos_initial_state, open_cash_register, get_active_cash_session,
    add_cash_movement, close_cash_register, get_cash_movements, get_daily_sales_summary,
    create_customer, update_customer, list_customers, get_customer_history, receive_customer_payment,
    get_inventory_list, add_stock_adjustment, get_stock_movements,
    list_suppliers, create_supplier, update_supplier, process_purchase_invoice, pay_supplier,
    get_app_settings, update_app_settings, backup_database,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            db_health_check,
            run_migrations,
            hash_password,
            verify_password,
            list_categories,
            create_category,
            update_category,
            delete_category,
            list_products,
            get_product_by_id,
            search_product_by_barcode,
            create_product,
            update_product,
            set_product_active,
            delete_product,
            add_product_barcode,
            remove_product_barcode,
            set_primary_barcode,
            process_sale,
            get_recent_sales,
            get_pos_initial_state,
            open_cash_register,
            get_active_cash_session,
            add_cash_movement,
            close_cash_register,
            get_cash_movements,
            get_daily_sales_summary,
            create_customer,
            update_customer,
            list_customers,
            get_customer_history,
            receive_customer_payment,
            get_inventory_list,
            add_stock_adjustment,
            get_stock_movements,
            list_suppliers,
            create_supplier,
            update_supplier,
            process_purchase_invoice,
            pay_supplier,
            get_app_settings,
            update_app_settings,
            backup_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
