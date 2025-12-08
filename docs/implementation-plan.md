# PromptPad Implementation Plan

This document outlines the phased implementation plan for PromptPad v1.0 based on the PRD.

---

## Phase 1: Project Foundation

### 1.1 Project Setup

- [ ] Initialize Tauri 2.x project with React + TypeScript template
- [ ] Configure project structure:
  ```
  prompt-pad/
  ├── src/                    # React frontend
  │   ├── components/
  │   ├── hooks/
  │   ├── stores/
  │   ├── types/
  │   └── utils/
  ├── src-tauri/              # Rust backend
  │   ├── src/
  │   └── Cargo.toml
  ├── package.json
  └── tauri.conf.json
  ```
- [ ] Set up development tooling:
  - ESLint + Prettier for frontend
  - Rust fmt + Clippy for backend
  - Vitest for frontend unit tests
  - Tauri's test utilities for integration tests
- [ ] Configure Tauri plugins:
  - `tauri-plugin-global-shortcut` for hotkeys
  - `tauri-plugin-clipboard-manager` for clipboard operations
  - `tauri-plugin-positioner` for window positioning
  - `tauri-plugin-autostart` for launch at startup

### 1.2 Core Types & Data Model

- [ ] Define TypeScript interfaces:
  ```typescript
  interface Prompt {
    id: string;
    name: string;
    description?: string;
    folder?: string;
    tags: string[];
    filePath: string;
    useCount: number;
    lastUsedAt?: Date;
    createdAt: Date;
  }

  interface Settings {
    hotkey: string;
    launchAtStartup: boolean;
    theme: 'light' | 'dark' | 'system';
    storageLocation: string;
    preserveClipboard: boolean;
  }
  ```
- [ ] Define Rust structs mirroring TypeScript types
- [ ] Implement serialization/deserialization for prompt frontmatter (YAML)

---

## Phase 2: Storage Layer

### 2.1 File System Operations

- [ ] Implement prompt directory initialization (`~/PromptPad/prompts/`)
- [ ] Create prompt file reader:
  - Parse YAML frontmatter
  - Extract markdown content
  - Handle malformed files gracefully
- [ ] Create prompt file writer:
  - Generate frontmatter from metadata
  - Preserve content formatting
  - Atomic writes to prevent corruption
- [ ] Implement folder management:
  - Create folder (creates directory)
  - Rename folder (moves files)
  - Delete folder (moves prompts to uncategorized)

### 2.2 Metadata Index

- [ ] Design index structure (JSON for v1, SQLite optional):
  ```json
  {
    "version": 1,
    "prompts": [...],
    "lastUpdated": "2025-01-15T10:30:00Z"
  }
  ```
- [ ] Implement index operations:
  - Load index on startup
  - Add/update/remove prompt entries
  - Persist index changes with debouncing
- [ ] Implement index rebuilding:
  - Scan prompts directory
  - Parse all prompt files
  - Rebuild index from scratch
- [ ] Track usage statistics:
  - Increment use count
  - Update last used timestamp

### 2.3 Settings Persistence

- [ ] Implement settings file (`settings.json`):
  - Load with defaults on missing file
  - Validate and migrate schema versions
  - Save on changes

---

## Phase 3: Search Engine

### 3.1 In-Memory Search

- [ ] Build search index from metadata:
  - Index prompt names (primary)
  - Index tags and folders (secondary)
  - Index descriptions (tertiary)
- [ ] Implement fuzzy matching algorithm:
  - Use Fuse.js or similar library
  - Configure thresholds for typo tolerance
  - Weight fields by priority
- [ ] Implement search result scoring:
  ```
  score = fuzzy_match_score * weight + usage_score
  usage_score = use_count + recency_bonus
  recency_bonus = max(0, 10 - days_since_last_use)
  ```
- [ ] Add 50ms debounce for search input

### 3.2 Content Search (Fallback)

- [ ] Implement file-based content grep:
  - Use Rust for performance
  - Search prompt content when metadata search yields few results
  - Limit to first N matches for performance
- [ ] Merge and deduplicate results from metadata and content search

---

## Phase 4: Core UI Components

### 4.1 Launcher Window

- [ ] Configure window properties:
  - Frameless, transparent background
  - Always on top
  - 650px wide, dynamic height (max 400px)
  - Centered on active monitor
- [ ] Implement search input component:
  - Large text input (18px)
  - Auto-focus on window show
  - Clear button
- [ ] Implement results list:
  - Virtual scrolling for performance
  - Show: name, folder badge, tag pills
  - Keyboard navigation highlight
  - Max 10 visible items

### 4.2 Prompt Result Item

- [ ] Design result item layout:
  - Prompt name (primary text)
  - Folder badge (colored chip)
  - Tags (smaller pills)
  - Usage indicator (optional)
- [ ] Implement hover preview (optional):
  - Show first ~200 chars of content
  - Delay before showing (200ms)

### 4.3 Rider Mode UI

- [ ] Implement promoted prompt pill:
  - Distinct colored background (blue)
  - Truncate long names with ellipsis
  - Remove button (×) or backspace to remove
- [ ] Implement rider text input:
  - Appears after pill in same input area
  - Different visual treatment from search
- [ ] Implement preview panel:
  - Show full prompt content + rider text
  - Replace results list in rider mode
  - Live preview of what will be pasted

---

## Phase 5: Keyboard Navigation & Interactions

### 5.1 Search Mode Navigation

- [ ] Implement keyboard handlers:
  - `↑`/`↓`: Navigate results
  - `Enter`: Select and paste
  - `Space`/`Tab`/`→`: Promote highlighted prompt
  - `Escape`: Dismiss launcher
- [ ] Implement selection state:
  - Track highlighted index
  - Wrap at list boundaries (optional)
  - Scroll to keep selection visible

### 5.2 Rider Mode Navigation

- [ ] Implement rider mode keyboard handlers:
  - `Enter`: Paste promoted content + rider text
  - `Escape`: Dismiss launcher
  - `Backspace` (on empty): Remove pill, return to search
- [ ] Manage mode transitions:
  - Search → Rider: on promote action
  - Rider → Search: on pill removal

### 5.3 Global Hotkey

- [ ] Register global hotkey on app start:
  - Default: `Cmd+Shift+Space` (macOS), `Ctrl+Shift+Space` (Windows)
  - Handle registration failures gracefully
- [ ] Implement hotkey handler:
  - Capture previous focused app (platform-specific)
  - Show launcher window
  - Focus search input

---

## Phase 6: Clipboard & Focus Management

### 6.1 Clipboard Operations

- [ ] Implement clipboard write:
  - Copy combined prompt + rider text
  - Handle rich text (optional, plain text for v1)
- [ ] Implement clipboard preservation (optional setting):
  - Save current clipboard before paste
  - Restore after small delay

### 6.2 Focus Restoration & Paste

- [ ] Implement focus tracking:
  - **macOS**: Use `NSWorkspace` to track frontmost app
  - **Windows**: Use `GetForegroundWindow` API
- [ ] Implement paste simulation:
  - Hide launcher window
  - Restore focus to previous app
  - Simulate `Cmd/Ctrl+V` keystroke
  - **macOS**: Use CGEvent or Accessibility API
  - **Windows**: Use SendInput API
- [ ] Implement fallback:
  - If paste fails, show notification
  - Content remains in clipboard

---

## Phase 7: Prompt Management UI

### 7.1 Prompt Editor

- [ ] Implement editor dialog/view:
  - Name input field
  - Description input (single line)
  - Folder dropdown (with "Create new" option)
  - Tag input with autocomplete
  - Markdown content editor
- [ ] Integrate markdown editor:
  - Evaluate: TipTap, Milkdown, or similar
  - WYSIWYG mode (not split preview)
  - Basic formatting: headers, bold, italic, lists, code
- [ ] Implement save/cancel:
  - `Cmd/Ctrl+S`: Save and close
  - `Escape`: Cancel with unsaved changes warning

### 7.2 Prompt CRUD Operations

- [ ] Create new prompt:
  - Generate UUID
  - Create file in selected folder
  - Add to index
- [ ] Edit existing prompt:
  - Load content from file
  - Update file and index on save
- [ ] Delete prompt:
  - Confirmation dialog
  - Remove file
  - Remove from index

### 7.3 Folder & Tag Management

- [ ] Folder management:
  - List existing folders
  - Create new folder
  - Rename folder (update all prompt paths)
  - Delete folder (move prompts to uncategorized)
- [ ] Tag management:
  - Autocomplete from existing tags
  - Add/remove tags from prompts
  - No explicit tag deletion (orphaned tags ignored)

---

## Phase 8: Settings & System Integration

### 8.1 Settings Panel

- [ ] Create settings window/dialog:
  - Tabbed interface: General, Appearance, Storage, About
- [ ] General tab:
  - Hotkey customization with conflict detection
  - Launch at startup toggle
  - Preserve clipboard toggle
- [ ] Appearance tab:
  - Theme selector (light/dark/system)
- [ ] Storage tab:
  - Display current storage location
  - Change location (with migration option)
  - Rebuild index button
- [ ] About tab:
  - Version info
  - Links: website, changelog, issue tracker

### 8.2 System Tray

- [ ] Implement tray icon:
  - Show/hide based on OS conventions
  - Context menu: Open launcher, Settings, Quit
- [ ] Implement tray click behavior:
  - Left click: Open launcher
  - Right click: Show context menu

### 8.3 Auto-Start

- [ ] Implement launch at startup:
  - **macOS**: Login items via `SMAppService` or launch agent
  - **Windows**: Registry or startup folder
- [ ] Toggle via settings

---

## Phase 9: Import/Export

### 9.1 Import

- [ ] Import single `.md` file:
  - Parse frontmatter or generate from filename
  - Copy to prompts directory
  - Add to index
- [ ] Import bulk JSON:
  - Define JSON schema for bulk import
  - Create files for each prompt
  - Add all to index

### 9.2 Export

- [ ] Export is implicit (files are already portable)
- [ ] Optional: Export to single JSON file for backup

---

## Phase 10: Polish & Platform Specifics

### 10.1 Animations & Transitions

- [ ] Launcher appear/disappear animation (fade + scale)
- [ ] Results list transitions (slide in/out)
- [ ] Mode transition animations (search ↔ rider)

### 10.2 Theming

- [ ] Implement theme system:
  - CSS variables for colors
  - Light and dark themes
  - System theme detection and following

### 10.3 macOS Specifics

- [ ] Handle Accessibility permission request:
  - Check on startup
  - Guide user through granting permission
- [ ] Menu bar integration:
  - Icon appears in menu bar
  - Standard macOS app behavior

### 10.4 Windows Specifics

- [ ] Handle WebView2 runtime:
  - Check for installation
  - Bundle bootstrapper in installer
- [ ] Windows-specific installer:
  - NSIS or WiX via tauri-bundler
  - Start menu shortcuts
  - Optional desktop shortcut

---

## Phase 11: Testing & Quality

### 11.1 Unit Tests

- [ ] Frontend:
  - Search algorithm tests
  - Component tests (React Testing Library)
  - State management tests
- [ ] Backend:
  - File operations tests
  - Frontmatter parsing tests
  - Index operations tests

### 11.2 Integration Tests

- [ ] End-to-end flows:
  - Search and paste flow
  - Rider mode flow
  - Create/edit/delete prompt
- [ ] Platform-specific tests:
  - Global hotkey registration
  - Focus restoration
  - Paste simulation

### 11.3 Performance Testing

- [ ] Verify targets:
  - Launcher appears < 100ms
  - Search results < 50ms
  - Memory < 50MB idle
- [ ] Test with large library (1,000+ prompts)

---

## Phase 12: Release Preparation

### 12.1 Build & Distribution

- [ ] Configure release builds:
  - Code signing (macOS)
  - Notarization (macOS)
  - Windows code signing (optional for v1)
- [ ] Create installers:
  - macOS: `.dmg` and/or `.app`
  - Windows: `.msi` or `.exe` installer

### 12.2 Documentation

- [ ] User documentation:
  - Getting started guide
  - Keyboard shortcuts reference
  - Troubleshooting common issues
- [ ] Update CLAUDE.md with build commands and project structure

### 12.3 Pre-release Checklist

- [ ] All v1 features implemented
- [ ] No critical bugs
- [ ] Performance targets met
- [ ] Both platforms tested
- [ ] Documentation complete

---

## Implementation Order (Recommended)

1. **Phase 1**: Project Foundation (required first)
2. **Phase 2**: Storage Layer (foundation for everything)
3. **Phase 4.1**: Launcher Window (basic UI shell)
4. **Phase 5.3**: Global Hotkey (core UX)
5. **Phase 3**: Search Engine (core feature)
6. **Phase 4.2-4.3**: Remaining UI Components
7. **Phase 5.1-5.2**: Keyboard Navigation
8. **Phase 6**: Clipboard & Focus (complete core loop)
9. **Phase 7**: Prompt Management
10. **Phase 8**: Settings & System Integration
11. **Phase 9**: Import/Export
12. **Phase 10**: Polish
13. **Phase 11**: Testing
14. **Phase 12**: Release

---

## Dependencies & Libraries

### Frontend (npm)

| Package | Purpose |
|---------|---------|
| `react` | UI framework |
| `typescript` | Type safety |
| `@tauri-apps/api` | Tauri IPC |
| `fuse.js` | Fuzzy search |
| `@tiptap/react` or `@milkdown/core` | Markdown editor |
| `zustand` or `jotai` | State management |
| `tailwindcss` | Styling |
| `framer-motion` | Animations |

### Backend (Cargo)

| Crate | Purpose |
|-------|---------|
| `tauri` | Framework |
| `serde` | Serialization |
| `serde_yaml` | Frontmatter parsing |
| `uuid` | ID generation |
| `chrono` | Date/time handling |
| `grep-regex` or manual | Content search |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Hotkey conflicts | Conflict detection + customization |
| Paste simulation fails | Clipboard fallback + notification |
| Large library performance | Indexed metadata + lazy content loading |
| macOS permission issues | Clear onboarding flow |
| WebView2 missing | Bundle bootstrapper |
