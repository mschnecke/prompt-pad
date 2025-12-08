mod commands;
mod error;
mod models;
mod platform;
mod storage;

use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

#[tauri::command]
fn show_launcher(window: tauri::Window) {
    // Save the previous app before showing launcher
    platform::save_previous_app();
    let _ = window.show();
    let _ = window.set_focus();
}

#[tauri::command]
fn hide_launcher(window: tauri::Window) {
    let _ = window.hide();
}

/// Paste to previous app and hide launcher
#[tauri::command]
fn paste_and_hide(window: tauri::Window) -> bool {
    let _ = window.hide();

    // Small delay for window to hide
    std::thread::sleep(std::time::Duration::from_millis(50));

    // Paste to previous app
    platform::paste_to_previous_app()
}

fn toggle_launcher(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("launcher") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            // Save the previous app before showing launcher
            platform::save_previous_app();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // Register global shortcut (Cmd+Shift+Space on macOS, Ctrl+Shift+Space on Windows)
            #[cfg(target_os = "macos")]
            let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::Space);
            #[cfg(not(target_os = "macos"))]
            let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);

            let app_handle = app.handle().clone();
            if let Err(e) = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, _event| {
                toggle_launcher(&app_handle);
            }) {
                eprintln!("Failed to register global shortcut: {}", e);
            }

            println!("PromptPad started - use Cmd+Shift+Space or click tray icon");
            // Initialize storage directory
            if let Err(e) = storage::init_storage() {
                eprintln!("Failed to initialize storage: {}", e);
            }

            // Rebuild index on startup
            if let Err(e) = storage::index::rebuild_index() {
                eprintln!("Failed to rebuild index: {}", e);
            }

            // Build the tray icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .icon_as_template(true)
                .tooltip("PromptPad - Click to toggle")
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_launcher(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            show_launcher,
            hide_launcher,
            paste_and_hide,
            commands::get_prompt_index,
            commands::rebuild_prompt_index,
            commands::create_prompt,
            commands::update_prompt,
            commands::delete_prompt,
            commands::get_prompt_content,
            commands::record_prompt_usage,
            commands::create_folder,
            commands::list_folders,
            commands::get_settings,
            commands::update_settings,
            commands::search_prompt_content,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
