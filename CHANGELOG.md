# Changelog

All notable changes to PromptPad will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

### Removed

## [1.1.1] - 2025-12-10

### Added
- Autostart functionality now works on Windows via `tauri-plugin-autostart`
- App starts with hidden window (tray icon only) for better startup experience

### Changed
- Window starts hidden by default, accessible via hotkey or tray icon

## [1.1.0] - 2025-12-10

### Added
- Comprehensive unit tests for core hooks, stores, and utilities
- CI/CD pipelines with GitHub Actions for automated testing and releases
- Release tooling scripts for version management

### Changed
- Windows installer switched from NSIS to MSI format
- Improved release workflow with bundle generation
- Codebase formatting refactored for readability and consistency

## [1.0.0] - 2025-12-10

### Added
- Initial release of PromptPad
- Spotlight-style launcher with global hotkey (Cmd+Shift+P / Ctrl+Shift+P)
- Fuzzy search across prompts by name, tags, folder, and description
- Rider mode for adding context to prompts before pasting
- WYSIWYG Markdown editing with TipTap
- Folder and tag organization
- Import/export prompts as JSON or markdown files
- Frequency-based sorting (most-used prompts first)
- Light, dark, and system theme support
- Configurable storage location
- Launch at startup option
- System tray integration with quick access menu
- Windows and macOS support

[Unreleased]: https://github.com/mschnecke/prompt-pad/compare/v1.1.1...HEAD
[1.1.1]: https://github.com/mschnecke/prompt-pad/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/mschnecke/prompt-pad/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mschnecke/prompt-pad/releases/tag/v1.0.0
