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

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;
#[cfg(target_os = "windows")]
const GPU_PREF_KEY: &str = r"HKCU\Software\Microsoft\DirectX\UserGpuPreferences";

#[cfg(target_os = "windows")]
#[tauri::command]
fn list_gpus() -> Result<Vec<String>, String> {
    use std::os::windows::process::CommandExt;
    let out = std::process::Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "(Get-CimInstance Win32_VideoController).Name",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|e| e.to_string())?;
    let text = String::from_utf8_lossy(&out.stdout);
    Ok(text
        .lines()
        .map(|l| l.trim().to_string())
        .filter(|l| !l.is_empty())
        .collect())
}

#[cfg(target_os = "windows")]
fn read_gpu_pref_registry() -> u32 {
    use std::os::windows::process::CommandExt;
    let exe = match std::env::current_exe() {
        Ok(p) => p.to_string_lossy().to_string(),
        Err(_) => return 0,
    };
    let out = std::process::Command::new("reg")
        .args(["query", GPU_PREF_KEY, "/v", &exe])
        .creation_flags(CREATE_NO_WINDOW)
        .output();
    if let Ok(o) = out {
        let text = String::from_utf8_lossy(&o.stdout);
        if let Some(pos) = text.find("GpuPreference=") {
            if let Some(c) = text[pos + 14..].chars().next() {
                return c.to_digit(10).unwrap_or(0);
            }
        }
    }
    0
}

/// WebView2 渲染在独立子进程，注册表 GpuPreference 只影响主进程；
/// 必须在 WebView 创建前给 WebView2 传 --force_high_performance_gpu（运行时 145+ 支持）
#[cfg(target_os = "windows")]
fn apply_gpu_preference_env() {
    if read_gpu_pref_registry() == 2 {
        let existing = std::env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").unwrap_or_default();
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            format!("{existing} --force_high_performance_gpu")
                .trim()
                .to_string(),
        );
    }
}

#[cfg(target_os = "windows")]
#[tauri::command]
fn get_gpu_preference() -> u32 {
    read_gpu_pref_registry()
}

#[cfg(target_os = "windows")]
#[tauri::command]
fn set_gpu_preference(mode: u32) -> Result<(), String> {
    use std::os::windows::process::CommandExt;
    let exe = std::env::current_exe()
        .map_err(|e| e.to_string())?
        .to_string_lossy()
        .to_string();
    if mode == 0 {
        // 删除条目 = 恢复系统默认（值不存在时报错可忽略）
        let _ = std::process::Command::new("reg")
            .args(["delete", GPU_PREF_KEY, "/v", &exe, "/f"])
            .creation_flags(CREATE_NO_WINDOW)
            .status();
        return Ok(());
    }
    let status = std::process::Command::new("reg")
        .args([
            "add",
            GPU_PREF_KEY,
            "/v",
            &exe,
            "/t",
            "REG_SZ",
            "/d",
            &format!("GpuPreference={};", mode),
            "/f",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err("写入注册表失败".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "windows")]
    apply_gpu_preference_env();

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
            #[cfg(target_os = "windows")]
            list_gpus,
            #[cfg(target_os = "windows")]
            get_gpu_preference,
            #[cfg(target_os = "windows")]
            set_gpu_preference,
            #[cfg(mobile)]
            smtc_mobile::smtc_update,
            #[cfg(mobile)]
            smtc_mobile::smtc_clear
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
