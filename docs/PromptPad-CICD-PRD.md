# PromptPad CI/CD & Distribution PRD

**Build Process, Versioning, and Package Distribution for Windows & macOS**

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Date | December 10, 2025 |
| Status | Draft |
| Parent Document | PromptPad-PRD.md |
| Repository | github.com/mschnecke/prompt-pad |
| Target Platforms | Windows 10/11, macOS 10.15+ |
| License | Proprietary (Pisum Projects) |

---

## 1. Executive Summary

This document defines the continuous integration, continuous deployment (CI/CD), versioning strategy, and package distribution approach for PromptPad—a Spotlight-style prompt launcher for Windows and macOS. The goal is to establish an automated, reliable release pipeline that builds cross-platform binaries, creates GitHub releases with proper versioning, and distributes the application through Homebrew (macOS) and Chocolatey (Windows) package managers.

---

## 2. Goals

1. **Automated Builds:** Every tagged release triggers automated builds for Windows and macOS
2. **Consistent Versioning:** Semantic versioning across all platforms and package managers
3. **Easy Installation:** Users can install via `brew install` or `choco install`
4. **Minimal Manual Intervention:** Release process requires only version bump and tag push
5. **Reproducible Builds:** Any release can be reproduced from its git tag

---

## 3. Technology Stack Reference

Based on the existing project structure:

| Component | Technology | Version |
|-----------|------------|---------|
| **Framework** | Tauri | 2.x |
| **Frontend** | React + TypeScript | 18.3 / 5.6 |
| **Styling** | Tailwind CSS | 3.4 |
| **State Management** | Zustand | 5.0 |
| **Search** | Fuse.js | 7.0 |
| **Editor** | TipTap | 3.13 |
| **Build Tool** | Vite | - |
| **Package Manager** | npm | - |

**Tauri Plugins:**
- `tauri-plugin-global-shortcut` - Global hotkey registration
- `tauri-plugin-clipboard-manager` - Clipboard operations
- `tauri-plugin-positioner` - Window positioning
- `tauri-plugin-autostart` - Launch at startup
- `tauri-plugin-fs` - File system access
- `tauri-plugin-dialog` - Native dialogs
- `tauri-plugin-shell` - Shell commands

**Build Artifacts Location:** `src-tauri/target/release/bundle/`

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GitHub Repository                               │
│                         github.com/mschnecke/prompt-pad                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌──────────────────┐     ┌─────────────────────────┐   │
│  │  Developer  │────▶│  Create Release  │────▶│   GitHub Actions CI/CD  │   │
│  │  Push Tag   │     │  (v1.0.0)        │     │                         │   │
│  └─────────────┘     └──────────────────┘     └───────────┬─────────────┘   │
│                                                           │                 │
│                              ┌────────────────────────────┴────────────┐    │
│                              │                                         │    │
│                              ▼                                         ▼    │
│                    ┌─────────────────┐               ┌────────────────────┐ │
│                    │  macOS Build    │               │   Windows Build    │ │
│                    │  (ARM + Intel)  │               │      (x64)         │ │
│                    │  → .pkg files   │               │  → .exe installer  │ │
│                    └────────┬────────┘               └─────────┬──────────┘ │
│                             │                                  │            │
│                             └──────────────┬───────────────────┘            │
│                                            ▼                                │
│                              ┌──────────────────┐                           │
│                              │  GitHub Release  │                           │
│                              │  with Artifacts  │                           │
│                              └────────┬─────────┘                           │
│                                       │                                     │
└───────────────────────────────────────┼─────────────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
          │   Homebrew Tap  │ │   Chocolatey    │ │  Direct GitHub  │
          │   (macOS .pkg)  │ │   (Windows)     │ │   Download      │
          └─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 5. Repository Structure

### 5.1 Main Repository (prompt-pad)

```
prompt-pad/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # PR/push testing
│       ├── release.yml               # Release builds
│       └── update-homebrew.yml       # Homebrew cask updates
├── src/                              # React frontend
│   ├── components/                   # UI components (12 total)
│   │   ├── Launcher.tsx              # Main launcher overlay with search
│   │   ├── PromptEditor.tsx          # Create/edit prompt form
│   │   ├── PromptManager.tsx         # Full-screen prompt management
│   │   ├── Settings.tsx              # App settings panel (tabbed)
│   │   ├── SearchInput.tsx           # Search input with rider mode
│   │   ├── ResultsList.tsx           # Search results display
│   │   ├── PromptItem.tsx            # Individual prompt display
│   │   ├── TagInput.tsx              # Tag input with autocomplete
│   │   ├── FolderSelect.tsx          # Folder dropdown with inline creation
│   │   ├── MarkdownEditor.tsx        # TipTap WYSIWYG editor with toolbar
│   │   ├── RiderPreview.tsx          # Prompt + rider text preview
│   │   └── ImportExport.tsx          # Import/export dialog
│   ├── stores/                       # Zustand state stores
│   │   ├── appStore.ts               # App settings and initialization
│   │   ├── promptStore.ts            # Prompt CRUD operations
│   │   └── launcherStore.ts          # Launcher UI state
│   ├── utils/                        # Utilities
│   │   ├── storage.ts                # File I/O (prompts, index, settings)
│   │   ├── search.ts                 # Fuse.js search with weighted scoring
│   │   ├── clipboard.ts              # Clipboard operations
│   │   ├── frontmatter.ts            # YAML frontmatter parsing
│   │   ├── shortcuts.ts              # Global shortcut registration
│   │   ├── importExport.ts           # Bulk import/export functionality
│   │   └── initialize.ts             # App initialization and theme setup
│   ├── hooks/                        # Custom React hooks
│   │   ├── useDebounce.ts            # Debounce hook for search
│   │   └── useKeyboardNavigation.ts  # Keyboard navigation hook
│   └── types/                        # TypeScript interfaces
├── src-tauri/                        # Rust backend
│   ├── src/
│   │   ├── lib.rs                    # Main Tauri setup + tray menu
│   │   ├── commands.rs               # Tauri commands (show/hide, paste, focus)
│   │   ├── focus.rs                  # Focus tracking/restoration
│   │   └── main.rs                   # Entry point
│   ├── capabilities/                 # Tauri permissions
│   ├── icons/                        # App icons (.icns, .ico, .png)
│   ├── Cargo.toml                    # Rust dependencies
│   └── tauri.conf.json               # Tauri configuration
├── packages/
│   ├── macos/                        # macOS package files
│   │   ├── build-package.sh          # Script to build .pkg installer
│   │   ├── postinstall               # Post-installation script
│   │   └── README.md                 # macOS packaging documentation
│   ├── chocolatey/                   # Chocolatey package files
│   │   ├── prompt-pad.nuspec
│   │   └── tools/
│   │       ├── chocolateyInstall.ps1
│   │       └── chocolateyUninstall.ps1
│   └── homebrew/                     # Reference cask (main lives in tap)
│       └── prompt-pad.rb
├── scripts/
│   ├── release.sh                    # Local release helper (existing)
│   ├── install.sh                    # Local build & install (existing)
│   ├── bump-version.sh               # Version bump utility
│   └── generate-checksums.sh         # SHA256 generation
├── docs/                             # Documentation
│   ├── PromptPad-PRD.md              # Product requirements
│   └── implementation-plan.md        # Implementation roadmap
├── package.json
├── CLAUDE.md                         # Claude Code guidance
└── README.md
```

### 5.2 Homebrew Tap Repository (homebrew-prompt-pad)

```
homebrew-prompt-pad/
├── .github/
│   └── workflows/
│       └── update-cask.yml     # Automated cask updates on new release
├── Casks/
│   └── prompt-pad.rb           # Homebrew cask for .pkg installer
├── CLAUDE.md
└── README.md
```

---

## 6. Versioning Strategy

### 6.1 Semantic Versioning

All versions follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR:** Breaking changes or significant feature overhauls
- **MINOR:** New features, backward compatible
- **PATCH:** Bug fixes, performance improvements

### 6.2 Version Synchronization

Version must be synchronized across all files:

| File | Field |
|------|-------|
| `package.json` | `version` |
| `src-tauri/Cargo.toml` | `version` |
| `src-tauri/tauri.conf.json` | `version` |
| `packages/chocolatey/prompt-pad.nuspec` | `<version>` |

### 6.3 Git Tags

- Format: `v{MAJOR}.{MINOR}.{PATCH}` (e.g., `v1.0.0`, `v1.2.3`)
- Tags trigger release workflow
- Tags must be annotated: `git tag -a v1.0.0 -m "Release v1.0.0"`

### 6.4 Version Bump Script

Extends the existing `scripts/release.sh` with automated sync:

> **Note:** This script uses macOS `sed -i ''` syntax. On Linux, use `sed -i` without the empty string argument.

```bash
#!/bin/bash
# scripts/bump-version.sh
# Usage: ./scripts/bump-version.sh [patch|minor|major|X.Y.Z]
# Note: Uses macOS sed syntax. On Linux, remove the '' after -i

set -e

NEW_VERSION=$1

if [[ ! $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  # Handle patch/minor/major keywords
  CURRENT_VERSION=$(node -p "require('./package.json').version")
  case "$NEW_VERSION" in
    patch) NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g') ;;
    minor) NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$(NF-1) = $(NF-1) + 1; $NF = 0;} 1' | sed 's/ /./g') ;;
    major) NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$1 = $1 + 1; $(NF-1) = 0; $NF = 0;} 1' | sed 's/ /./g') ;;
    *) echo "Usage: $0 [patch|minor|major|X.Y.Z]"; exit 1 ;;
  esac
fi

echo "Bumping version to $NEW_VERSION..."

# Update package.json
npm version $NEW_VERSION --no-git-tag-version

# Update Cargo.toml
sed -i '' "s/^version = \".*\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml

# Update tauri.conf.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" src-tauri/tauri.conf.json

# Update Chocolatey nuspec
sed -i '' "s/<version>.*<\/version>/<version>$NEW_VERSION<\/version>/" packages/chocolatey/prompt-pad.nuspec

echo "✓ Version bumped to $NEW_VERSION"
echo ""
echo "Next steps:"
echo "  git add ."
echo "  git commit -m 'chore: bump version to $NEW_VERSION'"
echo "  git tag -a v$NEW_VERSION -m 'Release v$NEW_VERSION'"
echo "  git push origin main --tags"
```

---

## 7. GitHub Actions Workflows

### 7.1 Continuous Integration (ci.yml)

Runs on every push and pull request to validate builds using existing npm scripts:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      
      - name: Install frontend dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Check formatting
        run: npm run format:check
      
      - name: Run tests
        run: npm run test:run

  build:
    needs: lint-and-test
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, windows-latest]
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      
      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
      
      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'
      
      - name: Install frontend dependencies
        run: npm ci
      
      - name: Build frontend
        run: npm run build
      
      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 7.2 Release Workflow (release.yml)

Main release workflow triggered by version tags:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to release (e.g., 1.0.0)'
        required: true

permissions:
  contents: write

jobs:
  create-release:
    runs-on: ubuntu-latest
    outputs:
      release_id: ${{ steps.create_release.outputs.id }}
      version: ${{ steps.get_version.outputs.version }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Get version
        id: get_version
        run: |
          if [ "${{ github.event_name }}" == "workflow_dispatch" ]; then
            echo "version=${{ github.event.inputs.version }}" >> $GITHUB_OUTPUT
          else
            echo "version=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
          fi
      
      - name: Create Release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ steps.get_version.outputs.version }}
          release_name: PromptPad v${{ steps.get_version.outputs.version }}
          body: |
            ## PromptPad v${{ steps.get_version.outputs.version }}
            
            A Spotlight-style prompt launcher for Windows and macOS.
            
            ### Installation
            
            **macOS (Homebrew) - Recommended:**
            ```bash
            brew tap mschnecke/prompt-pad
            brew install --cask prompt-pad
            ```
            
            **macOS (Direct Download):**
            Download the `.pkg` installer for your architecture:
            - Apple Silicon (M1/M2/M3): `PromptPad_X.Y.Z_aarch64.pkg`
            - Intel: `PromptPad_X.Y.Z_x64.pkg`
            
            **Windows (Chocolatey):**
            ```powershell
            choco install prompt-pad
            ```
            
            **Windows (Direct Download):**
            Download `PromptPad_X.Y.Z_x64-setup.exe` from assets below.
            
            ### Quick Start
            
            - **Default hotkey:** `Cmd+Shift+P` (macOS) / `Ctrl+Shift+P` (Windows)
            - **Prompts stored in:** `~/.prompt-pad/prompts/`
            - **Settings stored in:** `~/.prompt-pad.json`
            
            ### Post-Installation (macOS)
            
            Grant Accessibility permissions:
            1. Open System Settings > Privacy & Security > Accessibility
            2. Enable PromptPad in the list
            
            ### Changelog
            See [CHANGELOG.md](https://github.com/mschnecke/prompt-pad/blob/main/CHANGELOG.md) for details.
          draft: true
          prerelease: false

  build-tauri:
    needs: create-release
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'macos-latest'
            args: '--target aarch64-apple-darwin'
            arch: 'aarch64'
          - platform: 'macos-latest'
            args: '--target x86_64-apple-darwin'
            arch: 'x64'
          - platform: 'windows-latest'
            args: ''
            arch: 'x64'
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'
      
      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}
      
      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'
      
      - name: Install frontend dependencies
        run: npm ci
      
      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          args: ${{ matrix.args }}
      
      # Build macOS .pkg installer from .app bundle
      - name: Build macOS pkg installer
        if: matrix.platform == 'macos-latest'
        run: |
          VERSION="${{ needs.create-release.outputs.version }}"
          ARCH="${{ matrix.arch }}"
          
          chmod +x packages/macos/build-package.sh
          ./packages/macos/build-package.sh "$VERSION" "$ARCH"
      
      # Upload macOS .pkg to release
      - name: Upload macOS pkg to release
        if: matrix.platform == 'macos-latest'
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ needs.create-release.outputs.upload_url }}
          asset_path: ./dist/PromptPad_${{ needs.create-release.outputs.version }}_${{ matrix.arch }}.pkg
          asset_name: PromptPad_${{ needs.create-release.outputs.version }}_${{ matrix.arch }}.pkg
          asset_content_type: application/octet-stream
      
      # Upload Windows .exe to release (handled by tauri-action, but can be explicit)
      - name: Upload Windows installer to release
        if: matrix.platform == 'windows-latest'
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ needs.create-release.outputs.upload_url }}
          asset_path: ./src-tauri/target/release/bundle/nsis/PromptPad_${{ needs.create-release.outputs.version }}_x64-setup.exe
          asset_name: PromptPad_${{ needs.create-release.outputs.version }}_x64-setup.exe
          asset_content_type: application/octet-stream

  publish-release:
    needs: [create-release, build-tauri]
    runs-on: ubuntu-latest
    steps:
      - name: Publish release
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.repos.updateRelease({
              owner: context.repo.owner,
              repo: context.repo.repo,
              release_id: ${{ needs.create-release.outputs.release_id }},
              draft: false
            });

  update-homebrew:
    needs: [create-release, publish-release]
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Homebrew cask update
        uses: peter-evans/repository-dispatch@v2
        with:
          token: ${{ secrets.HOMEBREW_TAP_TOKEN }}
          repository: mschnecke/homebrew-prompt-pad
          event-type: update-cask
          client-payload: '{"version": "${{ needs.create-release.outputs.version }}"}'

  update-chocolatey:
    needs: [create-release, publish-release]
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Download Windows installer
        run: |
          $version = "${{ needs.create-release.outputs.version }}"
          Invoke-WebRequest -Uri "https://github.com/mschnecke/prompt-pad/releases/download/v$version/PromptPad_${version}_x64-setup.exe" -OutFile "PromptPad-Setup.exe"
      
      - name: Generate checksum
        id: checksum
        run: |
          $hash = (Get-FileHash -Path "PromptPad-Setup.exe" -Algorithm SHA256).Hash
          echo "sha256=$hash" >> $env:GITHUB_OUTPUT
      
      - name: Update Chocolatey package
        run: |
          $version = "${{ needs.create-release.outputs.version }}"
          $sha256 = "${{ steps.checksum.outputs.sha256 }}"
          
          # Update chocolateyInstall.ps1
          $installScript = Get-Content packages/chocolatey/tools/chocolateyInstall.ps1 -Raw
          $installScript = $installScript -replace 'url64bit\s*=\s*''.*''', "url64bit = 'https://github.com/mschnecke/prompt-pad/releases/download/v$version/PromptPad_${version}_x64-setup.exe'"
          $installScript = $installScript -replace 'checksum64\s*=\s*''.*''', "checksum64 = '$sha256'"
          Set-Content -Path packages/chocolatey/tools/chocolateyInstall.ps1 -Value $installScript
          
          # Update nuspec version
          $nuspec = Get-Content packages/chocolatey/prompt-pad.nuspec -Raw
          $nuspec = $nuspec -replace '<version>.*</version>', "<version>$version</version>"
          Set-Content -Path packages/chocolatey/prompt-pad.nuspec -Value $nuspec
      
      - name: Pack Chocolatey package
        run: |
          cd packages/chocolatey
          choco pack
      
      - name: Setup .NET for NuGet push
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      
      - name: Publish to MyGet
        env:
          MYGET_API_KEY: ${{ secrets.MYGET_API_KEY }}
        run: |
          $version = "${{ needs.create-release.outputs.version }}"
          dotnet nuget push "packages/chocolatey/prompt-pad.$version.nupkg" `
            --source "https://www.myget.org/F/mschnecke/api/v3/index.json" `
            --api-key $env:MYGET_API_KEY
```

---

## 8. Homebrew Distribution (using .pkg installers)

### 8.1 macOS Package Builder

Create `packages/macos/build-package.sh` to build .pkg installers from the Tauri .app bundle:

```bash
#!/bin/bash
# packages/macos/build-package.sh
# Usage: ./build-package.sh <version> <arch>
# Example: ./build-package.sh 1.0.0 aarch64
#          ./build-package.sh 1.0.0 x64

set -e

VERSION=$1
ARCH=$2

if [ -z "$VERSION" ] || [ -z "$ARCH" ]; then
    echo "Usage: $0 <version> <arch>"
    echo "  arch: aarch64 or x64"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_NAME="PromptPad"
BUNDLE_ID="com.promptpad.app"
INSTALL_LOCATION="/Applications"

# Determine source .app location based on architecture
if [ "$ARCH" == "aarch64" ]; then
    APP_PATH="$PROJECT_ROOT/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/${APP_NAME}.app"
else
    APP_PATH="$PROJECT_ROOT/src-tauri/target/x86_64-apple-darwin/release/bundle/macos/${APP_NAME}.app"
fi

if [ ! -d "$APP_PATH" ]; then
    echo "Error: App bundle not found at $APP_PATH"
    exit 1
fi

# Create temporary directory for package contents
PKG_ROOT=$(mktemp -d)
SCRIPTS_DIR="$SCRIPT_DIR"
OUTPUT_DIR="$PROJECT_ROOT/dist"
mkdir -p "$OUTPUT_DIR"

# Copy .app to package root
mkdir -p "$PKG_ROOT/Applications"
cp -R "$APP_PATH" "$PKG_ROOT/Applications/"

# Build the component package
COMPONENT_PKG="$OUTPUT_DIR/${APP_NAME}_${VERSION}_${ARCH}_component.pkg"
pkgbuild \
    --root "$PKG_ROOT" \
    --identifier "$BUNDLE_ID" \
    --version "$VERSION" \
    --install-location "/" \
    --scripts "$SCRIPTS_DIR" \
    "$COMPONENT_PKG"

# Build the final distribution package (product archive)
FINAL_PKG="$OUTPUT_DIR/${APP_NAME}_${VERSION}_${ARCH}.pkg"
productbuild \
    --package "$COMPONENT_PKG" \
    --identifier "${BUNDLE_ID}.installer" \
    --version "$VERSION" \
    "$FINAL_PKG"

# Clean up
rm -rf "$PKG_ROOT"
rm -f "$COMPONENT_PKG"

echo "✓ Created: $FINAL_PKG"
echo "  Size: $(du -h "$FINAL_PKG" | cut -f1)"
```

### 8.2 Post-Installation Script

Create `packages/macos/postinstall` to handle post-installation tasks:

```bash
#!/bin/bash
# packages/macos/postinstall
# Runs after the .pkg installation completes

APP_PATH="/Applications/PromptPad.app"

# Remove quarantine attribute (allows app to run without Gatekeeper warning)
if [ -d "$APP_PATH" ]; then
    xattr -rd com.apple.quarantine "$APP_PATH" 2>/dev/null || true
fi

# Notify user about Accessibility permissions
osascript -e 'display notification "Please grant Accessibility permissions in System Settings > Privacy & Security > Accessibility" with title "PromptPad Installed" subtitle "One more step needed"' 2>/dev/null || true

exit 0
```

Make it executable: `chmod +x packages/macos/postinstall`

### 8.3 Homebrew Tap Setup

The Homebrew tap is maintained in a separate repository: `mschnecke/homebrew-prompt-pad`

See **homebrew-prompt-pad-PRD.md** for complete documentation including:
- Repository structure
- Cask definition (`Casks/prompt-pad.rb`)
- Automated update workflow
- README.md and CLAUDE.md templates
- Testing and troubleshooting

Repository structure:
```
homebrew-prompt-pad/
├── .github/
│   └── workflows/
│       └── update-cask.yml      # Automated cask updates
├── Casks/
│   └── prompt-pad.rb            # Homebrew cask definition
├── CLAUDE.md
└── README.md
```

### 8.4 Homebrew Tap Update Workflow

The update workflow in the homebrew-prompt-pad repository is triggered automatically when a new release is published. See **homebrew-prompt-pad-PRD.md** for the complete workflow definition.

**Trigger from main repo (in release.yml):**

```yaml
update-homebrew:
  needs: [create-release, publish-release]
  runs-on: ubuntu-latest
  steps:
    - name: Trigger Homebrew cask update
      uses: peter-evans/repository-dispatch@v2
      with:
        token: ${{ secrets.HOMEBREW_TAP_TOKEN }}
        repository: mschnecke/homebrew-prompt-pad
        event-type: update-cask
        client-payload: '{"version": "${{ needs.create-release.outputs.version }}"}'
```

### 8.5 User Installation

```bash
# Add tap (one-time)
brew tap mschnecke/prompt-pad

# Install
brew install --cask prompt-pad

# Update
brew upgrade --cask prompt-pad

# Uninstall (keeps user data)
brew uninstall --cask prompt-pad

# Full uninstall (removes all user data via zap)
brew uninstall --cask --zap prompt-pad

# Remove tap
brew untap mschnecke/prompt-pad
```

---

## 9. Chocolatey Distribution

Chocolatey packages are distributed via **MyGet** (not the Chocolatey Community Repository). This provides full control over distribution without the review process of the community repository.

MyGet feed URL: `https://www.myget.org/F/mschnecke/api/v3/index.json`

### 9.1 Package Structure

```
packages/chocolatey/
├── prompt-pad.nuspec          # Package manifest
├── tools/
│   ├── chocolateyInstall.ps1  # Installation script
│   ├── chocolateyUninstall.ps1 # Uninstallation script
│   └── LICENSE.txt            # License file
└── icons/
    └── prompt-pad.png         # Package icon (48x48 or larger)
```

### 9.2 Nuspec File (prompt-pad.nuspec)

```xml
<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2015/06/nuspec.xsd">
  <metadata>
    <id>prompt-pad</id>
    <version>1.0.0</version>
    <title>PromptPad</title>
    <authors>Pisum Projects</authors>
    <owners>mschnecke</owners>
    <projectUrl>https://github.com/mschnecke/prompt-pad</projectUrl>
    <licenseUrl>https://github.com/mschnecke/prompt-pad/blob/main/LICENSE</licenseUrl>
    <iconUrl>https://raw.githubusercontent.com/mschnecke/prompt-pad/main/src-tauri/icons/icon.png</iconUrl>
    <requireLicenseAcceptance>false</requireLicenseAcceptance>
    <description>
PromptPad is a Spotlight-style prompt launcher for Windows. 
Access your prompt library instantly with a global hotkey, search with fuzzy matching, 
and paste directly into any application.

Features:
- Global hotkey activation (Ctrl+Shift+P)
- Fuzzy search across prompts by name, tags, folder, or description
- Rider mode - add context to any prompt before pasting
- WYSIWYG Markdown editing with TipTap
- Folder and tag organization
- Import/export prompts as JSON or markdown
- Frequency-based sorting (most-used prompts first)
- Light, dark, and system themes
- Configurable storage location
- Launch at startup option
    </description>
    <summary>Spotlight-style prompt launcher for Windows</summary>
    <releaseNotes>https://github.com/mschnecke/prompt-pad/releases</releaseNotes>
    <tags>prompt-pad promptpad prompt launcher clipboard productivity ai tauri</tags>
    <packageSourceUrl>https://github.com/mschnecke/prompt-pad/tree/main/packages/chocolatey</packageSourceUrl>
    <docsUrl>https://github.com/mschnecke/prompt-pad#readme</docsUrl>
    <bugTrackerUrl>https://github.com/mschnecke/prompt-pad/issues</bugTrackerUrl>
  </metadata>
  <files>
    <file src="tools\**" target="tools" />
  </files>
</package>
```

### 9.3 Installation Script (chocolateyInstall.ps1)

```powershell
$ErrorActionPreference = 'Stop'

$packageName = 'prompt-pad'
$toolsDir = "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)"

$packageArgs = @{
  packageName    = $packageName
  fileType       = 'exe'
  url64bit       = 'https://github.com/mschnecke/prompt-pad/releases/download/v1.0.0/PromptPad_1.0.0_x64-setup.exe'
  softwareName   = 'PromptPad*'
  checksum64     = 'PLACEHOLDER_SHA256'
  checksumType64 = 'sha256'
  silentArgs     = '/S'
  validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs

# Create Start Menu shortcut
$shortcutPath = Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\PromptPad.lnk'
$targetPath = Join-Path $env:LOCALAPPDATA 'Programs\PromptPad\PromptPad.exe'

if (Test-Path $targetPath) {
  Install-ChocolateyShortcut -ShortcutFilePath $shortcutPath -TargetPath $targetPath
}

Write-Host @"

PromptPad has been installed!

Default hotkey: Ctrl+Shift+P
Prompts are stored in: $env:USERPROFILE\.prompt-pad\prompts\
Settings are stored in: $env:USERPROFILE\.prompt-pad.json

To start PromptPad:
1. Search for 'PromptPad' in the Start Menu, or
2. Press Ctrl+Shift+P from any application

"@
```

### 9.4 Uninstallation Script (chocolateyUninstall.ps1)

```powershell
$ErrorActionPreference = 'Stop'

$packageName = 'prompt-pad'
$softwareName = 'PromptPad*'
$installerType = 'exe'
$silentArgs = '/S'
$validExitCodes = @(0)

$uninstallKey = Get-UninstallRegistryKey -SoftwareName $softwareName

if ($uninstallKey.Count -eq 1) {
  $uninstallKey | ForEach-Object {
    $uninstallString = $_.UninstallString
    
    Uninstall-ChocolateyPackage -PackageName $packageName `
                                 -FileType $installerType `
                                 -SilentArgs $silentArgs `
                                 -ValidExitCodes $validExitCodes `
                                 -File $uninstallString
  }
} elseif ($uninstallKey.Count -eq 0) {
  Write-Warning "$packageName has already been uninstalled by other means."
} else {
  Write-Warning "$($uninstallKey.Count) matches found!"
  Write-Warning "To prevent data loss, no programs will be uninstalled."
}

# Remove Start Menu shortcut
$shortcutPath = Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\PromptPad.lnk'
if (Test-Path $shortcutPath) {
  Remove-Item $shortcutPath -Force
}

Write-Host @"

PromptPad has been uninstalled.

Note: Your prompts and settings are preserved in:
  - $env:USERPROFILE\.prompt-pad\
  - $env:USERPROFILE\.prompt-pad.json

Delete these manually if you want to remove all data.

"@
```

### 9.5 Distribution via MyGet

The `.nupkg` package is published to MyGet during the release workflow. See Section 7.2 for implementation details.

### 9.6 User Installation

```powershell
# Add MyGet source (one-time setup)
choco source add -n="mschnecke" -s="https://www.myget.org/F/mschnecke/api/v3/index.json"

# Install
choco install prompt-pad -s="mschnecke"

# Update
choco upgrade prompt-pad -s="mschnecke"

# Uninstall
choco uninstall prompt-pad
```

---

## 10. Required Secrets

### 10.1 MyGet Publishing

For publishing Chocolatey packages to MyGet:

| Secret | Description |
|--------|-------------|
| `MYGET_API_KEY` | MyGet API key for package publishing |

**Setup Steps:**

1. Log in to MyGet at https://www.myget.org/
2. Go to your feed settings (mschnecke)
3. Navigate to "Feed Details" → "API Keys"
4. Create a new API key with push permissions
5. Add `MYGET_API_KEY` secret to GitHub repository

### 10.2 Homebrew Tap Access

For updating the Homebrew tap repository:

| Secret | Description |
|--------|-------------|
| `HOMEBREW_TAP_TOKEN` | GitHub PAT with repo access to homebrew-prompt-pad |

**Setup Steps:**

1. Create a GitHub Personal Access Token with `repo` scope
2. Add `HOMEBREW_TAP_TOKEN` secret to GitHub repository

---

## 11. Release Checklist

### 11.1 Pre-Release

- [ ] All tests passing on main branch (`npm run test:run`)
- [ ] Linting passes (`npm run lint`)
- [ ] Formatting is correct (`npm run format:check`)
- [ ] CHANGELOG.md updated with new version
- [ ] Version bumped in all files (package.json, Cargo.toml, tauri.conf.json, prompt-pad.nuspec)
- [ ] README.md updated if needed
- [ ] Local build tested on Windows (`npm run tauri build`)
- [ ] Local build tested on macOS (`npm run tauri build`)
- [ ] Built applications tested from `src-tauri/target/release/bundle/`

### 11.2 Release Process

1. **Run tests and linting:**
   ```bash
   npm run lint
   npm run test:run
   npm run format:check
   ```

2. **Bump version:**
   ```bash
   ./scripts/bump-version.sh 1.0.0
   ```

3. **Commit changes:**
   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.0"
   ```

4. **Create annotated tag:**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   ```

5. **Push to trigger release:**
   ```bash
   git push origin main
   git push origin v1.0.0
   ```

6. **Monitor GitHub Actions:**
   - CI tests pass
   - Release builds complete for macOS (ARM + Intel) and Windows
   - Artifacts uploaded to GitHub Release
   - Homebrew tap updated
   - Chocolatey package published

### 11.3 Post-Release

- [ ] Verify GitHub Release contains all artifacts:
  - `PromptPad_X.Y.Z_aarch64.pkg` (macOS ARM)
  - `PromptPad_X.Y.Z_x64.pkg` (macOS Intel)
  - `PromptPad_X.Y.Z_x64-setup.exe` (Windows)
- [ ] Test `brew install --cask mschnecke/prompt-pad/prompt-pad`
- [ ] Test `choco install prompt-pad` (after moderation, ~48 hours)
- [ ] Verify app launches and hotkey works on both platforms
- [ ] Announce release on relevant channels
- [ ] Update documentation if needed

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Build success rate | > 99% |
| Time from tag to release | < 30 minutes |
| Homebrew cask update time | < 1 hour |
| MyGet publish time | < 5 minutes |
| Download count per release | Track growth |
| Package manager installation ratio | > 50% of downloads |

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| GitHub Actions minutes exhaustion | Monitor usage, optimize workflows |
| MyGet service outage | Keep .nupkg in GitHub Releases as backup |
| Homebrew cask rejection | Follow guidelines, test locally first |
| Breaking changes in tauri-action | Pin to specific version, test updates |

---

## 14. Future Considerations

1. **Auto-updater:** Integrate tauri-plugin-updater for in-app updates
2. **Linux support:** Add AppImage/Flatpak/Snap distribution
3. **Release notes automation:** Generate from conventional commits
4. **Beta channel:** Separate beta releases for early testing
5. **CDN distribution:** CloudFlare/AWS for faster downloads
6. **Winget support:** Add Windows Package Manager (winget) distribution

---

## 15. References

### Related Documents

- **homebrew-prompt-pad-PRD.md** - Complete PRD for the Homebrew tap repository

### External Documentation

- [Tauri GitHub Action](https://github.com/tauri-apps/tauri-action)
- [Tauri Distribution Guide](https://v2.tauri.app/distribute/pipelines/github/)
- [Homebrew Tap Documentation](https://docs.brew.sh/How-to-Create-and-Maintain-a-Tap)
- [Homebrew Cask Cookbook](https://docs.brew.sh/Cask-Cookbook)
- [MyGet Documentation](https://docs.myget.org/)
- [Chocolatey Package Creation](https://docs.chocolatey.org/en-us/create/create-packages/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
