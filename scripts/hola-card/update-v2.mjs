import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUB_HOLA = path.resolve(HERE, '../../public/hola');
const OUT_IMG = path.join(PUB_HOLA, 'img');
const OUT_LOGOS = path.join(OUT_IMG, 'logos');
const OUT_MEDIA = path.join(PUB_HOLA, 'media');
const OUT_MAYOR = path.join(PUB_HOLA, 'mayor-viewer');
const FF = 'C:/Users/migue/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffmpeg.exe';

fs.mkdirSync(OUT_IMG, { recursive: true });
fs.mkdirSync(OUT_LOGOS, { recursive: true });
fs.mkdirSync(OUT_MEDIA, { recursive: true });
fs.mkdirSync(OUT_MAYOR, { recursive: true });

const ff = (args) => execFileSync(FF, ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });

// 1. Ely's secondary image: 2_bolsa_boutique_y_grazing_cups.jpg
const elysBagSrc = 'C:/TRABAJO/ely charcuteria/mockups_fotograficos/para reel modificarlos a vertical 16 9/2_bolsa_boutique_y_grazing_cups.jpg';
await sharp(elysBagSrc)
  .resize({ width: 480, withoutEnlargement: true })
  .webp({ quality: 80, effort: 6 })
  .toFile(path.join(OUT_IMG, 'elys-bag-480.webp'));
await sharp(elysBagSrc)
  .resize({ width: 820, withoutEnlargement: true })
  .webp({ quality: 82, effort: 6 })
  .toFile(path.join(OUT_IMG, 'elys-bag-820.webp'));
console.log('1a. Ely bag WebPs generated.');

// Extract a clean logo poster frame from elys-brand-reveal-reel.mp4 (at t=2.2s where the gold seal/logo is crisp)
const elysReelSrc = 'C:/TRABAJO/ely charcuteria/elys-brand-reveal-reel.mp4';
ff(['-ss', '2.5', '-i', elysReelSrc, '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '4', path.join(OUT_MEDIA, 'elys-poster.jpg')]);
console.log('1b. Ely poster updated.');

// 2. Lucky Shaker secondary image: f_201.webp
const luckyCanSrc = 'C:/TRABAJO/Lucky Shaker/assets/real_frames/mob/f_201.webp';
await sharp(luckyCanSrc)
  .resize({ width: 480, withoutEnlargement: true })
  .webp({ quality: 80, effort: 6 })
  .toFile(path.join(OUT_IMG, 'lucky-can-480.webp'));
await sharp(luckyCanSrc)
  .resize({ width: 820, withoutEnlargement: true })
  .webp({ quality: 82, effort: 6 })
  .toFile(path.join(OUT_IMG, 'lucky-can-820.webp'));
console.log('2. Lucky Shaker can WebPs generated.');

// 3. La Bonita 03 video: Luxury_jewelry_art_film_prompt_20260914232459.mp4
const lb2459Src = 'C:/Users/migue/Downloads/Luxury_jewelry_art_film_prompt_20260914232459.mp4';
const lbLoop = path.join(OUT_MEDIA, 'labonita-reimagined-loop.mp4');
const lbFull = path.join(OUT_MEDIA, 'labonita-reimagined.mp4');
const lbPoster = path.join(OUT_MEDIA, 'labonita-reimagined-poster.jpg');

ff([
  '-ss', '0.5', '-t', '7.5', '-i', lb2459Src, '-an',
  '-vf', 'scale=360:-2:flags=lanczos,fps=24,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-profile:v', 'main', '-movflags', '+faststart',
  lbLoop
]);
ff([
  '-i', lb2459Src, '-t', '10',
  '-vf', 'scale=720:-2:flags=lanczos,fps=30,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-profile:v', 'high', '-movflags', '+faststart',
  '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
  lbFull
]);
ff(['-ss', '2.0', '-i', lb2459Src, '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '4', lbPoster]);
console.log('3. La Bonita REIMAGINED video + loop + poster generated.');

// 4. ZHomes mobile screenshots from scratch/shots/zhomes-m.png
const zhomesFullMob = 'C:/Users/migue/.gemini/antigravity/brain/65c99efc-65ff-433f-8a5f-22f3705993d2/scratch/shots/zhomes-m.png';
const zMeta = await sharp(zhomesFullMob).metadata();
console.log('4. ZHomes full mobile capture dimensions:', zMeta.width, 'x', zMeta.height);

// Slice into vertical mobile screen segments (each ~1600px tall at 2x retina 780px width)
const sliceH = Math.min(1688, zMeta.height);
const maxTop = Math.max(0, zMeta.height - sliceH);
const offsets = [
  0,
  Math.min(Math.round(zMeta.height * 0.24), maxTop),
  Math.min(Math.round(zMeta.height * 0.50), maxTop),
  Math.min(Math.round(zMeta.height * 0.76), maxTop),
];

for (let i = 0; i < offsets.length; i++) {
  const top = offsets[i];
  const h = Math.min(sliceH, zMeta.height - top);
  await sharp(zhomesFullMob)
    .extract({ left: 0, top, width: zMeta.width, height: h })
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(OUT_IMG, `zhomes-mob-${i + 1}.webp`));
}
console.log('4b. ZHomes mobile screen slices (zhomes-mob-1..4.webp) generated.');

// 5. My Chief CAD — Mayor Project Interactive 3D Viewer + Renders
const mayorDir = 'C:/TRABAJO/PLANOS IDE/proyectos/City_of_Lynnview_Monument';
let viewerHtml = fs.readFileSync(path.join(mayorDir, 'City_of_Lynnview_3D_Interactive_Viewer.html'), 'utf8');
// Strip emojis from toolbar labels to respect zero-emoji rule
viewerHtml = viewerHtml
  .replace(/🔄\s*/g, '')
  .replace(/🖐️\s*/g, '')
  .replace(/☀️\s*/g, '')
  .replace(/🌅\s*/g, '')
  .replace(/🌙\s*/g, '')
  .replace(/📐\s*/g, '')
  .replace(/🧱\s*/g, '')
  .replace(/💡\s*/g, '')
  .replace(/🔍\s*/g, '');
fs.writeFileSync(path.join(OUT_MAYOR, 'index.html'), viewerHtml, 'utf8');

for (const [srcFile, outFile] of [
  ['City_of_Lynnview_3D_Render_Chief_Architect.png', 'mayor-3d-vec.webp'],
  ['City_of_Lynnview_CA_Working_View.png', 'mayor-ca-plan.webp'],
  ['City_of_Lynnview_Render_Blender_Frontal.png', 'mayor-3d-render.webp'],
]) {
  await sharp(path.join(mayorDir, 'imagenes', srcFile))
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(path.join(OUT_IMG, outFile));
}
console.log('5. Mayor 3D Interactive Viewer and Chief Architect sheets generated.');

// 6. Tzel card preview image (dark editorial radar card with Tzel logo + live distress metrics)
const tzelLogoBuf = await sharp('C:/TRABAJO/Portfolio/public/logos/tzel.png')
  .resize({ width: 220, height: 90, fit: 'inside' })
  .png()
  .toBuffer();
const tzelLogoB64 = tzelLogoBuf.toString('base64');

const tzelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="780" height="1040" viewBox="0 0 780 1040">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#070a10"/>
      <stop offset="100%" stop-color="#0d1320"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="28%" r="55%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="780" height="1040" fill="url(#bg)"/>
  <rect width="780" height="1040" fill="url(#glow)"/>
  <g stroke="rgba(255,255,255,0.05)" stroke-width="1">
    <line x1="0" y1="180" x2="780" y2="180"/>
    <line x1="0" y1="360" x2="780" y2="360"/>
    <line x1="0" y1="540" x2="780" y2="540"/>
    <line x1="0" y1="720" x2="780" y2="720"/>
    <line x1="0" y1="900" x2="780" y2="900"/>
    <line x1="195" y1="0" x2="195" y2="1040"/>
    <line x1="390" y1="0" x2="390" y2="1040"/>
    <line x1="585" y1="0" x2="585" y2="1040"/>
  </g>
  <rect x="44" y="44" width="692" height="84" rx="12" fill="#0f172a" stroke="rgba(16,185,129,0.35)" stroke-width="1.5"/>
  <image href="data:image/png;base64,${tzelLogoB64}" x="68" y="56" width="160" height="60" preserveAspectRatio="xMidYMid meet"/>
  <circle cx="545" cy="86" r="6" fill="#10b981"/>
  <text x="562" y="91" fill="#10b981" font-family="Courier New, monospace" font-size="16" font-weight="700" letter-spacing="1.5">RADAR LIVE · 07:00 AM</text>

  <rect x="44" y="156" width="692" height="260" rx="14" fill="#0b111e" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
  <text x="72" y="196" fill="#94a3b8" font-family="Courier New, monospace" font-size="14" letter-spacing="2">JEFFERSON COUNTY · PRE-FORECLOSURE &amp; GIS PIPELINE</text>
  <text x="72" y="252" fill="#f8fafc" font-family="Arial Black, sans-serif" font-size="42" font-weight="900">12 DISTRESS LEADS</text>
  <text x="72" y="286" fill="#10b981" font-family="Courier New, monospace" font-size="18" font-weight="700">PVA + LOJIC GIS + SPARK MLS ARV CROSS-MATCH</text>

  <rect x="72" y="314" width="196" height="74" rx="8" fill="#111a2e" stroke="rgba(16,185,129,0.28)"/>
  <text x="90" y="340" fill="#94a3b8" font-family="Courier New, monospace" font-size="12">EQUITY SPREAD AVG</text>
  <text x="90" y="372" fill="#10b981" font-family="Arial Black, sans-serif" font-size="26">38.4% ARV</text>

  <rect x="288" y="314" width="196" height="74" rx="8" fill="#111a2e" stroke="rgba(255,221,0,0.28)"/>
  <text x="306" y="340" fill="#94a3b8" font-family="Courier New, monospace" font-size="12">COURT DOCKETS</text>
  <text x="306" y="372" fill="#ffdd00" font-family="Arial Black, sans-serif" font-size="26">LIS PENDENS</text>

  <rect x="504" y="314" width="204" height="74" rx="8" fill="#111a2e" stroke="rgba(56,189,248,0.28)"/>
  <text x="522" y="340" fill="#94a3b8" font-family="Courier New, monospace" font-size="12">DISPATCH CHANNEL</text>
  <text x="522" y="372" fill="#38bdf8" font-family="Arial Black, sans-serif" font-size="26">TELEGRAM BOT</text>

  <rect x="44" y="444" width="692" height="172" rx="14" fill="#0b111e" stroke="rgba(16,185,129,0.4)" stroke-width="1.5"/>
  <rect x="68" y="468" width="110" height="26" rx="5" fill="rgba(16,185,129,0.16)"/>
  <text x="80" y="486" fill="#10b981" font-family="Courier New, monospace" font-size="13" font-weight="700">SCORE 94/100</text>
  <text x="196" y="486" fill="#94a3b8" font-family="Courier New, monospace" font-size="14">PARCEL #0482-19 · ZIP 40219 · R-4 ZONING</text>
  <text x="68" y="530" fill="#f8fafc" font-family="Arial, sans-serif" font-size="25" font-weight="700">Tax Delinquency + Code Lien Detected</text>
  <text x="68" y="564" fill="#cbd5e1" font-family="Courier New, monospace" font-size="17">PVA Assessed: $142,000  |  Spark ARV: $248,500</text>
  <text x="68" y="594" fill="#10b981" font-family="Courier New, monospace" font-size="15" font-weight="700">EST. GROSS SPREAD: +$106,500 · OWNER SKIP-TRACED</text>

  <rect x="44" y="640" width="692" height="172" rx="14" fill="#0b111e" stroke="rgba(255,221,0,0.35)" stroke-width="1.5"/>
  <rect x="68" y="664" width="110" height="26" rx="5" fill="rgba(255,221,0,0.15)"/>
  <text x="80" y="682" fill="#ffdd00" font-family="Courier New, monospace" font-size="13" font-weight="700">SCORE 89/100</text>
  <text x="196" y="682" fill="#94a3b8" font-family="Courier New, monospace" font-size="14">PARCEL #1104-08 · ZIP 40214 · R-5A ZONING</text>
  <text x="68" y="726" fill="#f8fafc" font-family="Arial, sans-serif" font-size="25" font-weight="700">Master Commissioner Foreclosure Filing</text>
  <text x="68" y="760" fill="#cbd5e1" font-family="Courier New, monospace" font-size="17">Judgment Amt: $118,400  |  Spark ARV: $215,000</text>
  <text x="68" y="790" fill="#ffdd00" font-family="Courier New, monospace" font-size="15" font-weight="700">EST. GROSS SPREAD: +$96,600 · AUCTION DOCKET #26-CI</text>

  <rect x="44" y="836" width="692" height="156" rx="14" fill="#090e18" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
  <text x="72" y="874" fill="#38bdf8" font-family="Courier New, monospace" font-size="15" font-weight="700">[07:00:02] CRON PIPELINE COMPLETED · 4,820 PARCELS SCANNED</text>
  <text x="72" y="906" fill="#94a3b8" font-family="Courier New, monospace" font-size="14">[07:00:04] LOJIC GIS LAYER: FLOODPLAIN &amp; LOT GEOMETRY VERIFIED</text>
  <text x="72" y="936" fill="#94a3b8" font-family="Courier New, monospace" font-size="14">[07:00:06] SPARK MLS COMPS (0.5 MI RADIUS, 180 DAYS) COMPUTED</text>
  <text x="72" y="966" fill="#10b981" font-family="Courier New, monospace" font-size="15" font-weight="700">[07:00:08] TELEGRAM CONSOLIDATED DIGEST SENT TO ACQUISITION TEAM</text>
</svg>`;

await sharp(Buffer.from(tzelSvg))
  .resize({ width: 600 })
  .webp({ quality: 84, effort: 6 })
  .toFile(path.join(OUT_IMG, 'tzel-card.webp'));
await sharp(Buffer.from(tzelSvg))
  .webp({ quality: 86, effort: 6 })
  .toFile(path.join(OUT_IMG, 'tzel-radar.webp'));
console.log('6. Tzel card and radar images generated.');

// 7. Brand Logos for pure-logo marquee (#marcas)
const extraLogos = [
  ['elys', 'C:/TRABAJO/ely charcuteria/public/brand/logo-horizontal-dorado.png'],
  ['lucky-shaker', 'C:/TRABAJO/Lucky Shaker/assets/lucky_shaker_logo_white.png'],
  ['dphotography', 'C:/TRABAJO/DPhotography/dp web/public/brand/dps-logo-gold-transparent.png'],
  ['la-bonita', 'C:/TRABAJO/La Bonita Joyeria/assets/logo-completo.svg'],
  ['new-era', 'C:/TRABAJO/new era/arm-demo-video/assets/logo-champagne.svg'],
];

for (const [id, src] of extraLogos) {
  if (!fs.existsSync(src)) {
    console.warn('Missing logo source:', src);
    continue;
  }
  await sharp(src, { density: 300 })
    .trim()
    .resize({ height: 140, width: 340, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, alphaQuality: 94, effort: 6 })
    .toFile(path.join(OUT_LOGOS, `${id}.webp`));
  console.log('7. Processed logo:', id);
}

console.log('ALL V2 ASSETS GENERATED SUCCESSFULLY.');
