// scripts/gen-icons.js
const sharp = require('sharp');
const path  = require('path');

const INPUT      = path.resolve(__dirname, '../public/logo.png');
const OUTPUT_DIR = path.resolve(__dirname, '../public');

const sizes = [
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }
];

(async () => {
  for (const { name, size } of sizes) {
    await sharp(INPUT)
      .resize(size, size)
      .toFile(path.join(OUTPUT_DIR, name));
    console.log(`✔️  generato ${name}`);
  }
})().catch(err => {
  console.error(err);
  process.exit(1);
});
