/**
 * generate-favicon.mjs
 * Génère un favicon circulaire (favicon.png) à partir de LOGO.jpg
 * Usage: npm run generate-favicon
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const inputPath = join(publicDir, 'LOGO.jpg');
const outputPath = join(publicDir, 'favicon.png');

const SIZE = 64; // taille du favicon en pixels

// Masque SVG circulaire
const circleMask = Buffer.from(
  `<svg width="${SIZE}" height="${SIZE}">
    <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="white"/>
  </svg>`
);

async function generateFavicon() {
  console.log('🔄 Génération du favicon circulaire...');

  await sharp(inputPath)
    .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toFile(outputPath);

  console.log(`✅ Favicon circulaire généré : public/favicon.png (${SIZE}x${SIZE}px)`);

  // Générer aussi une version 32x32 pour les navigateurs plus anciens
  const outputPath32 = join(publicDir, 'favicon-32.png');
  const circleMask32 = Buffer.from(
    `<svg width="32" height="32">
      <circle cx="16" cy="16" r="16" fill="white"/>
    </svg>`
  );

  await sharp(inputPath)
    .resize(32, 32, { fit: 'cover', position: 'centre' })
    .composite([{ input: circleMask32, blend: 'dest-in' }])
    .png()
    .toFile(outputPath32);

  console.log('✅ Version 32x32 générée : public/favicon-32.png');
  console.log('\n🎉 Terminé ! Le favicon circulaire est prêt.');
}

generateFavicon().catch((err) => {
  console.error('❌ Erreur lors de la génération :', err.message);
  process.exit(1);
});
