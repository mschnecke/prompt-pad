use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Prompt frontmatter stored in YAML header of .md files
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptFrontmatter {
    pub id: Uuid,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub created: DateTime<Utc>,
    #[serde(default)]
    pub use_count: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_used_at: Option<DateTime<Utc>>,
}

/// Full prompt including content (loaded on demand)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Prompt {
    #[serde(flatten)]
    pub frontmatter: PromptFrontmatter,
    pub content: String,
}

/// Metadata stored in index for fast search (no content)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptMetadata {
    pub id: Uuid,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub folder: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub file_path: String,
    #[serde(default)]
    pub use_count: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_used_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

/// The metadata index stored as JSON
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PromptIndex {
    pub version: u32,
    pub updated_at: DateTime<Utc>,
    pub prompts: Vec<PromptMetadata>,
    pub folders: Vec<String>,
    pub tags: Vec<String>,
}

impl Default for PromptIndex {
    fn default() -> Self {
        Self {
            version: 1,
            updated_at: Utc::now(),
            prompts: Vec::new(),
            folders: Vec::new(),
            tags: Vec::new(),
        }
    }
}

/// Application settings
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    #[serde(default = "default_hotkey")]
    pub hotkey: String,
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub storage_location: Option<String>,
    #[serde(default)]
    pub launch_at_startup: bool,
    #[serde(default)]
    pub preserve_clipboard: bool,
}

fn default_hotkey() -> String {
    #[cfg(target_os = "macos")]
    return "Cmd+Shift+Space".to_string();
    #[cfg(not(target_os = "macos"))]
    return "Ctrl+Shift+Space".to_string();
}

fn default_theme() -> String {
    "system".to_string()
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            hotkey: default_hotkey(),
            theme: default_theme(),
            storage_location: None,
            launch_at_startup: false,
            preserve_clipboard: false,
        }
    }
}

/// Input for creating a new prompt
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePromptInput {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub folder: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
}

/// Input for updating an existing prompt
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePromptInput {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub folder: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
}
