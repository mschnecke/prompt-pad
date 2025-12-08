use tauri::{AppHandle, Manager};

use crate::focus;

#[tauri::command]
pub async fn show_launcher(app: AppHandle) -> Result<(), String> {
    // Save the currently focused app before showing our window
    focus::save_previous_app();

    if let Some(window) = app.get_webview_window("launcher") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;

        // Center on screen using positioner
        use tauri_plugin_positioner::{Position, WindowExt};
        let _ = window.move_window(Position::Center);
    }

    Ok(())
}

#[tauri::command]
pub async fn hide_launcher(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("launcher") {
        window.hide().map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn paste_to_previous_app() -> Result<(), String> {
    // Restore focus to previous app and simulate paste
    focus::restore_and_paste().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_previous_app_info() -> Result<Option<String>, String> {
    Ok(focus::get_previous_app_name())
}
