#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    configure_linux_webkit_environment();

    tauri::Builder::default()
        .setup(|_app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = tauri::Manager::get_webview_window(_app, "main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_prevent_default::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(target_os = "linux")]
fn configure_linux_webkit_environment() {
    let is_wayland = std::env::var_os("WAYLAND_DISPLAY").is_some();
    let enable_dmabuf = std::env::var_os("WOLFS_ADDON_MANAGER_ENABLE_WEBKIT_DMABUF").is_some();
    if !is_wayland || enable_dmabuf {
        return;
    }

    // WebKitGTK's DMA-BUF renderer is still fragile on some Linux/Wayland
    // stacks, causing blank windows or framebuffer construction errors.
    // Users can opt back into the native path with
    // WOLFS_ADDON_MANAGER_ENABLE_WEBKIT_DMABUF=1.
    if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }
}

#[cfg(not(target_os = "linux"))]
fn configure_linux_webkit_environment() {}
