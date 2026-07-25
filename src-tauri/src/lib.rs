// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg(mobile)]
mod smtc_mobile;

#[tauri::command]
fn get_platform() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else if cfg!(target_os = "android") {
        "android"
    } else if cfg!(target_os = "ios") {
        "ios"
    } else {
        "unknown"
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build());

    #[cfg(mobile)]
    let builder = builder.plugin(tauri_plugin_media_session::init());

    builder
        .setup(|app| {
            #[cfg(mobile)]
            {
                use tauri_plugin_media_session::MediaSessionExt;
                let _ = app.media_session().initialize();
            }
            let _ = app;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_platform,
            #[cfg(mobile)]
            smtc_mobile::smtc_update,
            #[cfg(mobile)]
            smtc_mobile::smtc_clear
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
