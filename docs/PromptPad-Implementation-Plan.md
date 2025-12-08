# PromptPad Implementation Plan

## Overview

PromptPad is a cross-platform Spotlight-style prompt launcher built with Tauri 2.x + React + TypeScript. Users invoke it via global hotkey, search their prompt library, optionally add "rider" context, and paste directly into their current application.

---

## Project Structure

```
pisum-prompt-pad/
├── src/                              # React Frontend
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes/
│   │       ├── launcher.tsx
│   │       ├── editor.tsx
│   │       └── settings.tsx
│   ├── components/
│   │   ├── ui/                       # Base UI primitives (Button, Input, Badge, etc.)
│   │   └── common/                   # PromptPill, TagInput, FolderSelect
│   ├── features/
│   │   ├── launcher/                 # LauncherWindow, SearchInput, ResultsList, RiderMode
│   │   ├── editor/                   # PromptEditor, MarkdownEditor, MetadataForm
│   │   ├── prompts/                  # Prompt API, hooks, types
│   │   └── settings/                 # SettingsPanel, tabs
│   ├── stores/                       # Zustand stores (app, search, settings)
│   ├── lib/                          # Tauri commands, fuzzy search, utilities
│   └── styles/                       # Tailwind, themes
│
├── src-tauri/                        # Rust Backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/                 # prompt, search, settings, focus
│   │   ├── storage/                  # prompt_store, index, settings
│   │   ├── search/                   # fuzzy, grep
│   │   ├── platform/                 # macos, windows native APIs
│   │   └── models/                   # prompt, settings structs
│   └── tauri.conf.json
│
├── tests/
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Implementation Phases

### Phase 1: Foundation
**Goal:** Skeleton app with hotkey activation and basic UI shell

| Task | Description |
|------|-------------|
| 1.1 | Initialize Tauri 2.x + React + TypeScript + Vite project |
| 1.2 | Configure Tailwind CSS + light/dark theming |
| 1.3 | Set up `tauri-plugin-global-shortcut` |
| 1.4 | Create frameless, floating launcher window |
| 1.5 | Implement window show/hide logic (Escape dismisses, hotkey toggles) |
| 1.6 | Add system tray integration |
| 1.7 | Set up Zustand stores |

**Milestone:** App activates with hotkey, displays empty launcher, dismisses with Escape.

---

### Phase 2: Storage & Data Layer
**Goal:** File-based prompt storage with metadata indexing

| Task | Description |
|------|-------------|
| 2.1 | Define prompt file format (.md + YAML frontmatter) |
| 2.2 | Implement Rust file I/O (read/write prompts) |
| 2.3 | Build metadata index (JSON file) |
| 2.4 | Create Tauri commands for prompt CRUD |
| 2.5 | Index rebuild on startup (no file watcher for v1) |
| 2.6 | Settings persistence (settings.json) |
| 2.7 | Default storage location setup (~/PromptPad/) |

**Milestone:** Create/edit/delete prompts persisted as .md files, index stays in sync.

---

### Phase 3: Search & Results
**Goal:** Fuzzy search with tiered priority and results display

| Task | Description |
|------|-------------|
| 3.1 | Integrate Fuse.js for client-side fuzzy search |
| 3.2 | Implement search input with 50ms debounce |
| 3.3 | Build results list component |
| 3.4 | Tiered search: name → tags/folder → description |
| 3.5 | Content grep fallback (Rust-based) |
| 3.6 | Usage-based scoring + recency bonus |
| 3.7 | Keyboard navigation (↑/↓ arrows) |

**Milestone:** Type to search, see ranked results, navigate with keyboard.

---

### Phase 4: Rider Mode & Paste
**Goal:** The signature feature - prompt promotion and context composition

| Task | Description |
|------|-------------|
| 4.1 | Implement prompt promotion (Space/Tab/→) |
| 4.2 | Design rider mode UI (pill + input) |
| 4.3 | Rider text input handling |
| 4.4 | Compose final text (prompt + rider) |
| 4.5 | Track previous focused app (platform-specific) |
| 4.6 | Clipboard write operation |
| 4.7 | Focus restoration + paste simulation (Cmd/Ctrl+V) |
| 4.8 | Fallback handling (notification if paste fails) |

**Milestone:** Full workflow: search → promote → add rider → paste into previous app.

---

### Phase 5: Prompt Editor
**Goal:** Full-featured WYSIWYG markdown editor

| Task | Description |
|------|-------------|
| 5.1 | Integrate Milkdown editor |
| 5.2 | Prompt metadata form (name, description) |
| 5.3 | Folder selection with create-new option |
| 5.4 | Tag input with autocomplete |
| 5.5 | Save/cancel with keyboard shortcuts (Cmd/Ctrl+S, Escape) |
| 5.6 | Create new prompt flow |
| 5.7 | Edit existing prompt flow |
| 5.8 | Delete prompt with confirmation |

**Milestone:** Create, edit, organize prompts with rich markdown editing.

---

### Phase 6: Settings & Polish
**Goal:** User configuration and refined UX

| Task | Description |
|------|-------------|
| 6.1 | Settings panel UI (tabbed: General, Appearance, Storage, About) |
| 6.2 | Hotkey customization |
| 6.3 | Theme selection (light/dark/system) |
| 6.4 | Storage location configuration |
| 6.5 | Launch at startup toggle |
| 6.6 | Keyboard shortcut reference |
| 6.7 | Animation polish (show/hide transitions) |
| 6.8 | Error handling & toast notifications |

**Milestone:** Fully configurable app with polished interactions.

---

### Phase 7: Platform & Release
**Goal:** Production-ready builds for Windows and macOS

| Task | Description |
|------|-------------|
| 7.1 | macOS accessibility permissions onboarding flow |
| 7.2 | macOS code signing + notarization |
| 7.3 | Windows WebView2 bundling (NSIS installer) |
| 7.4 | Auto-updater integration |
| 7.5 | Performance profiling & optimization |
| 7.6 | CI/CD pipeline (GitHub Actions) |
| 7.7 | Import/export functionality |
| 7.8 | Documentation |

**Milestone:** Signed, installable apps for both platforms with auto-update.

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Tauri 2.x |
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Fuzzy Search | Fuse.js |
| Markdown Editor | Milkdown |
| Global Hotkey | tauri-plugin-global-shortcut |
| Clipboard | tauri-plugin-clipboard-manager |
| Icons | Lucide React |

---

## Data Model

### File Structure
```
~/PromptPad/
├── prompts/
│   ├── coding/
│   │   └── code-review.md
│   ├── writing/
│   │   └── blog-outline.md
│   └── uncategorized/
├── index.json
└── settings.json
```

### Prompt File Format (.md)
```markdown
---
id: "uuid"
name: "Code Review Helper"
description: "Analyze code for issues"
tags: ["coding", "review"]
created: "2025-01-15T10:30:00Z"
use_count: 42
last_used_at: "2025-12-07T14:22:00Z"
---

Review the following code for:
- Potential bugs
- Performance issues
```

---

## Search Strategy

**Tier 1 (In-Memory):** Fuse.js searches name, tags, folder, description with weighted keys

**Tier 2 (Fallback):** Rust-based content grep when metadata search yields few results

**Scoring:**
```
score = (fuse_score × 0.6) + (usage_score × 0.3) + (recency_score × 0.1)
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Hotkey → Window | < 100ms |
| Metadata search | < 50ms |
| Content grep | < 500ms (10k prompts) |
| Memory (idle) | < 50MB |
| Binary size | < 10MB |

---

## Critical Files

1. **`src-tauri/src/main.rs`** - Tauri entry, plugin registration, window config
2. **`src/features/launcher/components/LauncherWindow.tsx`** - Core launcher UI
3. **`src-tauri/src/commands/focus.rs`** - Focus restoration, paste simulation (highest risk)
4. **`src-tauri/src/storage/index.rs`** - Metadata index management
5. **`src/stores/appStore.ts`** - Central Zustand state

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Focus restoration fails | Fallback to clipboard-only with notification |
| Paste simulation blocked | Detect failure, show "copied to clipboard" toast |
| Hotkey conflicts | Detect at registration, suggest alternatives |
| Large library slowdown | Index-only search, lazy content loading |
| macOS permission denied | Clear onboarding flow at first use |

---

## Key Decisions (v1)

- **Backend:** Rust (native Tauri)
- **File watching:** Disabled (manual refresh only)
- **Favorites/pinned:** Deferred to v2
