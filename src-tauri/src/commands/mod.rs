use crate::error::AppError;
use crate::models::{CreatePromptInput, PromptIndex, PromptMetadata, Settings, UpdatePromptInput};
use crate::storage::{index, prompt_store, settings};
use uuid::Uuid;

// ============ Prompt Commands ============

#[tauri::command]
pub async fn get_prompt_index() -> Result<PromptIndex, AppError> {
    index::get_index()
}

#[tauri::command]
pub async fn rebuild_prompt_index() -> Result<PromptIndex, AppError> {
    index::rebuild_index()
}

#[tauri::command]
pub async fn create_prompt(input: CreatePromptInput) -> Result<PromptMetadata, AppError> {
    let metadata = prompt_store::create_prompt(input)?;
    index::update_index_entry(metadata.clone())?;
    Ok(metadata)
}

#[tauri::command]
pub async fn update_prompt(id: String, input: UpdatePromptInput) -> Result<PromptMetadata, AppError> {
    let uuid = Uuid::parse_str(&id).map_err(|_| AppError::PromptNotFound(id.clone()))?;
    let metadata = prompt_store::update_prompt(uuid, input)?;
    index::update_index_entry(metadata.clone())?;
    Ok(metadata)
}

#[tauri::command]
pub async fn delete_prompt(id: String) -> Result<(), AppError> {
    let uuid = Uuid::parse_str(&id).map_err(|_| AppError::PromptNotFound(id.clone()))?;
    prompt_store::delete_prompt(uuid)?;
    index::remove_index_entry(uuid)?;
    Ok(())
}

#[tauri::command]
pub async fn get_prompt_content(id: String) -> Result<String, AppError> {
    let uuid = Uuid::parse_str(&id).map_err(|_| AppError::PromptNotFound(id.clone()))?;
    prompt_store::get_prompt_content(uuid)
}

#[tauri::command]
pub async fn record_prompt_usage(id: String) -> Result<(), AppError> {
    let uuid = Uuid::parse_str(&id).map_err(|_| AppError::PromptNotFound(id.clone()))?;
    prompt_store::record_usage(uuid)?;
    index::update_usage_in_index(uuid)?;
    Ok(())
}

// ============ Folder Commands ============

#[tauri::command]
pub async fn create_folder(name: String) -> Result<(), AppError> {
    prompt_store::create_folder(&name)?;
    // Rebuild index to include new folder
    index::rebuild_index()?;
    Ok(())
}

#[tauri::command]
pub async fn list_folders() -> Result<Vec<String>, AppError> {
    prompt_store::list_folders()
}

// ============ Settings Commands ============

#[tauri::command]
pub async fn get_settings() -> Result<Settings, AppError> {
    settings::get_settings()
}

#[tauri::command]
pub async fn update_settings(new_settings: Settings) -> Result<Settings, AppError> {
    settings::update_settings(new_settings)
}

// ============ Search Commands ============

#[tauri::command]
pub async fn search_prompt_content(query: String) -> Result<Vec<PromptMetadata>, AppError> {
    use regex::RegexBuilder;

    let index = index::get_index()?;
    let mut results = Vec::new();

    // Build case-insensitive regex
    let regex = RegexBuilder::new(&regex::escape(&query))
        .case_insensitive(true)
        .build()
        .map_err(|_| AppError::InvalidPromptFile("Invalid search query".to_string()))?;

    for metadata in index.prompts {
        let uuid = metadata.id;
        if let Ok(content) = prompt_store::get_prompt_content(uuid) {
            if regex.is_match(&content) {
                results.push(metadata);
            }
        }
    }

    Ok(results)
}
