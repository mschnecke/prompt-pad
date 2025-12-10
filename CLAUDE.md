# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptPad is a Spotlight-style prompt launcher for Windows and macOS. Users invoke a global hotkey overlay, search their prompt library, optionally add "rider text" context, and paste directly into the previously focused application.

## Commands

```bash
# Development
npm run dev          # Start Vite dev server (frontend only)
npm run tauri dev    # Start full Tauri app in dev mode

# Building
npm run build        # Build frontend (TypeScript + Vite)
npm run tauri build  # Build full Tauri app for release

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run format:check # Check formatting

# Testing
npm run test         # Run Vitest in watch mode
npm run test:run     # Run tests once
```

## Project Structure

```
prompt-pad/
├── src/                      # React frontend
│   ├── components/           # UI components (12 total)
│   │   ├── Launcher.tsx      # Main launcher overlay with search
│   │   ├── PromptEditor.tsx  # Create/edit prompt form
│   │   ├── PromptManager.tsx # Full-screen prompt management
│   │   ├── Settings.tsx      # App settings panel (tabbed)
│   │   ├── SearchInput.tsx   # Search input with rider mode
│   │   ├── ResultsList.tsx   # Search results display
│   │   ├── PromptItem.tsx    # Individual prompt display
│   │   ├── TagInput.tsx      # Tag input with autocomplete
│   │   ├── FolderSelect.tsx  # Folder dropdown with inline creation
│   │   ├── MarkdownEditor.tsx # TipTap WYSIWYG editor with toolbar
│   │   ├── RiderPreview.tsx  # Prompt + rider text preview
│   │   └── ImportExport.tsx  # Import/export dialog
│   ├── stores/               # Zustand state stores
│   │   ├── appStore.ts       # App settings and initialization
│   │   ├── promptStore.ts    # Prompt CRUD operations
│   │   └── launcherStore.ts  # Launcher UI state
│   ├── utils/                # Utilities
│   │   ├── storage.ts        # File I/O (prompts, index, settings)
│   │   ├── search.ts         # Fuse.js search with weighted scoring
│   │   ├── clipboard.ts      # Clipboard operations
│   │   ├── frontmatter.ts    # YAML frontmatter parsing
│   │   ├── shortcuts.ts      # Global shortcut registration
│   │   ├── importExport.ts   # Bulk import/export functionality
│   │   └── initialize.ts     # App initialization and theme setup
│   ├── hooks/                # Custom React hooks
│   │   ├── useDebounce.ts    # Debounce hook for search
│   │   └── useKeyboardNavigation.ts # Keyboard navigation hook
│   └── types/                # TypeScript interfaces
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── lib.rs            # Main Tauri setup + tray menu
│   │   ├── commands.rs       # Tauri commands (show/hide, paste, focus)
│   │   ├── focus.rs          # Focus tracking/restoration
│   │   └── main.rs           # Entry point
│   ├── capabilities/         # Tauri permissions
│   └── Cargo.toml
└── docs/                     # Documentation
```

## Technology Stack

- **Framework:** Tauri 2.x (Rust backend, WebView frontend)
- **Frontend:** React 18.3 + TypeScript 5.6 + Tailwind CSS 3.4
- **State:** Zustand 5.0
- **Search:** Fuse.js 7.0 (fuzzy search with weighted scoring)
- **Editor:** TipTap 3.13 (WYSIWYG markdown editor)
- **Tauri Plugins:** global-shortcut, clipboard-manager, positioner, autostart, fs, dialog, shell

## Architecture

### File-Based Storage

Prompts stored as `.md` files with YAML frontmatter. Default location is `~/.prompt-pad/` (configurable in settings):

```
~/.prompt-pad/              # Default storage (configurable)
├── prompts/
│   ├── coding/
│   │   └── code-review.md
│   └── uncategorized/
└── index.json              # Prompt metadata for fast search

~/.prompt-pad.json          # App settings (always in home dir)
```

Prompt file format:
```markdown
---
id: "uuid"
name: "Code Review"
description: "Review code for issues"
tags: ["coding", "review"]
folder: "coding"
created: "2025-01-15T10:30:00Z"
useCount: 42
lastUsedAt: "2025-12-07T14:22:00Z"
---

Review the following code for potential issues...
```

### State Management

- `appStore` - App settings and initialization state
- `promptStore` - Prompt data and CRUD operations
- `launcherStore` - Launcher UI state (mode, query, results)

### Key Interaction Pattern

- **Search mode:** typing filters prompts via Fuse.js
- **Rider mode:** after promoting a prompt (Space/Tab/→), typing appends context
- Final paste: `[prompt content]` + `[rider text]`

### Search Algorithm

Fuse.js with weighted field scoring:
- `name`: 0.5 (highest priority)
- `tags`: 0.25
- `folder`: 0.15
- `description`: 0.1

Results also sorted by usage frequency (`useCount`) for relevance.

### Platform-Specific Code

Focus tracking and paste simulation in `src-tauri/src/focus.rs`:
- **macOS:** AppleScript for app tracking, CGEvent for paste simulation
- **Windows:** GetForegroundWindow/SetForegroundWindow, SendInput for paste

Tray icons:
- **macOS:** Template icon (system-colored)
- **Windows:** Colored icon

## Keyboard Shortcuts

### Launcher
| Key | Action |
|-----|--------|
| `Cmd+Shift+P` / `Ctrl+Shift+P` | Toggle launcher |
| `↑` / `↓` | Navigate results |
| `Enter` | Paste selected prompt |
| `Tab` / `→` / `Space` | Promote prompt (enter rider mode) |
| `Backspace` (rider mode) | Clear rider, return to search |
| `Escape` | Dismiss launcher |
| `Cmd+N` / `Ctrl+N` | Create new prompt |
| `Cmd+M` / `Ctrl+M` | Open prompt manager |
| `Cmd+,` / `Ctrl+,` | Open settings |

### Editor
| Key | Action |
|-----|--------|
| `Cmd+S` / `Ctrl+S` | Save prompt |
| `Escape` | Cancel and close |

## System Tray Menu

- **Manage Prompts** - Opens prompt manager
- **Settings** - Opens settings panel
- **Quit** - Exit application

## Settings

Available in Settings panel (tabbed interface):

- **General:** Launch at startup, hotkey configuration (with recording)
- **Appearance:** Theme (light/dark/system)
- **Storage:** Storage location picker with migration, index rebuild
- **About:** Version info

## Features

- **Import/Export:** Bulk import markdown files or JSON, bulk export to JSON
- **Inline Folder Creation:** Create folders directly from the editor dropdown
- **Usage Tracking:** Tracks `useCount` and `lastUsedAt` for frequency-based sorting
- **Tag Autocomplete:** Real-time suggestions from all existing tags
- **Delete Confirmation:** Styled confirmation dialog for destructive actions

## Performance Targets

- Launcher appears within 100ms of hotkey
- Search results within 50ms
- Memory under 50MB idle
- Binary under 10MB
