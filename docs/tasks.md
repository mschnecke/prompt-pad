# PromptPad Development Tasks

Comprehensive task list derived from [PromptPad-PRD.md](./PromptPad-PRD.md).

---

## Milestone 1: Project Setup

### Tauri & Build System

- [x] Initialize Tauri 2.x project with `create-tauri-app`
- [x] Configure Tauri for frameless/overlay window mode
- [x] Set up Tauri build configuration for macOS and Windows
- [x] Configure bundle identifiers and app metadata

### Frontend Scaffolding

- [x] Set up React 18+ with TypeScript
- [x] Configure Vite as frontend bundler
- [x] Set up path aliases (@components, @hooks, @utils, etc.)
- [x] Install and configure Tailwind CSS (or preferred styling solution)

### Backend Structure

- [x] Create Rust module structure (src-tauri/src/)
- [x] Set up error handling pattern (thiserror or anyhow)
- [x] Configure serde for JSON serialization

### Tooling & Quality

- [x] Configure ESLint with TypeScript rules
- [x] Configure Prettier for code formatting
- [x] Configure rustfmt for Rust formatting
- [x] Set up Clippy with strict lints
- [x] Add pre-commit hooks (husky + lint-staged)
- [x] Create .editorconfig for consistent settings

---

## Milestone 2: Data Layer & Storage

### Prompt File Format

- [ ] Define Prompt TypeScript interface
- [ ] Define Prompt Rust struct with serde
- [ ] Implement YAML frontmatter parser for .md files
- [ ] Implement YAML frontmatter serializer for .md files
- [ ] Handle malformed/missing frontmatter gracefully

### File System Operations

- [ ] Implement read single prompt file
- [ ] Implement write/save prompt file
- [ ] Implement delete prompt file
- [ ] Implement rename prompt file
- [ ] Implement move prompt to different folder
- [ ] Watch prompts directory for external changes (optional v1)

### Folder Management

- [ ] Implement create folder
- [ ] Implement rename folder
- [ ] Implement delete folder (with prompt relocation)
- [ ] Implement list all folders
- [ ] Ensure "uncategorized" default folder exists

### Metadata Index

- [ ] Design index schema (id, name, description, folder, tags, path, stats)
- [ ] Implement index file read (JSON)
- [ ] Implement index file write (JSON)
- [ ] Implement add prompt to index
- [ ] Implement update prompt in index
- [ ] Implement remove prompt from index
- [ ] Implement rebuild index from files (sync/repair)

### Settings Persistence

- [ ] Define Settings TypeScript interface
- [ ] Define Settings Rust struct
- [ ] Implement settings file read
- [ ] Implement settings file write
- [ ] Define default settings values
- [ ] Implement settings migration for version upgrades

### Storage Initialization

- [ ] Create default prompts directory on first run
- [ ] Create default folders (uncategorized)
- [ ] Initialize empty index file
- [ ] Initialize default settings file

---

## Milestone 3: Core Backend Services

### Global Hotkey

- [ ] Add tauri-plugin-global-shortcut dependency
- [ ] Implement hotkey registration on app start
- [ ] Implement hotkey unregistration on app quit
- [ ] Handle hotkey change (unregister old, register new)
- [ ] Detect and report hotkey conflicts
- [ ] Default hotkey: Cmd+Shift+Space (macOS), Ctrl+Shift+Space (Windows)

### Focus Tracking

- [ ] Implement get previous focused window/app (macOS)
- [ ] Implement get previous focused window/app (Windows)
- [ ] Store previous app reference for restoration
- [ ] Implement restore focus to previous app

### Clipboard Operations

- [ ] Implement copy text to clipboard
- [ ] Implement read text from clipboard (for preserve option)
- [ ] Implement clipboard content preservation and restoration

### Paste Simulation

- [ ] Implement simulate Cmd+V keystroke (macOS)
- [ ] Implement simulate Ctrl+V keystroke (Windows)
- [ ] Add configurable delay before paste simulation
- [ ] Handle paste simulation failure gracefully

### System Tray

- [ ] Add tauri tray plugin dependency
- [ ] Create tray icon (light and dark variants)
- [ ] Implement tray menu: Open Launcher, Settings, Quit
- [ ] Handle tray icon click to show launcher
- [ ] Update tray icon based on system theme

### IPC Commands

- [ ] Define Tauri command for show/hide launcher
- [ ] Define Tauri command for get all prompts (metadata)
- [ ] Define Tauri command for get prompt content
- [ ] Define Tauri command for save prompt
- [ ] Define Tauri command for delete prompt
- [ ] Define Tauri command for search prompts
- [ ] Define Tauri command for paste text
- [ ] Define Tauri command for get/set settings

---

## Milestone 4: Launcher UI - Basic

### Window Configuration

- [ ] Configure frameless overlay window
- [ ] Set window dimensions (600-700px wide, max 400px height)
- [ ] Enable window transparency/blur if supported
- [ ] Disable window from appearing in taskbar/dock
- [ ] Configure always-on-top behavior

### Window Positioning

- [ ] Add tauri-plugin-positioner dependency
- [ ] Center window on active/primary monitor
- [ ] Recalculate position on hotkey invoke

### Search Input Component

- [ ] Create SearchInput component
- [ ] Auto-focus input on launcher show
- [ ] Style input (large, clear text 16-18px)
- [ ] Handle input change events
- [ ] Clear input on launcher hide

### Results List Component

- [ ] Create ResultsList component
- [ ] Create ResultItem component
- [ ] Display prompt name prominently
- [ ] Display folder as badge/pill
- [ ] Display tags as small pills
- [ ] Highlight currently selected item
- [ ] Limit visible results (scrollable)
- [ ] Handle empty results state

### Keyboard Navigation

- [ ] Track selected index in state
- [ ] Arrow Up: move selection up
- [ ] Arrow Down: move selection down
- [ ] Enter: select current item
- [ ] Escape: dismiss launcher
- [ ] Wrap selection at list boundaries (optional)

### Window Lifecycle

- [ ] Show launcher on hotkey event
- [ ] Hide launcher on Escape
- [ ] Hide launcher on click outside (blur)
- [ ] Reset state on hide (clear input, selection)
- [ ] Add show/hide animations (fade, slide)

### Theming

- [ ] Define light theme colors
- [ ] Define dark theme colors
- [ ] Detect system theme preference
- [ ] Apply theme based on setting (light/dark/system)
- [ ] Update theme on system preference change

---

## Milestone 5: Search & Indexing

### Index Management

- [ ] Load metadata index into memory on startup
- [ ] Refresh index when prompts change
- [ ] Expose index to frontend via IPC

### Fuzzy Search

- [ ] Choose fuzzy search library (fuse.js, fzf, or custom)
- [ ] Configure search options (threshold, keys, weights)
- [ ] Implement fuzzy match on prompt name
- [ ] Implement fuzzy match on tags
- [ ] Implement fuzzy match on folder name
- [ ] Implement fuzzy match on description

### Search Priority Tiers

- [ ] Weight name matches highest
- [ ] Weight tag/folder matches second
- [ ] Weight description matches third
- [ ] Implement content grep fallback (file-based)
- [ ] Merge and deduplicate multi-tier results

### Performance

- [ ] Implement search debounce (50ms)
- [ ] Optimize for <50ms metadata search
- [ ] Optimize content grep for <500ms on 10k files
- [ ] Cache grep results if needed

### Usage Tracking

- [ ] Increment use_count on prompt selection
- [ ] Update last_used_at timestamp
- [ ] Persist usage stats to index

### Result Ranking

- [ ] Calculate frequency score (use_count)
- [ ] Calculate recency bonus (decay over time)
- [ ] Combine fuzzy score + frequency + recency
- [ ] Sort results by combined score

---

## Milestone 6: Prompt Promotion & Rider

### State Management

- [ ] Define launcher mode: search | rider
- [ ] Track promoted prompt in state
- [ ] Track rider text in state
- [ ] Clear promotion on launcher hide

### Promotion Triggers

- [ ] Space key promotes highlighted prompt
- [ ] Tab key promotes highlighted prompt
- [ ] Right Arrow key promotes highlighted prompt
- [ ] Only trigger when result is highlighted

### Pill/Chip Component

- [ ] Create PromptPill component
- [ ] Style with distinct background color
- [ ] Display prompt name in pill
- [ ] Position pill in input area
- [ ] Animate pill appearance

### Rider Mode UI

- [ ] Show pill + text input in rider mode
- [ ] Hide/replace results list in rider mode
- [ ] Show prompt preview in rider mode (optional)
- [ ] Cursor focus on rider text input

### Demotion

- [ ] Backspace on empty rider removes pill
- [ ] Return to search mode on demotion
- [ ] Restore previous search query (optional)

### Paste Composition

- [ ] Compose final text: prompt content + rider text
- [ ] Handle empty rider (paste prompt only)
- [ ] Trim/format composed text appropriately

---

## Milestone 7: Prompt Management

### Editor View

- [ ] Create PromptEditor component/page
- [ ] Navigate to editor for new prompt
- [ ] Navigate to editor for existing prompt
- [ ] Pass prompt data to editor

### Form Fields

- [ ] Name input field (required)
- [ ] Description input field (optional, single line)
- [ ] Folder dropdown selector
- [ ] "Create new folder" option in dropdown
- [ ] Tag input with autocomplete
- [ ] Tag creation on enter/comma
- [ ] Tag removal (x button)

### Markdown Editor

- [ ] Choose WYSIWYG library (Milkdown, TipTap, or similar)
- [ ] Integrate editor component
- [ ] Configure toolbar (bold, italic, lists, code, etc.)
- [ ] Support keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
- [ ] Handle large prompt content gracefully

### Save Flow

- [ ] Validate required fields (name, content)
- [ ] Generate file path from name + folder
- [ ] Check for naming conflicts
- [ ] Save to file system via IPC
- [ ] Update metadata index
- [ ] Show success feedback
- [ ] Navigate back to launcher/list

### Edit Flow

- [ ] Load existing prompt content
- [ ] Pre-populate all form fields
- [ ] Handle rename (file path change)
- [ ] Handle folder move
- [ ] Preserve created_at timestamp

### Delete Flow

- [ ] Confirm deletion dialog
- [ ] Delete file from file system
- [ ] Remove from metadata index
- [ ] Show success feedback

### Import/Export

- [ ] Import single .md file
- [ ] Import folder of .md files
- [ ] Import from bulk JSON
- [ ] Validate imported prompt format
- [ ] Handle import conflicts (rename, skip, overwrite)
- [ ] Export single prompt as .md
- [ ] Export all prompts as .zip (files already portable)

---

## Milestone 8: Settings & Configuration

### Settings Panel

- [ ] Create Settings component/page
- [ ] Implement tabbed interface (General, Appearance, Storage, About)
- [ ] Open settings from tray menu
- [ ] Open settings via keyboard shortcut (optional)

### General Settings

- [ ] Hotkey customization input
- [ ] Hotkey conflict detection and warning
- [ ] Launch at startup toggle
- [ ] Preserve clipboard toggle

### Appearance Settings

- [ ] Theme selector (Light, Dark, System)
- [ ] Apply theme immediately on change
- [ ] Preview theme before applying (optional)

### Storage Settings

- [ ] Display current storage path
- [ ] Change storage location picker
- [ ] Migrate prompts on location change
- [ ] Reset to default location option

### About Section

- [ ] Display app version
- [ ] Display build info
- [ ] Link to documentation/website
- [ ] Link to issue tracker
- [ ] Check for updates button

### Keyboard Reference

- [ ] Display all keyboard shortcuts
- [ ] Group by context (launcher, editor, etc.)

---

## Milestone 9: Platform-Specific Polish

### macOS

- [ ] Request Accessibility permissions on first run
- [ ] Explain why permissions are needed (onboarding UI)
- [ ] Detect if permissions are granted
- [ ] Menu bar icon positioning (tauri-plugin-positioner)
- [ ] Set up code signing certificate
- [ ] Configure notarization workflow
- [ ] Test on macOS 10.15+ (Catalina through current)

### Windows

- [ ] Bundle WebView2 bootstrapper for Windows 10
- [ ] Configure NSIS installer
- [ ] Set up system tray behavior
- [ ] Handle Windows 10 (1803+) and Windows 11
- [ ] Test installer on clean Windows machine

### Auto-Updater

- [ ] Add tauri-plugin-updater dependency
- [ ] Configure update server/GitHub releases
- [ ] Implement update check flow
- [ ] Implement download and install flow
- [ ] Show update available notification

### Performance Optimization

- [ ] Profile launcher activation time (<100ms target)
- [ ] Profile memory usage (<50MB idle target)
- [ ] Optimize bundle size (<10MB target)
- [ ] Lazy load heavy components
- [ ] Minimize frontend bundle
- [ ] Strip debug symbols in release

---

## Milestone 10: Testing & QA

### Rust Unit Tests

- [ ] Test prompt file parsing
- [ ] Test prompt file writing
- [ ] Test index operations
- [ ] Test search scoring algorithm
- [ ] Test settings read/write

### Frontend Unit Tests

- [ ] Test SearchInput component
- [ ] Test ResultsList component
- [ ] Test PromptPill component
- [ ] Test keyboard navigation hooks
- [ ] Test search debounce utility

### Integration Tests

- [ ] Test full prompt create flow
- [ ] Test full prompt edit flow
- [ ] Test full prompt delete flow
- [ ] Test search end-to-end
- [ ] Test promotion and paste flow

### End-to-End Tests

- [ ] Test hotkey → search → paste workflow
- [ ] Test hotkey → search → promote → rider → paste
- [ ] Test settings changes persist
- [ ] Test import/export workflows

### Performance Testing

- [ ] Benchmark launcher activation time
- [ ] Benchmark search with 100/1000/10000 prompts
- [ ] Benchmark memory under load
- [ ] Identify and fix performance regressions

### Cross-Platform QA

- [ ] Test on macOS (Intel)
- [ ] Test on macOS (Apple Silicon)
- [ ] Test on Windows 10
- [ ] Test on Windows 11
- [ ] Document platform-specific issues

---

## Summary

| Milestone                   | Task Count |
| --------------------------- | ---------- |
| 1. Project Setup            | 14         |
| 2. Data Layer & Storage     | 26         |
| 3. Core Backend Services    | 24         |
| 4. Launcher UI - Basic      | 27         |
| 5. Search & Indexing        | 20         |
| 6. Prompt Promotion & Rider | 14         |
| 7. Prompt Management        | 27         |
| 8. Settings & Configuration | 16         |
| 9. Platform Polish          | 18         |
| 10. Testing & QA            | 22         |
| **Total**                   | **208**    |
