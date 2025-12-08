# PromptPad TODO

## Completed

- [x] **Global hotkey activation** - `Cmd+Shift+P` / `Ctrl+Shift+P` toggles launcher
- [x] **Instant fuzzy search** - Fuse.js-based search with weighted scoring
- [x] **Prompt promotion + rider context** - Tab/Space/Arrow promotes, type adds context
- [x] **Keyboard-first navigation** - Full keyboard support
- [x] **Paste into previous app** - Focus tracking and clipboard paste
- [x] **File-based storage** - Prompts as `.md` files with YAML frontmatter
- [x] **Frequency-based sorting** - Usage count tracked per prompt
- [x] **Prompt CRUD** - Create, read, update, delete via PromptManager
- [x] **Folder + tag organization** - Single-level folders, freeform tags
- [x] **Tag autocomplete** - Suggestions from existing tags while typing
- [x] **Quick add from launcher** - `+` button and `Cmd+N` in launcher
- [x] **Keyboard shortcuts** - `Cmd+S` save, `Escape` cancel in editor
- [x] **System tray menu** - Manage Prompts, Settings, Quit
- [x] **Keyboard hint bar** - Shows shortcuts at bottom of launcher
- [x] **Import/Export** - JSON and markdown import/export support
- [x] **Theme support** - Light, dark, system themes
- [x] **Launch at startup** - Autostart toggle in settings

## Pending

- [ ] **Make hotkey configurable** - Sync frontend Settings UI with Rust backend shortcut registration
  - Read hotkey from settings.json on app startup
  - Create Tauri command to re-register shortcuts dynamically
  - Update frontend Settings to call the backend when hotkey changes

- [ ] **Make storage location choosable** - Add folder picker in Settings
  - Add "Browse" button next to storage location display
  - Use Tauri dialog plugin for native folder picker
  - Migrate prompts when location changes (or warn user)

- [ ] **Rich markdown editor** - Replace textarea with WYSIWYG editor
  - Consider Milkdown, TipTap, or similar library
  - Maintain keyboard shortcuts compatibility

- [ ] **Delete confirmation modal** - Proper confirmation dialog for deletions
  - Currently uses basic confirm, should match app styling

- [ ] **Inline folder creation** - Create folders directly in editor dropdown
  - Add FolderPlus icon to create new folder while editing

## Future Considerations (v2+)

- [ ] Multiple riders (chain prompts)
- [ ] Variable placeholders (`{{project}}` style)
- [ ] Nested folders
- [ ] Prompt versioning / git integration
- [ ] Team sharing
- [ ] AI suggestions
