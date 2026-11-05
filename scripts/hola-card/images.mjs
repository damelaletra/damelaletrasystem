// ONE-OFF (source paths are local to the studio machine). Builds optimized WebP assets for the /hola networking card from existing project captures.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const S = 'C:/Users/migue/.gemini/antigravity/brain/65c99efc-65ff-433f-8a5f-22f3705993d2/scratch';
const OUT = fileURLToPath(new URL('../../public/hola/img/', import.meta.url));
fs.mkdirSync(OUT, { recursive: true });

// [outName, src, crop {top fraction / height fraction} or null, widths, quality]
const JOBS = [
  ['elys-m', `${S}/shots/elys-m.png`, { top: 0.10, h: 0.78 }, [480, 820]],
  ['elys-cards', 'C:/TRABAJO/ely charcuteria/mockups_fotograficos/6_business_cards_lujo.jpg', null, [640, 1100]],
  ['labonita-m', 'C:/TRABAJO/La Bonita Joyeria/capturas-produccion/12-mobile-hero-categorias.png', { top: 0.0, h: 0.80 }, [480, 820]],
  ['labonita-d', 'C:/TRABAJO/La Bonita Joyeria/capturas-produccion/01-desktop-hero-categorias.png', null, [640, 1100]],
  ['lucky-m', `${S}/shots2/lucky-m.png`, { top: 0.0, h: 0.80 }, [480, 820]],
  ['lucky-3d', 'C:/TRABAJO/Lucky Shaker/renders/lucky_shaker_hero_9_16.png', { top: 0.12, h: 0.78 }, [420, 720]],
  ['newera-m', `${S}/shots2/newera-m.png`, { top: 0.0, h: 0.80 }, [480, 820]],
  ['newera-d', 'C:/TRABAJO/new era/web/4.png', null, [640, 1100]],
  ['zhomes-m', `${S}/shots/zhomes-m.png`, { top: 0.0, h: 0.80 }, [360, 600]],
  ['trilion-m', `${S}/shots/trilion-m.png`, { top: 0.0, h: 0.80 }, [360, 600]],
];

const manifest = {};
for (const [name, src, crop, widths] of JOBS) {
  const meta = await sharp(src).metadata();
  let pipeline = () => {
    let p = sharp(src);
    if (crop) {
      const top = Math.round(meta.height * crop.top);
      const height = Math.min(Math.round(meta.height * crop.h), meta.height - top);
      p = p.extract({ left: 0, top, width: meta.width, height });
    }
    return p;
  };
  manifest[name] = {};
  for (const w of widths) {
    const file = `${name}-${w}.webp`;
    const info = await pipeline().resize({ width: w, withoutEnlargement: true }).webp({ quality: 74, effort: 6 }).toFile(path.join(OUT, file));
    manifest[name][w] = { file, w: info.width, h: info.height, kb: Math.round(info.size / 1024) };
  }
}
console.log(JSON.stringify(manifest, null, 1));
