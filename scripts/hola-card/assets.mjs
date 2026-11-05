// Processes brand textures, founder portrait, CRM screenshots, and client logos into public/hola/img/
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_IMG = path.resolve(HERE, '../../public/hola/img');
const OUT_LOGOS = path.join(OUT_IMG, 'logos');
fs.mkdirSync(OUT_LOGOS, { recursive: true });

// 1. Brand identity assets from C:\TRABAJO\TRABAJO\LA LETRA\app
const APP_DIR = 'C:/TRABAJO/TRABAJO/LA LETRA/app';
await sharp(path.join(APP_DIR, 'background.png'))
  .webp({ quality: 82, effort: 6 })
  .toFile(path.join(OUT_IMG, 'dml-bg.webp'));

await sharp(path.join(APP_DIR, 'logo 2.1.png'))
  .png({ compressionLevel: 9 })
  .toFile(path.join(OUT_IMG, 'dame-la-letra-logo-white.png'));

await sharp(path.join(APP_DIR, 'logo.png'))
  .png({ compressionLevel: 9 })
  .toFile(path.join(OUT_IMG, 'dame-la-letra-logo-stacked.png'));

// 2. Founder cutout portrait (preserving alpha transparency, trimmed to non-transparent bounds)
const dlDir = 'C:/Users/migue/Downloads';
const founderFile = fs.readdirSync(dlDir).find((f) => f.startsWith('Man_editing_black-and-white_port') && f.endsWith('.png'));
if (!founderFile) throw new Error('Founder portrait not found in Downloads');
const founderPath = path.join(dlDir, founderFile);

const trimmed = await sharp(founderPath).trim().toBuffer();
const meta = await sharp(trimmed).metadata();
console.log('Founder trimmed dimensions:', meta.width, 'x', meta.height);

await sharp(trimmed)
  .resize({ width: 520, withoutEnlargement: true })
  .webp({ quality: 82, alphaQuality: 90, effort: 6 })
  .toFile(path.join(OUT_IMG, 'miguel-sosa-520.webp'));

await sharp(trimmed)
  .resize({ width: 960, withoutEnlargement: true })
  .webp({ quality: 84, alphaQuality: 92, effort: 6 })
  .toFile(path.join(OUT_IMG, 'miguel-sosa-960.webp'));

// 3. Barba CRM screenshots
const crmDir = 'C:/TRABAJO/barba construction/barba-crm/portfolio_screenshots';
for (const [src, dest] of [
  ['projects_board.png', 'barba-crm-board.webp'],
  ['estimates_list.png', 'barba-crm-estimates.webp'],
  ['crm_pipeline.png', 'barba-crm-pipeline.webp'],
]) {
  await sharp(path.join(crmDir, src))
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toFile(path.join(OUT_IMG, dest));
}

// 4. Client logos for interactive marquee
const logoSources = [
  ['barba', 'C:/TRABAJO/Portfolio/public/logos/barba.png'],
  ['clover-jewelry', 'C:/TRABAJO/Portfolio/public/logos/clover-jewelry.png'],
  ['edward', 'C:/TRABAJO/Portfolio/public/logos/edward.png'],
  ['pool-extended', 'C:/TRABAJO/Portfolio/public/logos/pool-extended.png'],
  ['tri-lion', 'C:/TRABAJO/Portfolio/public/logos/tri-lion.png'],
  ['tzel', 'C:/TRABAJO/Portfolio/public/logos/tzel.png'],
  ['zhomes', 'C:/TRABAJO/Portfolio/public/logos/zhomes.png'],
];

for (const [id, src] of logoSources) {
  if (!fs.existsSync(src)) continue;
  await sharp(src)
    .trim()
    .resize({ height: 140, width: 340, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 92, effort: 6 })
    .toFile(path.join(OUT_LOGOS, `${id}.webp`));
}

console.log('Assets processed successfully.');
