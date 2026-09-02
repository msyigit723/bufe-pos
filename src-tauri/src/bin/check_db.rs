
#[path = "../commands/mod.rs"] mod commands;
#[path = "../database/mod.rs"] mod database;
#[path = "../security/mod.rs"] mod security;
fn main() {
    println!("Running migrations...");
    match commands::run_migrations() {
        Ok(msg) => println!("Success: {}", msg),
        Err(e) => println!("Error: {}", e),
    }
}