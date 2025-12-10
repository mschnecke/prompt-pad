#!/bin/bash
# scripts/bump-version.sh
# Usage: ./scripts/bump-version.sh [patch|minor|major|X.Y.Z]
# Note: Uses macOS sed syntax. On Linux, remove the '' after -i

set -e

NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
  echo "Usage: $0 [patch|minor|major|X.Y.Z]"
  exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")

if [[ ! $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  # Handle patch/minor/major keywords
  case "$NEW_VERSION" in
    patch) NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g') ;;
    minor) NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$(NF-1) = $(NF-1) + 1; $NF = 0;} 1' | sed 's/ /./g') ;;
    major) NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$1 = $1 + 1; $(NF-1) = 0; $NF = 0;} 1' | sed 's/ /./g') ;;
    *) echo "Usage: $0 [patch|minor|major|X.Y.Z]"; exit 1 ;;
  esac
fi

echo "Bumping version from $CURRENT_VERSION to $NEW_VERSION..."

# Update package.json
npm version $NEW_VERSION --no-git-tag-version

# Detect OS for sed compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
  SED_INPLACE="sed -i ''"
else
  SED_INPLACE="sed -i"
fi

# Update Cargo.toml
$SED_INPLACE "s/^version = \".*\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml

# Update tauri.conf.json
$SED_INPLACE "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" src-tauri/tauri.conf.json

# Update Chocolatey nuspec if it exists
if [ -f "packages/chocolatey/prompt-pad.nuspec" ]; then
  $SED_INPLACE "s/<version>.*<\/version>/<version>$NEW_VERSION<\/version>/" packages/chocolatey/prompt-pad.nuspec
fi

echo ""
echo "Version bumped to $NEW_VERSION"
echo ""
echo "Files updated:"
echo "  - package.json"
echo "  - src-tauri/Cargo.toml"
echo "  - src-tauri/tauri.conf.json"
if [ -f "packages/chocolatey/prompt-pad.nuspec" ]; then
  echo "  - packages/chocolatey/prompt-pad.nuspec"
fi
echo ""
echo "Next steps:"
echo "  git add ."
echo "  git commit -m 'chore: bump version to $NEW_VERSION'"
echo "  git tag -a v$NEW_VERSION -m 'Release v$NEW_VERSION'"
echo "  git push origin main --tags"
