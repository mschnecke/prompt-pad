# macOS Package Building

This directory contains scripts for building macOS `.pkg` installers from the Tauri `.app` bundle.

## Prerequisites

- macOS with Xcode Command Line Tools installed
- Built Tauri app (`.app` bundle)

## Scripts

### build-package.sh

Builds a `.pkg` installer from the Tauri-built `.app` bundle.

```bash
./build-package.sh <version> <arch>
```

**Arguments:**
- `version`: The version number (e.g., `1.0.0`)
- `arch`: Target architecture - `aarch64` (Apple Silicon) or `x64` (Intel)

**Example:**
```bash
# Build for Apple Silicon
./build-package.sh 1.0.0 aarch64

# Build for Intel
./build-package.sh 1.0.0 x64
```

**Output:**
- `dist/PromptPad_1.0.0_aarch64.pkg` or `dist/PromptPad_1.0.0_x64.pkg`

### postinstall

Post-installation script that runs after the `.pkg` is installed:
- Removes quarantine attribute from the app
- Displays a notification about Accessibility permissions

## Package Structure

The built `.pkg` installs:
- `/Applications/PromptPad.app`

## Manual Building

If you need to build manually:

1. Build the Tauri app:
   ```bash
   npm run tauri build -- --target aarch64-apple-darwin  # Apple Silicon
   npm run tauri build -- --target x86_64-apple-darwin   # Intel
   ```

2. Run the package builder:
   ```bash
   ./packages/macos/build-package.sh 1.0.0 aarch64
   ```

3. The `.pkg` will be created in the `dist/` directory.

## Signing and Notarization

For distribution outside of Homebrew, you may want to sign and notarize the package:

```bash
# Sign the package (requires Developer ID Installer certificate)
productsign --sign "Developer ID Installer: Your Name (TEAM_ID)" \
  dist/PromptPad_1.0.0_aarch64.pkg \
  dist/PromptPad_1.0.0_aarch64-signed.pkg

# Notarize (requires Apple Developer account)
xcrun notarytool submit dist/PromptPad_1.0.0_aarch64-signed.pkg \
  --apple-id "your@email.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password" \
  --wait

# Staple the notarization ticket
xcrun stapler staple dist/PromptPad_1.0.0_aarch64-signed.pkg
```

## Troubleshooting

**"App bundle not found" error:**
- Ensure you've built the Tauri app first with `npm run tauri build`
- Check the target architecture matches what you built

**Package won't install:**
- Check Console.app for installer logs
- Verify the postinstall script has execute permissions
