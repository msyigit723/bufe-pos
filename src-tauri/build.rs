use std::path::PathBuf;

fn main() {
    let mut attributes = tauri_build::Attributes::new();
    
    // Workaround for GNU windres path parsing on Windows with space / special characters in user profile
    let icon_path = if PathBuf::from("D:/icon.ico").exists() {
        PathBuf::from("D:/icon.ico")
    } else {
        PathBuf::from("icons/icon.ico")
    };
    
    attributes = attributes.windows_attributes(
        tauri_build::WindowsAttributes::new().window_icon_path(icon_path)
    );

    tauri_build::try_build(attributes).expect("failed to run tauri-build");
}
