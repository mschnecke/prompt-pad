# Changelog

All notable changes to PromptPad will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.8] - 2026-01-04

### Fixed
- Launcher window now properly hides when pressing Escape key
- Launcher window now hides after copying prompt with Enter key

## [1.1.7] - 2025-12-12

### Added
- Husky and lint-staged for pre-commit hook integration

### Changed
- Refactored folder list logic for improved readability

### Fixed
- Folder and tag handling inconsistencies across components

## [1.1.6] - 2025-12-11

### Changed
- Updated .gitignore to include new Claude config file
- Removed settings.local.json file and its associated permissions

## [1.1.5] - 2025-12-11

### Changed
- Dropped support for macOS Intel builds in release process
- Display dynamic app version in UI

## [1.1.4] - 2025-12-11

### Added
- macOS app launch post-install for better UX

### Changed
- Updated installer behavior and cleaned up permissions

## [1.1.3] - 2025-12-10

### Added
- Windows installer now launches application after installation (checkbox checked by default)

### Changed
- Removed macOS Intel (x64) build - Apple Silicon only

### Removed
- macOS Intel (x64) pkg installer

## [1.1.2] - 2025-12-10

### Changed
- Updated documentation with pre-built installation instructions (Homebrew, Chocolatey, direct downloads)

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

[Unreleased]: https://github.com/mschnecke/prompt-pad/compare/v1.1.8...HEAD
[1.1.8]: https://github.com/mschnecke/prompt-pad/compare/v1.1.7...v1.1.8
[1.1.7]: https://github.com/mschnecke/prompt-pad/compare/v1.1.6...v1.1.7
[1.1.6]: https://github.com/mschnecke/prompt-pad/compare/v1.1.5...v1.1.6
[1.1.5]: https://github.com/mschnecke/prompt-pad/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/mschnecke/prompt-pad/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/mschnecke/prompt-pad/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/mschnecke/prompt-pad/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/mschnecke/prompt-pad/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/mschnecke/prompt-pad/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/mschnecke/prompt-pad/releases/tag/v1.0.0
