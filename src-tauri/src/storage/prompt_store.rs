use crate::error::AppError;
use crate::models::{CreatePromptInput, Prompt, PromptFrontmatter, PromptMetadata, UpdatePromptInput};
use crate::storage::get_storage_path;
use chrono::Utc;
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;
use walkdir::WalkDir;

const FRONTMATTER_DELIMITER: &str = "---";

/// Parse a prompt file into frontmatter and content
fn parse_prompt_file(content: &str) -> Result<(PromptFrontmatter, String), AppError> {
    let content = content.trim();

    if !content.starts_with(FRONTMATTER_DELIMITER) {
        return Err(AppError::InvalidPromptFile(
            "Missing frontmatter delimiter".to_string(),
        ));
    }

    let after_first = &content[FRONTMATTER_DELIMITER.len()..];
    let end_idx = after_first
        .find(FRONTMATTER_DELIMITER)
        .ok_or_else(|| AppError::InvalidPromptFile("Missing closing frontmatter delimiter".to_string()))?;

    let yaml_content = &after_first[..end_idx].trim();
    let body = &after_first[end_idx + FRONTMATTER_DELIMITER.len()..].trim();

    let frontmatter: PromptFrontmatter = serde_yaml::from_str(yaml_content)?;

    Ok((frontmatter, body.to_string()))
}

/// Serialize a prompt to file content
fn serialize_prompt(frontmatter: &PromptFrontmatter, content: &str) -> Result<String, AppError> {
    let yaml = serde_yaml::to_string(frontmatter)?;
    Ok(format!(
        "{}\n{}{}\n\n{}",
        FRONTMATTER_DELIMITER,
        yaml,
        FRONTMATTER_DELIMITER,
        content
    ))
}

/// Generate a safe filename from the prompt name
fn sanitize_filename(name: &str) -> String {
    name.chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' || c == ' ' {
                c
            } else {
                '-'
            }
        })
        .collect::<String>()
        .to_lowercase()
        .replace(' ', "-")
        .chars()
        .take(50)
        .collect()
}

/// Get the prompts directory path
pub fn get_prompts_dir() -> PathBuf {
    get_storage_path().join("prompts")
}

/// Read a prompt file by its path
pub fn read_prompt(file_path: &Path) -> Result<Prompt, AppError> {
    let content = fs::read_to_string(file_path)?;
    let (frontmatter, body) = parse_prompt_file(&content)?;

    Ok(Prompt {
        frontmatter,
        content: body,
    })
}

/// Read a prompt by ID (searches all folders)
pub fn read_prompt_by_id(id: Uuid) -> Result<(Prompt, PathBuf), AppError> {
    let prompts_dir = get_prompts_dir();

    for entry in WalkDir::new(&prompts_dir)
        .min_depth(1)
        .max_depth(2)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if entry.path().extension().map_or(false, |ext| ext == "md") {
            if let Ok(prompt) = read_prompt(entry.path()) {
                if prompt.frontmatter.id == id {
                    return Ok((prompt, entry.path().to_path_buf()));
                }
            }
        }
    }

    Err(AppError::PromptNotFound(id.to_string()))
}

/// Create a new prompt
pub fn create_prompt(input: CreatePromptInput) -> Result<PromptMetadata, AppError> {
    let id = Uuid::new_v4();
    let now = Utc::now();

    let frontmatter = PromptFrontmatter {
        id,
        name: input.name.clone(),
        description: input.description.clone(),
        tags: input.tags.clone(),
        created: now,
        use_count: 0,
        last_used_at: None,
    };

    // Determine folder
    let folder = input.folder.clone().unwrap_or_else(|| "uncategorized".to_string());
    let folder_path = get_prompts_dir().join(&folder);

    // Create folder if it doesn't exist
    fs::create_dir_all(&folder_path)?;

    // Generate filename
    let filename = format!("{}.md", sanitize_filename(&input.name));
    let file_path = folder_path.join(&filename);

    // Serialize and write
    let content = serialize_prompt(&frontmatter, &input.content)?;
    fs::write(&file_path, content)?;

    // Return metadata
    let relative_path = format!("prompts/{}/{}", folder, filename);

    Ok(PromptMetadata {
        id,
        name: input.name,
        description: input.description,
        folder: Some(folder),
        tags: input.tags,
        file_path: relative_path,
        use_count: 0,
        last_used_at: None,
        created_at: now,
    })
}

/// Update an existing prompt
pub fn update_prompt(id: Uuid, input: UpdatePromptInput) -> Result<PromptMetadata, AppError> {
    let (mut prompt, file_path) = read_prompt_by_id(id)?;

    // Update fields if provided
    if let Some(name) = input.name {
        prompt.frontmatter.name = name;
    }
    if let Some(description) = input.description {
        prompt.frontmatter.description = Some(description);
    }
    if let Some(content) = input.content {
        prompt.content = content;
    }
    if let Some(tags) = input.tags {
        prompt.frontmatter.tags = tags;
    }

    // Handle folder change
    let new_file_path = if let Some(new_folder) = input.folder {
        let new_folder_path = get_prompts_dir().join(&new_folder);
        fs::create_dir_all(&new_folder_path)?;

        let filename = file_path.file_name().unwrap();
        let new_path = new_folder_path.join(filename);

        // Move file
        if new_path != file_path {
            fs::rename(&file_path, &new_path)?;
        }

        new_path
    } else {
        file_path.clone()
    };

    // Write updated content
    let content = serialize_prompt(&prompt.frontmatter, &prompt.content)?;
    fs::write(&new_file_path, content)?;

    // Extract folder from path
    let folder = new_file_path
        .parent()
        .and_then(|p| p.file_name())
        .map(|s| s.to_string_lossy().to_string());

    let relative_path = new_file_path
        .strip_prefix(get_storage_path())
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| new_file_path.to_string_lossy().to_string());

    Ok(PromptMetadata {
        id: prompt.frontmatter.id,
        name: prompt.frontmatter.name,
        description: prompt.frontmatter.description,
        folder,
        tags: prompt.frontmatter.tags,
        file_path: relative_path,
        use_count: prompt.frontmatter.use_count,
        last_used_at: prompt.frontmatter.last_used_at,
        created_at: prompt.frontmatter.created,
    })
}

/// Delete a prompt by ID
pub fn delete_prompt(id: Uuid) -> Result<(), AppError> {
    let (_, file_path) = read_prompt_by_id(id)?;
    fs::remove_file(file_path)?;
    Ok(())
}

/// Record usage of a prompt
pub fn record_usage(id: Uuid) -> Result<(), AppError> {
    let (mut prompt, file_path) = read_prompt_by_id(id)?;

    prompt.frontmatter.use_count += 1;
    prompt.frontmatter.last_used_at = Some(Utc::now());

    let content = serialize_prompt(&prompt.frontmatter, &prompt.content)?;
    fs::write(file_path, content)?;

    Ok(())
}

/// Get prompt content by ID
pub fn get_prompt_content(id: Uuid) -> Result<String, AppError> {
    let (prompt, _) = read_prompt_by_id(id)?;
    Ok(prompt.content)
}

/// Scan all prompts and return metadata
pub fn scan_prompts() -> Result<Vec<PromptMetadata>, AppError> {
    let prompts_dir = get_prompts_dir();
    let mut prompts = Vec::new();

    if !prompts_dir.exists() {
        return Ok(prompts);
    }

    for entry in WalkDir::new(&prompts_dir)
        .min_depth(1)
        .max_depth(2)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if path.extension().map_or(false, |ext| ext == "md") {
            if let Ok(prompt) = read_prompt(path) {
                let folder = path
                    .parent()
                    .and_then(|p| p.file_name())
                    .map(|s| s.to_string_lossy().to_string());

                let relative_path = path
                    .strip_prefix(get_storage_path())
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_else(|_| path.to_string_lossy().to_string());

                prompts.push(PromptMetadata {
                    id: prompt.frontmatter.id,
                    name: prompt.frontmatter.name,
                    description: prompt.frontmatter.description,
                    folder,
                    tags: prompt.frontmatter.tags,
                    file_path: relative_path,
                    use_count: prompt.frontmatter.use_count,
                    last_used_at: prompt.frontmatter.last_used_at,
                    created_at: prompt.frontmatter.created,
                });
            }
        }
    }

    Ok(prompts)
}

/// Create a new folder
pub fn create_folder(name: &str) -> Result<(), AppError> {
    let folder_path = get_prompts_dir().join(name);
    fs::create_dir_all(folder_path)?;
    Ok(())
}

/// List all folders
pub fn list_folders() -> Result<Vec<String>, AppError> {
    let prompts_dir = get_prompts_dir();
    let mut folders = Vec::new();

    if !prompts_dir.exists() {
        return Ok(folders);
    }

    for entry in fs::read_dir(prompts_dir)? {
        let entry = entry?;
        if entry.file_type()?.is_dir() {
            if let Some(name) = entry.file_name().to_str() {
                folders.push(name.to_string());
            }
        }
    }

    folders.sort();
    Ok(folders)
}
