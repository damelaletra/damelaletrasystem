import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUB_HOLA = path.resolve(HERE, '../../public/hola');
const OUT_MEDIA = path.join(PUB_HOLA, 'media');
const OUT_MAYOR = path.join(PUB_HOLA, 'mayor-viewer');
const FF = 'C:/Users/migue/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffmpeg.exe';
const ff = (args) => execFileSync(FF, ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });

// 1. Re-encode elys-loop.mp4 starting at ss=3.2s (after the Dame la Letra intro crossfade finishes)
const elysReelSrc = 'C:/TRABAJO/ely charcuteria/elys-brand-reveal-reel.mp4';
ff([
  '-ss', '3.2', '-t', '8', '-i', elysReelSrc, '-an',
  '-vf', 'scale=360:-2:flags=lanczos,fps=24,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-profile:v', 'main', '-movflags', '+faststart',
  path.join(OUT_MEDIA, 'elys-loop.mp4')
]);
// Poster at t=8.5s where the full gold logo on burgundy is shown
ff(['-ss', '8.5', '-i', elysReelSrc, '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '4', path.join(OUT_MEDIA, 'elys-poster.jpg')]);
console.log('1. Re-encoded elys-loop.mp4 (ss=3.2s) and elys-poster.jpg (ss=8.5s).');

// 2. Re-encode labonita-reimagined-loop.mp4 starting at ss=1.8s (directly on the marble hand + onyx gold ring + REIMAGINED)
const lb2459Src = 'C:/Users/migue/Downloads/Luxury_jewelry_art_film_prompt_20260914232459.mp4';
ff([
  '-ss', '1.8', '-t', '7.8', '-i', lb2459Src, '-an',
  '-vf', 'scale=360:-2:flags=lanczos,fps=24,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-profile:v', 'main', '-movflags', '+faststart',
  path.join(OUT_MEDIA, 'labonita-reimagined-loop.mp4')
]);
console.log('2. Re-encoded labonita-reimagined-loop.mp4 starting at ss=1.8s.');

// 3. Make mobile toolbar in public/hola/mayor-viewer/index.html compact on mobile screens
const mayorHtmlPath = path.join(OUT_MAYOR, 'index.html');
let mayorHtml = fs.readFileSync(mayorHtmlPath, 'utf8');
const mobileCss = `
  @media (max-width: 900px) {
    .ca-title { display: none; }
    .ca-slider-group, .ca-divider { display: none; }
    .ca-toolbar { top: 6px; left: 6px; right: 6px; padding: 6px 8px; gap: 4px; border-radius: 8px; }
    .ca-controls { gap: 4px; justify-content: center; width: 100%; }
    .ca-btn { padding: 4px 7px; font-size: 9.5px; border-radius: 4px; }
  }`;
mayorHtml = mayorHtml.replace(/@media\s*\(max-width:\s*900px\)\s*\{\s*\.ca-title\s*\{\s*display:\s*none;\s*\}\s*\}/, mobileCss);
fs.writeFileSync(mayorHtmlPath, mayorHtml, 'utf8');
console.log('3. Updated mobile responsive toolbar in mayor-viewer/index.html.');
