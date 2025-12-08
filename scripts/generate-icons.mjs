// Generate valid RGBA PNG icons for Tauri using sharp
import sharp from 'sharp';
import { mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'src-tauri', 'icons');

if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

async function createIcon(size, filename) {
  // Create a simple blue square with white "P"
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#3B82F6"/>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${size * 0.55}"
            font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">P</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(iconsDir, filename));

  console.log(`Created ${filename} (${size}x${size})`);
}

async function main() {
  // Create PNG icons
  await createIcon(32, '32x32.png');
  await createIcon(128, '128x128.png');
  await createIcon(256, '128x128@2x.png');
  await createIcon(512, 'icon.png');

  // Copy icon.png as placeholders for ico/icns (Tauri will use PNG in dev)
  const iconPng = join(iconsDir, 'icon.png');
  copyFileSync(iconPng, join(iconsDir, 'icon.ico'));
  copyFileSync(iconPng, join(iconsDir, 'icon.icns'));

  console.log('\nIcons created successfully!');
}

main().catch(console.error);
