use app_lib::commands::*;


fn main() {
    let db = get_db_manager();
    db.run_all_migrations().unwrap();
    let conn = db.get_connection().unwrap();

    // Reset stock to 0 for Popkek and Cay for clean test
    conn.execute("UPDATE stock SET quantity = 10 WHERE product_id IN (101, 106)", ()).unwrap();

    // 1. STOCK TEST
    let inv = get_inventory_list(None, None).unwrap();
    let popkek = inv.iter().find(|p| p.product_id == 106).unwrap();
    let cay = inv.iter().find(|p| p.product_id == 101).unwrap();
    println!("Initial Popkek: {}, Cay: {}", popkek.current_stock, cay.current_stock);

    // 2. CASH PAYMENT TEST
    let cash_sale_input = ProcessSaleInput {
        customer_id: None,
        cash_register_id: Some(1),
        items: vec![
            ProcessSaleItemInput {
                product_id: popkek.product_id,
                barcode: None,
                quantity: 1.0,
                unit_price_kurus: 2000,
                discount_amount_kurus: 0,
                vat_rate: 20.0,
            },
            ProcessSaleItemInput {
                product_id: cay.product_id,
                barcode: None,
                quantity: 1.0,
                unit_price_kurus: 3500,
                discount_amount_kurus: 0,
                vat_rate: 20.0,
            }
        ],
        payments: vec![
            ProcessSalePaymentInput {
                payment_type: "NAKIT".to_string(),
                amount_kurus: 5500, // exact amount, change handling is on frontend, but backend receives exact amount paid for the sale or the full amount?
                // Wait, frontend calculates change and sends amount_kurus = 5500. Let's send 5500.
            }
        ],
    };
    
    let cash_res = process_sale(cash_sale_input).unwrap();
    println!("Cash Sale ID: {}", cash_res.sale_id);

    // Check stock after cash sale
    let inv2 = get_inventory_list(None, None).unwrap();
    let popkek2 = inv2.iter().find(|p| p.product_id == 106).unwrap();
    let cay2 = inv2.iter().find(|p| p.product_id == 101).unwrap();
    println!("After Cash Sale - Popkek: {}, Cay: {}", popkek2.current_stock, cay2.current_stock);
    if popkek2.current_stock == 9.0 && cay2.current_stock == 9.0 {
        println!("STOCK DECREASE PASSED");
    } else {
        println!("STOCK DECREASE FAILED");
    }

    // 3. CARD PAYMENT TEST
    let card_sale_input = ProcessSaleInput {
        customer_id: None,
        cash_register_id: Some(1),
        items: vec![
            ProcessSaleItemInput {
                product_id: popkek.product_id,
                barcode: None,
                quantity: 2.0, // Selling 2 identical items
                unit_price_kurus: 2000,
                discount_amount_kurus: 0,
                vat_rate: 20.0,
            }
        ],
        payments: vec![
            ProcessSalePaymentInput {
                payment_type: "KREDI_KARTI".to_string(),
                amount_kurus: 4000,
            }
        ],
    };
    let card_res = process_sale(card_sale_input).unwrap();
    println!("Card Sale ID: {}", card_res.sale_id);

    // Check stock after card sale
    let inv3 = get_inventory_list(None, None).unwrap();
    let popkek3 = inv3.iter().find(|p| p.product_id == 106).unwrap();
    println!("After Card Sale - Popkek: {}", popkek3.current_stock);
    if popkek3.current_stock == 7.0 {
        println!("CARD STOCK DECREASE PASSED");
    } else {
        println!("CARD STOCK DECREASE FAILED");
    }

    // 4. TABLE PAYMENT TEST
    // Clear table 1
    clear_table(1).unwrap();
    // Add items to table 1
    add_table_order(1, popkek.product_id, popkek.product_name.clone(), 1.0, 2000).unwrap();
    add_table_order(1, cay.product_id, cay.product_name.clone(), 2.0, 3500).unwrap();
    
    let table_orders = get_table_orders(1).unwrap();
    println!("Table 1 Orders count: {}", table_orders.len());
    if table_orders.len() == 2 {
        println!("TABLE ORDER PERSISTENCE PASSED");
    } else {
        println!("TABLE ORDER PERSISTENCE FAILED");
    }
    
    // Simulate frontend checking out table (frontend calls clear_table and transfers to POS)
    clear_table(1).unwrap();
    let empty_table_orders = get_table_orders(1).unwrap();
    if empty_table_orders.len() == 0 {
        println!("TABLE CLEAR PASSED");
    } else {
        println!("TABLE CLEAR FAILED");
    }
}
