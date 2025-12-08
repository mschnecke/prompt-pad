pub mod prompt_store;
pub mod index;
pub mod settings;

use std::path::PathBuf;
use std::sync::OnceLock;

static STORAGE_PATH: OnceLock<PathBuf> = OnceLock::new();

/// Get the storage directory path
pub fn get_storage_path() -> &'static PathBuf {
    STORAGE_PATH.get_or_init(|| {
        dirs::home_dir()
            .expect("Failed to get home directory")
            .join("PromptPad")
    })
}

/// Initialize storage directory structure
pub fn init_storage() -> Result<(), std::io::Error> {
    let storage_path = get_storage_path();

    // Create main directory
    std::fs::create_dir_all(storage_path)?;

    // Create prompts directory
    std::fs::create_dir_all(storage_path.join("prompts"))?;

    // Create uncategorized folder
    std::fs::create_dir_all(storage_path.join("prompts").join("uncategorized"))?;

    Ok(())
}
