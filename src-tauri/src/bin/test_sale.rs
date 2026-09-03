use app_lib::commands::*;

fn main() {
    let db = get_db_manager();
    db.run_all_migrations().unwrap();

    let inv1 = get_inventory_list(None, Some("Popkek".to_string())).unwrap();
    if inv1.is_empty() {
        println!("Popkek not found");
        return;
    }
    let initial_popkek_stock = inv1[0].current_stock;
    println!("Initial Popkek Stock: {}", initial_popkek_stock);

    let sale_input = ProcessSaleInput {
        customer_id: None,
        cash_register_id: Some(1),
        items: vec![
            ProcessSaleItemInput {
                product_id: inv1[0].product_id,
                barcode: None,
                quantity: 1.0,
                unit_price_kurus: 2000,
                discount_amount_kurus: 0,
                vat_rate: 20.0,
            }
        ],
        payments: vec![
            ProcessSalePaymentInput {
                payment_type: "NAKIT".to_string(),
                amount_kurus: 2000,
            }
        ],
    };
    
    match process_sale(sale_input) {
        Ok(res) => println!("Sale Success: {:?}", res.sale_id),
        Err(e) => println!("Sale Error: {}", e),
    }

    let inv2 = get_inventory_list(None, Some("Popkek".to_string())).unwrap();
    let new_popkek_stock = inv2[0].current_stock;
    println!("New Popkek Stock: {}", new_popkek_stock);
    
    if new_popkek_stock == initial_popkek_stock - 1.0 {
        println!("STOCK TEST PASSED");
    } else {
        println!("STOCK TEST FAILED");
    }
}
