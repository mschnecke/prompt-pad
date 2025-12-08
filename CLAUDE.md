# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptPad is a cross-platform desktop application that provides instant access to a personal prompt library via global hotkey. Built with Tauri 2.x (Rust backend + React/TypeScript frontend), it targets Windows 10/11 and macOS 10.15+.

## Technology Stack

- **Framework:** Tauri 2.x
- **Frontend:** React with TypeScript
- **Backend:** Rust
- **Global Hotkey:** `tauri-plugin-global-shortcut`
- **Markdown Editor:** Milkdown, TipTap, or similar

## Build Commands

Once the project is scaffolded:

```bash
# Development
npm run tauri dev        # Run in development mode with hot reload

# Production build
npm run tauri build      # Build for current platform

# Frontend only
npm run dev              # Run frontend dev server
npm run build            # Build frontend

# Rust backend
cargo build              # Build Rust backend
cargo test               # Run Rust tests
cargo clippy             # Lint Rust code
```

## Architecture

### Core Features

1. **Global hotkey activation** - Floating overlay launcher (default: `Cmd+Shift+Space` / `Ctrl+Shift+Space`)
2. **Instant fuzzy search** - Priority: name → tags/folder → description → content (file grep)
3. **Prompt promotion + rider context** - Compose prompts with additional context on-the-fly
4. **Paste into previous app** - Track focus, restore, simulate paste

### Data Storage

File-based storage at `~/PromptPad/`:

```
~/PromptPad/
├── prompts/           # Individual .md files with YAML frontmatter
│   └── [folders]/     # Single-level folder organization
├── index.json         # Metadata index (or SQLite)
└── settings.json
```

### Prompt File Format

```markdown
---
name: Prompt Name
description: Optional description
tags: [tag1, tag2]
created: 2025-01-15T10:30:00Z
---

Prompt content here...
```

## Performance Targets

- Launcher appears: <100ms from hotkey
- Metadata search: <50ms
- Content grep: <500ms for 10,000 prompts
- Memory: <50MB idle
- Binary: <10MB

## Platform Notes

**macOS:** Requires Accessibility permissions. Code signing and notarization needed for distribution.

**Windows:** WebView2 runtime required (bundled for Win10). Uses NSIS/WiX installer.
