# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptPad is a Spotlight-style prompt launcher for Windows and macOS built with Tauri 2.x + React + TypeScript. Users invoke it via global hotkey, search their prompt library, optionally add "rider" context, and paste directly into their current application.

## Commands

```bash
# Install dependencies
npm install

# Run in development mode (starts both Vite dev server and Tauri)
npm run tauri dev

# Build for production
npm run tauri build

# Type check
npm run build  # runs tsc && vite build

# Rust only (from src-tauri/)
cargo build
cargo check
```

Built applications output to `src-tauri/target/release/bundle/`.

## Architecture

### Frontend (React + TypeScript)

- **App.tsx** - Root component with view routing (launcher/editor/settings) and window resizing
- **stores/appStore.ts** - Central Zustand store managing view state, search state, and rider mode
- **features/** - Feature-based organization:
  - `launcher/` - Main launcher window with search and results
  - `editor/` - Prompt creation/editing with Milkdown markdown editor
  - `settings/` - Application settings panel
- **lib/tauri/** - Tauri command bindings and TypeScript types
- **lib/search/** - Fuse.js fuzzy search with weighted scoring

### Backend (Rust/Tauri)

- **lib.rs** - Tauri app setup: plugin registration, global shortcut (Cmd/Ctrl+Shift+Space), tray icon, storage initialization
- **commands/mod.rs** - All Tauri commands exposed to frontend (prompt CRUD, settings, search)
- **models/mod.rs** - Data structures: `PromptMetadata`, `PromptIndex`, `Settings`, input types
- **storage/** - File-based persistence:
  - `prompt_store.rs` - Markdown file I/O with YAML frontmatter
  - `index.rs` - JSON metadata index for fast search
  - `settings.rs` - Settings persistence
- **platform/** - OS-specific code for focus restoration and paste simulation (macos.rs, windows.rs)

### Data Flow

1. Prompts stored as `.md` files with YAML frontmatter in `~/PromptPad/prompts/`
2. Metadata index (`index.json`) rebuilt on startup for fast search
3. Fuse.js searches metadata (name, tags, folder, description)
4. Content grep fallback via Rust when metadata search yields few results
5. Rider mode composes prompt + user context before pasting

## Key Patterns

- **View modes**: App switches between launcher/editor/settings with window resizing
- **Rider mode**: User promotes a prompt, adds context text, then pastes combined result
- **Lazy loading**: Editor and Settings components loaded via React.lazy()
- **Platform abstraction**: `platform/` module handles macOS/Windows differences for focus tracking and paste simulation

## Tauri Commands

Frontend calls these via `@tauri-apps/api`:

- `get_prompt_index`, `rebuild_prompt_index` - Index operations
- `create_prompt`, `update_prompt`, `delete_prompt` - CRUD
- `get_prompt_content` - Load full prompt content
- `record_prompt_usage` - Track usage stats
- `create_folder`, `list_folders` - Folder management
- `get_settings`, `update_settings` - Settings
- `search_prompt_content` - Rust-based content grep
- `show_launcher`, `hide_launcher`, `paste_and_hide` - Window control

## Prompt File Format

```markdown
---
id: "uuid"
name: "Prompt Name"
description: "Optional description"
tags: ["tag1", "tag2"]
created: "2025-01-15T10:30:00Z"
use_count: 42
last_used_at: "2025-12-07T14:22:00Z"
---

Prompt content in markdown...
```
