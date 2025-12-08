# PromptPad

**A Spotlight-Style Prompt Launcher for Windows & macOS**

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Date | December 7, 2025 |
| Status | Draft |
| Target Platforms | Windows 10/11, macOS 10.15+ |

---

## 1. Executive Summary

PromptPad is a cross-platform desktop application that provides instant access to a personal library of prompts through a global hotkey. Similar to macOS Spotlight or Raycast, users can invoke PromptPad from any application, search for the right prompt, optionally add context via "rider text," and paste it directly into their current application—all without breaking their workflow.

---

## 2. Problem Statement

Power users who interact frequently with AI assistants, code editors, and other tools accumulate a library of effective prompts. Currently, these prompts are scattered across text files, bookmarks, notes apps, and browser tabs. Finding and using the right prompt requires context-switching: leaving the current application, navigating to the prompt source, copying the text, returning to the original app, and pasting. This friction disrupts focus, interrupts flow state, and reduces productivity.

---

## 3. Goals

1. **Zero context-switching:** Access prompts without leaving the current application
2. **Sub-second retrieval:** Find and paste any prompt in under 2 seconds
3. **Composable prompts:** Add context to prompts on-the-fly via rider text
4. **Keyboard-first:** Complete workflow without touching the mouse
5. **Cross-platform parity:** Identical experience on Windows and macOS

---

## 4. Non-Goals (v1)

- Cloud sync or multi-device synchronization
- Formal variable/placeholder substitution syntax
- Team sharing or collaboration features
- AI-powered prompt suggestions or generation
- Mobile companion app

---

## 5. User Stories

1. **Quick Prompt Access:** As a user, I want to press a hotkey, type a few characters, and paste my prompt so that I never leave my current application.

2. **Contextual Prompts:** As a user, I want to select a prompt and add custom context before pasting so that I can reuse generic prompts for specific situations.

3. **Fuzzy Search:** As a user, I want the search to be forgiving of typos so that I can find prompts even when I don't remember the exact wording.

4. **Frequent Prompts First:** As a user, I want my most-used prompts to appear at the top so that I can access them faster.

5. **Markdown Editing:** As a user, I want to write prompts in markdown so that I can include formatting and structure.

6. **Portable Library:** As a user, I want my prompts stored as individual files so that I can back them up, version them, and edit them outside the app.

---

## 6. Functional Requirements

### 6.1 Global Hotkey Activation

- Configurable global hotkey (default: `Cmd+Shift+Space` on macOS, `Ctrl+Shift+Space` on Windows)
- Launcher appears as a floating overlay centered on the active monitor
- Track which application had focus before launcher appeared
- Escape key or clicking outside dismisses the launcher

### 6.2 Instant Search

Type to filter prompts in real-time with intelligent search priority:

- **Primary:** Prompt name/title (indexed, in-memory)
- **Secondary:** Tags and folder names (indexed, in-memory)
- **Tertiary:** Description field (indexed, in-memory)
- **Fallback:** Prompt content (file-based grep, not held in memory)

Results update as user types with 50ms debounce. Fuzzy matching tolerates typos.

### 6.3 Keyboard Navigation

Fast, snappy, no mouse required:

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate through results |
| `Enter` | Select and paste immediately |
| `Space` / `Tab` / `→` | Promote prompt (enter rider mode) |
| `Escape` | Dismiss launcher |
| `Backspace` (in rider mode) | Remove promoted prompt, return to search mode |

### 6.4 Prompt Promotion with Rider Context

The signature feature that turns static prompts into composable templates:

- When a prompt is highlighted, pressing `Space`/`Tab`/`→` "promotes" it
- Promoted prompt appears as a colored pill/chip in the input bar
- Cursor returns to input field, now in "rider mode"
- Typing in rider mode appends context—does NOT search for more prompts
- `Enter` pastes: `[promoted prompt content]` + `[rider text]`
- Visual treatment: clear distinction between prompt pill and rider text

**Example Flow:**

1. Type "joke" → results show "Tell me a joke about" prompt
2. Arrow down to highlight it
3. Press `Space` → prompt promoted, shown as `[Tell me a joke about]` pill
4. Type "dogs"
5. Press `Enter` → pastes "Tell me a joke about dogs"

### 6.5 Paste into Previous App

- Track which application had focus before launcher appeared
- On selection: copy to clipboard → dismiss launcher → restore focus → simulate `Cmd/Ctrl+V`
- User experience: select prompt, it appears where their cursor was
- Optional setting: preserve original clipboard content (restore after paste)
- Fallback: if paste simulation fails, show notification that content is in clipboard

### 6.6 Prompt Management

- Create, edit, and delete prompts
- Each prompt has: name, description (optional), content, folder (optional), tags (optional)
- Create and manage folders (single level, no nesting for v1)
- Create and manage tags (freeform text, auto-complete from existing)
- Import prompts from `.md` files or bulk JSON
- Export all prompts (already portable as `.md` files)

### 6.7 Markdown Editor

- Unified markdown editor for creating and editing prompts
- WYSIWYG-style editing (not split-panel preview)
- Markdown rendering for read/preview mode
- Lightweight, open-source library (e.g., Milkdown, TipTap, or similar)
- Keyboard shortcuts: `Cmd/Ctrl+S` to save, `Escape` to cancel

### 6.8 Frequency-Based Sorting

- Track usage count per prompt
- Most-used prompts appear higher in search results
- Scoring algorithm: `usage_count + recency_bonus`
- Recency bonus decays over time (prompts used today rank higher than those used last week)

### 6.9 Settings

- Customize global hotkey
- Launch at system startup toggle
- Theme selection (light, dark, system)
- Prompts storage location (default: `~/PromptPad` or platform app data)
- Preserve clipboard option
- Keyboard shortcut reference

---

## 7. Technical Requirements

### 7.1 Architecture

| Component | Technology |
|-----------|------------|
| **Framework** | Tauri 2.x (Rust backend, WebView frontend) |
| **Frontend** | React with TypeScript |
| **Backend** | Rust or Node.js (low complexity, choose based on team fluency) |
| **Global Hotkey** | `tauri-plugin-global-shortcut` |
| **System Tray** | Built-in Tauri tray support |
| **Markdown Editor** | Milkdown, TipTap, or similar |

**Why Tauri:**

- Native performance, small bundle (~3MB vs Electron's ~80MB)
- Built-in global shortcuts plugin
- System tray support for headless background operation
- Cross-platform from single codebase

**Backend Complexity Note:**

The backend is not the hard part. Core operations are: file I/O (read/write prompts), metadata indexing (small JSON or SQLite), clipboard operations, and focus management. Choose Rust or Node based on what agents/developers write more fluently.

### 7.2 File-Based Storage

Each prompt stored as an individual `.md` file for portability and scalability:

- **Prompt files:** Individual `.md` files in `~/PromptPad/prompts/` (or configured location)
- **Metadata index:** JSON or SQLite file holding: name, folder, tags, description, usage stats, file path
- **Content loading:** Prompt content loaded on-demand from file, not held in memory
- **Content search:** File-based grep for searching prompt content (fallback search tier)
- **Benefits:** Scales to large libraries, prompts are portable markdown, easy backup/versioning

### 7.3 Performance Requirements

- Launcher window appears within 100ms of hotkey press
- Metadata search results render within 50ms
- Content grep completes within 500ms for libraries up to 10,000 prompts
- Memory footprint under 50MB when idle
- Binary size under 10MB (installer under 5MB)
- Cold start time under 1 second

### 7.4 Platform-Specific Considerations

#### macOS

- Requires Accessibility permissions for global hotkey and paste simulation
- Menu bar icon via `tauri-plugin-positioner`
- Native WebKit WebView (no bundled browser engine)
- Code signing and notarization required for distribution
- Support for macOS 10.15+ (Catalina and later)

#### Windows

- System tray icon with context menu
- WebView2 runtime (pre-installed on Windows 11, bundled for Windows 10)
- NSIS or WiX installer via tauri-bundler
- Auto-updater support via `tauri-plugin-updater`
- Support for Windows 10 (1803+) and Windows 11

---

## 8. Data Model

### 8.1 File Structure

```
~/PromptPad/
├── prompts/
│   ├── coding/
│   │   ├── code-review.md
│   │   └── debug-helper.md
│   ├── writing/
│   │   └── blog-outline.md
│   └── uncategorized/
│       └── quick-joke.md
├── index.json (or index.db)
└── settings.json
```

### 8.2 Prompt File Format (.md)

```markdown
---
name: Code Review Helper
description: Analyze code for issues and improvements
tags: [coding, review, quality]
created: 2025-01-15T10:30:00Z
---

Review the following code for:
- Potential bugs
- Performance issues
- Best practice violations

Provide specific suggestions for improvement.
```

### 8.3 Metadata Index Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | String | Display name (from frontmatter) |
| `description` | String \| null | Short description for search |
| `folder` | String \| null | Folder name (maps to directory) |
| `tags` | String[] | Array of tag names |
| `file_path` | String | Relative path to `.md` file |
| `use_count` | Integer | Total usage count |
| `last_used_at` | DateTime \| null | Last usage timestamp |
| `created_at` | DateTime | Creation timestamp |

---

## 9. UI/UX Requirements

### 9.1 Launcher Window

- Dimensions: 600-700px wide, height adapts to results (max ~400px)
- Input bar at top with large, clear text (16-18px)
- Promoted prompt displayed as colored pill/chip in input area
- Results list showing: prompt name, folder badge, tag pills
- Preview pane (optional) showing prompt content on hover/selection
- Keyboard navigation indicators (highlighted row)
- Smooth animations for appearance and transitions

### 9.2 Rider Mode Visual Treatment

- Promoted prompt shown as distinct colored pill (e.g., blue background)
- Rider text appears after pill in normal text style
- Clear visual separation: user always sees exactly what will be pasted
- Results list hidden or replaced with preview in rider mode
- Backspace on empty rider text removes the pill, returns to search mode

### 9.3 Prompt Editor

- Full-window or modal dialog for creating/editing prompts
- Name field at top
- Description field (single line, optional)
- WYSIWYG markdown editor for content (main area)
- Folder dropdown with option to create new
- Tag input with autocomplete
- Keyboard shortcuts: `Cmd/Ctrl+S` to save, `Escape` to cancel

### 9.4 Settings Panel

- Accessible from tray icon or keyboard shortcut
- Tabbed interface: General, Appearance, Storage, About
- Changes apply immediately where possible

---

## 10. Core Features Summary (v1)

1. **Global hotkey activation** — summon from anywhere
2. **Instant fuzzy search** — name → tags/folder → description → content
3. **Prompt promotion + rider context** — compose prompts on-the-fly
4. **Keyboard-first navigation** — no mouse required
5. **Paste into previous app** — seamless focus restoration
6. **File-based storage** — portable `.md` files
7. **Frequency-based sorting** — most-used prompts first
8. **Markdown editor** — WYSIWYG prompt editing
9. **Folder + tag organization** — flexible categorization
10. **Cross-platform** — Windows and macOS via Tauri

---

## 11. Future Considerations (v2+)

1. **Cloud sync** — sync prompts across devices
2. **Multiple riders** — chain multiple prompts together
3. **Variable placeholders** — `{{project}}` style dynamic substitution
4. **Nested folders** — deeper organizational hierarchy
5. **Prompt versioning** — track changes over time (git integration?)
6. **Team sharing** — shared prompt libraries
7. **AI suggestions** — recommend prompts based on context
8. **Snippet expansion** — type abbreviations to expand inline
9. **Browser extension** — direct integration with web apps

---

## 12. Success Metrics

1. **Time to paste:** Average time from hotkey to paste under 2 seconds
2. **Rider adoption:** 30%+ of pastes use rider context
3. **Daily active usage:** User opens launcher at least 5 times per day
4. **Library growth:** Active users add at least 2 prompts per week
5. **Search success rate:** 90%+ of searches result in a paste action

---

## 13. Risks & Mitigations

1. **Hotkey conflicts:** Allow full customization; detect and warn about conflicts
2. **OS permission barriers:** Clear onboarding flow explaining why permissions are needed
3. **Focus restoration failures:** Fallback to clipboard-only mode with notification
4. **Large library performance:** File-based storage + indexed metadata keeps memory low
5. **WebView2 on Windows 10:** Bundle WebView2 bootstrapper in installer

---

## 14. Open Questions

- Should rider text support multiple prompts chained together?
- What's the maximum reasonable prompt file size we should support?
- Should we watch the prompts folder for external changes and auto-reload?
- Is there value in a "favorites" or "pinned" quick-access feature?
- Should the app offer a "portable mode" that stores everything in a single folder?
