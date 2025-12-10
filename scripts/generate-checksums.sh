#!/bin/bash
# scripts/generate-checksums.sh
# Generates SHA256 checksums for release artifacts
# Usage: ./scripts/generate-checksums.sh [directory]

set -e

DIST_DIR="${1:-./dist}"

if [ ! -d "$DIST_DIR" ]; then
  echo "Error: Directory $DIST_DIR does not exist"
  exit 1
fi

echo "Generating SHA256 checksums for files in $DIST_DIR..."
echo ""

# Find all release artifacts
for file in "$DIST_DIR"/*.{pkg,exe,dmg,AppImage,deb} 2>/dev/null; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")

    # Generate checksum based on OS
    if command -v sha256sum &> /dev/null; then
      # Linux
      checksum=$(sha256sum "$file" | awk '{print $1}')
    elif command -v shasum &> /dev/null; then
      # macOS
      checksum=$(shasum -a 256 "$file" | awk '{print $1}')
    else
      echo "Error: No SHA256 tool found"
      exit 1
    fi

    echo "$filename:"
    echo "  SHA256: $checksum"
    echo ""

    # Also write to .sha256 file
    echo "$checksum  $filename" > "$file.sha256"
  fi
done

echo "Checksum files created in $DIST_DIR"
