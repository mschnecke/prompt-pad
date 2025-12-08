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
│   ├── components/           # UI components
│   │   ├── Launcher.tsx      # Main launcher overlay with search
│   │   ├── PromptEditor.tsx  # Create/edit prompt form
│   │   ├── PromptManager.tsx # Full-screen prompt management
│   │   ├── Settings.tsx      # App settings panel
│   │   ├── SearchInput.tsx   # Search input with rider mode
│   │   ├── ResultsList.tsx   # Search results display
│   │   ├── TagInput.tsx      # Tag input with autocomplete
│   │   └── FolderSelect.tsx  # Folder dropdown selector
│   ├── stores/               # Zustand state stores
│   │   ├── appStore.ts       # App settings state
│   │   ├── promptStore.ts    # Prompt CRUD operations
│   │   └── launcherStore.ts  # Launcher UI state
│   ├── utils/                # Utilities
│   │   ├── storage.ts        # File I/O (prompts, index, settings)
│   │   ├── search.ts         # Fuse.js search integration
│   │   ├── clipboard.ts      # Clipboard operations
│   │   └── frontmatter.ts    # YAML frontmatter parsing
│   └── types/                # TypeScript interfaces
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── lib.rs            # Main Tauri setup + tray menu
│   │   ├── commands.rs       # Tauri commands
│   │   └── focus.rs          # Focus tracking/restoration
│   ├── capabilities/         # Tauri permissions
│   └── Cargo.toml
└── docs/                     # Documentation
```

## Technology Stack

- **Framework:** Tauri 2.x (Rust backend, WebView frontend)
- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **State:** Zustand
- **Search:** Fuse.js (fuzzy search)
- **Plugins:** global-shortcut, clipboard-manager, positioner, autostart, fs

## Architecture

### File-Based Storage

Prompts stored as `.md` files with YAML frontmatter in `~/PromptPad/`:

```
~/PromptPad/
├── prompts/
│   ├── coding/
│   │   └── code-review.md
│   └── uncategorized/
├── index.json
└── settings.json
```

### State Management

- `appStore` - App settings and initialization state
- `promptStore` - Prompt data and CRUD operations
- `launcherStore` - Launcher UI state (mode, query, results)

### Key Interaction Pattern

- **Search mode:** typing filters prompts via Fuse.js
- **Rider mode:** after promoting a prompt (Space/Tab/→), typing appends context
- Final paste: `[prompt content]` + `[rider text]`

### Platform-Specific Code

Focus tracking and paste simulation in `src-tauri/src/focus.rs`:
- **macOS:** NSWorkspace for app tracking, CGEvent for paste simulation
- **Windows:** GetForegroundWindow/SetForegroundWindow, SendInput for paste

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

## Performance Targets

- Launcher appears within 100ms of hotkey
- Search results within 50ms
- Memory under 50MB idle
- Binary under 10MB
