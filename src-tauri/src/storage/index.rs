use crate::error::AppError;
use crate::models::{PromptIndex, PromptMetadata};
use crate::storage::{get_storage_path, prompt_store};
use chrono::Utc;
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use std::sync::RwLock;

static INDEX: RwLock<Option<PromptIndex>> = RwLock::new(None);

/// Get the index file path
fn get_index_path() -> PathBuf {
    get_storage_path().join("index.json")
}

/// Load index from disk
pub fn load_index() -> Result<PromptIndex, AppError> {
    let index_path = get_index_path();

    if index_path.exists() {
        let content = fs::read_to_string(&index_path)?;
        let index: PromptIndex = serde_json::from_str(&content)?;
        Ok(index)
    } else {
        Ok(PromptIndex::default())
    }
}

/// Save index to disk
pub fn save_index(index: &PromptIndex) -> Result<(), AppError> {
    let index_path = get_index_path();
    let content = serde_json::to_string_pretty(index)?;
    fs::write(index_path, content)?;
    Ok(())
}

/// Rebuild index from prompt files
pub fn rebuild_index() -> Result<PromptIndex, AppError> {
    let prompts = prompt_store::scan_prompts()?;

    // Collect unique folders and tags
    let mut folders: HashSet<String> = HashSet::new();
    let mut tags: HashSet<String> = HashSet::new();

    for prompt in &prompts {
        if let Some(folder) = &prompt.folder {
            folders.insert(folder.clone());
        }
        for tag in &prompt.tags {
            tags.insert(tag.clone());
        }
    }

    let mut folder_list: Vec<String> = folders.into_iter().collect();
    folder_list.sort();

    let mut tag_list: Vec<String> = tags.into_iter().collect();
    tag_list.sort();

    let index = PromptIndex {
        version: 1,
        updated_at: Utc::now(),
        prompts,
        folders: folder_list,
        tags: tag_list,
    };

    // Save to disk
    save_index(&index)?;

    // Update in-memory cache
    if let Ok(mut guard) = INDEX.write() {
        *guard = Some(index.clone());
    }

    Ok(index)
}

/// Get the current index (from cache or disk)
pub fn get_index() -> Result<PromptIndex, AppError> {
    // Try cache first
    if let Ok(guard) = INDEX.read() {
        if let Some(index) = guard.as_ref() {
            return Ok(index.clone());
        }
    }

    // Load from disk
    let index = load_index()?;

    // Update cache
    if let Ok(mut guard) = INDEX.write() {
        *guard = Some(index.clone());
    }

    Ok(index)
}

/// Update index with a new or modified prompt
pub fn update_index_entry(metadata: PromptMetadata) -> Result<(), AppError> {
    let mut index = get_index()?;

    // Remove existing entry if present
    index.prompts.retain(|p| p.id != metadata.id);

    // Add new/updated entry
    index.prompts.push(metadata.clone());

    // Update folders and tags
    if let Some(folder) = &metadata.folder {
        if !index.folders.contains(folder) {
            index.folders.push(folder.clone());
            index.folders.sort();
        }
    }

    for tag in &metadata.tags {
        if !index.tags.contains(tag) {
            index.tags.push(tag.clone());
            index.tags.sort();
        }
    }

    index.updated_at = Utc::now();

    // Save and update cache
    save_index(&index)?;

    if let Ok(mut guard) = INDEX.write() {
        *guard = Some(index);
    }

    Ok(())
}

/// Remove a prompt from the index
pub fn remove_index_entry(id: uuid::Uuid) -> Result<(), AppError> {
    let mut index = get_index()?;

    index.prompts.retain(|p| p.id != id);
    index.updated_at = Utc::now();

    // Save and update cache
    save_index(&index)?;

    if let Ok(mut guard) = INDEX.write() {
        *guard = Some(index);
    }

    Ok(())
}

/// Update usage stats in index
pub fn update_usage_in_index(id: uuid::Uuid) -> Result<(), AppError> {
    let mut index = get_index()?;

    if let Some(prompt) = index.prompts.iter_mut().find(|p| p.id == id) {
        prompt.use_count += 1;
        prompt.last_used_at = Some(Utc::now());
    }

    index.updated_at = Utc::now();

    // Save and update cache
    save_index(&index)?;

    if let Ok(mut guard) = INDEX.write() {
        *guard = Some(index);
    }

    Ok(())
}
