const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const APP_DIR = path.join(__dirname, '..', 'src', 'app');
const SVG_PATH = path.join(ICONS_DIR, 'icon.svg');
const MASKABLE_SVG_PATH = path.join(ICONS_DIR, 'icon-maskable.svg');

const SIZES = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512];

async function generate() {
  console.log('Generating PWA icons...\n');

  // Generate standard PNG icons
  for (const size of SIZES) {
    const out = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(SVG_PATH)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(out);
    console.log(`  ${out}`);
  }

  // Generate maskable PNG icons (512x512 and 192x192)
  for (const size of [192, 512]) {
    const out = path.join(ICONS_DIR, `icon-maskable-${size}x${size}.png`);
    await sharp(MASKABLE_SVG_PATH)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(out);
    console.log(`  ${out}`);
  }

  // Generate apple-touch-icon.png (180x180)
  const appleOut = path.join(ICONS_DIR, 'apple-touch-icon.png');
  await sharp(SVG_PATH)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(appleOut);
  console.log(`  ${appleOut}`);

  // Generate favicon.ico (multi-resolution: 16 + 32 + 48)
  const ico16 = await sharp(SVG_PATH).resize(16, 16).png().toBuffer();
  const ico32 = await sharp(SVG_PATH).resize(32, 32).png().toBuffer();
  const ico48 = await sharp(SVG_PATH).resize(48, 48).png().toBuffer();

  // Write as PNG since .ico generation needs a dedicated library
  // Next.js handles favicon.ico as PNG fallback
  const faviconOut = path.join(APP_DIR, 'favicon.png');
  await sharp(SVG_PATH)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(faviconOut);
  console.log(`  ${faviconOut}`);

  console.log('\nDone! Generated', SIZES.length + 4, 'icon files.');
}

generate().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
