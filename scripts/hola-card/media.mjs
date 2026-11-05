// ONE-OFF media pipeline (source paths are local to the studio machine).
// Encodes muted preview loops (cards) + full videos (project sheets) + posters into public/hola/media.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../public/hola/media');
const FF = 'C:/Users/migue/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffmpeg.exe';
fs.mkdirSync(OUT, { recursive: true });

// id, source, preview start (s), preview length (s), full? , keep audio in full?, full max seconds
const JOBS = [
  ['elys', 'C:/TRABAJO/ely charcuteria/elys-brand-reveal-reel.mp4', 0.5, 7, true, false, 20],
  ['dp', 'C:/TRABAJO/DPhotography/dp web/promo-hyperframes/dp-web-promo-dame-la-letra.mp4', 1, 7, true, true, 27],
  ['labonita-film', 'C:/Users/migue/Downloads/Luxury_jewelry_art_film_prompt_20260914232412.mp4', 0, 7, true, true, 10],
  ['labonita-reveal', 'C:/TRABAJO/La Bonita Joyeria/reel-remotion/out/la-bonita-reveal-dame-la-letra.mp4', 0.5, 7, true, true, 15],
  ['labonita-marble', 'C:/TRABAJO/La Bonita Joyeria/capturas-produccion/estatua-marmol-la-bonita-4k.mp4', 0, 7, false, false, 0],
  ['lucky', 'C:/TRABAJO/Lucky Shaker/assets/real_frames/mob_real_60fps.mp4', 0, 8, true, false, 28],
  ['lucky-desk', 'C:/TRABAJO/Lucky Shaker/assets/real_frames/desk_real_60fps.mp4', 0, 0, true, false, 28],
  ['newera', 'C:/TRABAJO/new era/code/public/assets/videos/hero-mobile-1080p.mp4', 0, 4, false, false, 0],
  ['newera-demo', 'C:/TRABAJO/new era/New_Era_ARM_Demo_Vertical.mp4', 2, 7, true, false, 51],
  ['primestone', 'C:/TRABAJO/PRIME STONE BUILDERS/videos para web/prime_stone_showcase_mobile_9x16.mp4', 1, 8, true, false, 27, { w: 540, crf: 30 }],
  ['primestone-desk', 'C:/TRABAJO/EDWARD SIDING GUTTER/public/prime_stone_showcase_desktop_16x9.mp4', 0, 0, true, false, 31, { w: 960, crf: 30 }],
  ['zhomes', 'C:/TRABAJO/ZHOMES/app/code/zhomes-app/public/Videos/zhomes_new_listing.mp4', 1, 7, true, true, 49, { w: 540, crf: 31 }],
  ['vid-agents', 'C:/Users/migue/Downloads/1011(1).mp4', 1, 7, true, true, 46, { w: 540, crf: 32 }],
  ['vid-sellers', 'C:/Users/migue/Downloads/0908.mp4', 1, 7, true, true, 39],
  ['vid-shoot', 'C:/Users/migue/Downloads/0809(4).mp4', 2, 7, true, true, 59],
];

const ff = (args) => execFileSync(FF, ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
const kb = (f) => Math.round(fs.statSync(f).size / 1024);
const only = process.argv.slice(2);

for (const [id, src, ss, len, full, audio, max, o = {}] of JOBS) {
  if (only.length && !only.includes(id)) continue;
  const t0 = Date.now();
  if (len > 0) {
    const prev = path.join(OUT, `${id}-loop.mp4`);
    ff(['-ss', String(ss), '-t', String(len), '-i', src, '-an', '-vf', 'scale=360:-2:flags=lanczos,fps=24,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '29', '-profile:v', 'main', '-movflags', '+faststart', prev]);
    const poster = path.join(OUT, `${id}-poster.jpg`);
    ff(['-ss', '0.3', '-i', prev, '-frames:v', '1', '-q:v', '5', poster]);
    console.log(id, 'loop', kb(prev), 'KB poster', kb(poster), 'KB');
  }
  if (full) {
    const out = path.join(OUT, `${id}.mp4`);
    const probe = execFileSync(FF.replace('ffmpeg.exe', 'ffprobe.exe'), ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src]).toString().trim().split(',').map(Number);
    const landscape = probe[0] > probe[1];
    const scale = `scale=${o.w || (landscape ? 1280 : 720)}:-2:flags=lanczos`;
    const args = ['-i', src, '-t', String(max), '-vf', `${scale},fps=30,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(o.crf || 28), '-profile:v', 'high', '-movflags', '+faststart'];
    if (audio) args.push('-c:a', 'aac', '-b:a', '96k', '-ac', '2'); else args.push('-an');
    ff([...args, out]);
    if (len === 0) ff(['-ss', '1', '-i', out, '-frames:v', '1', '-vf', 'scale=640:-2', '-q:v', '5', path.join(OUT, `${id}-poster.jpg`)]);
    console.log(id, 'full', kb(out), 'KB', ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
}
