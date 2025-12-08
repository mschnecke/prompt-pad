use crate::error::AppError;
use crate::models::Settings;
use crate::storage::get_storage_path;
use std::fs;
use std::path::PathBuf;
use std::sync::RwLock;

static SETTINGS: RwLock<Option<Settings>> = RwLock::new(None);

/// Get the settings file path
fn get_settings_path() -> PathBuf {
    get_storage_path().join("settings.json")
}

/// Load settings from disk
pub fn load_settings() -> Result<Settings, AppError> {
    let settings_path = get_settings_path();

    if settings_path.exists() {
        let content = fs::read_to_string(&settings_path)?;
        let settings: Settings = serde_json::from_str(&content)?;
        Ok(settings)
    } else {
        Ok(Settings::default())
    }
}

/// Save settings to disk
pub fn save_settings(settings: &Settings) -> Result<(), AppError> {
    let settings_path = get_settings_path();
    let content = serde_json::to_string_pretty(settings)?;
    fs::write(settings_path, content)?;

    // Update cache
    if let Ok(mut guard) = SETTINGS.write() {
        *guard = Some(settings.clone());
    }

    Ok(())
}

/// Get current settings (from cache or disk)
pub fn get_settings() -> Result<Settings, AppError> {
    // Try cache first
    if let Ok(guard) = SETTINGS.read() {
        if let Some(settings) = guard.as_ref() {
            return Ok(settings.clone());
        }
    }

    // Load from disk
    let settings = load_settings()?;

    // Update cache
    if let Ok(mut guard) = SETTINGS.write() {
        *guard = Some(settings.clone());
    }

    Ok(settings)
}

/// Update settings
pub fn update_settings(new_settings: Settings) -> Result<Settings, AppError> {
    save_settings(&new_settings)?;
    Ok(new_settings)
}
