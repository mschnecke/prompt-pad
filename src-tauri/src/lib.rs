mod commands;
mod focus;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};
// Global shortcut plugin is used by the frontend to register customizable hotkeys

fn toggle_launcher(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("launcher") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            focus::save_previous_app();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Create tray menu items
            let manage_item = MenuItem::with_id(app, "manage", "Manage Prompts", true, None::<&str>)?;
            let settings_item = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            // Create menu
            let menu = Menu::with_items(app, &[&manage_item, &settings_item, &quit_item])?;

            // Build the tray icon with menu
            // macOS: use template icon (white, adapts to menu bar)
            // Windows: use colored icon for visibility on taskbar
            #[cfg(target_os = "macos")]
            let tray_icon = tauri::image::Image::from_bytes(include_bytes!("../icons/tray-icon@2x.png")).unwrap();
            #[cfg(target_os = "windows")]
            let tray_icon = tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png")).unwrap();
            #[cfg(not(any(target_os = "macos", target_os = "windows")))]
            let tray_icon = tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png")).unwrap();

            let tray = TrayIconBuilder::new()
                .icon(tray_icon)
                .icon_as_template(cfg!(target_os = "macos"))
                .tooltip("PromptPad - Click to toggle")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "manage" => {
                            // Show window and emit manage prompts event
                            if let Some(window) = app.get_webview_window("launcher") {
                                focus::save_previous_app();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                            let _ = app.emit("open-manager", ());
                        }
                        "settings" => {
                            // Show window and emit settings event
                            if let Some(window) = app.get_webview_window("launcher") {
                                focus::save_previous_app();
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                            let _ = app.emit("open-settings", ());
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
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

            // Keep the tray icon alive for the lifetime of the app
            // Without this, the tray icon is dropped and disappears on Windows
            std::mem::forget(tray);

            // Global shortcut is registered by the frontend from settings.json
            // This allows users to customize their hotkey in Settings

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::show_launcher,
            commands::hide_launcher,
            commands::paste_to_previous_app,
            commands::get_previous_app_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
