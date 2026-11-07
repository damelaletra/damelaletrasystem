import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const LOGOS_DIR = "C:/TRABAJO/TRABAJO/Portafolio/Nueva carpeta/reel/logos";
const REFS_DIR = "C:/TRABAJO/TRABAJO/Portafolio/Nueva carpeta/logo_refs";
const OUT_DIR = "C:/TRABAJO/TRABAJO/Portafolio/Nueva carpeta/mockups_fotograficos";

fs.mkdirSync(REFS_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const darkBgLogos = new Set([
  "CLOVER JEWERLY", "DHOMES", "DIGITAL GARDEN", "EDWARD DETAILING",
  "LA LETRA", "LEUNAM", "MENDAITO", "RIDE CRNAK", "SOZA",
  "THE KINGDOM", "TWOIT", "UBC", "VENEGA"
]);

const files = fs.readdirSync(LOGOS_DIR).filter(f => f.endsWith(".png"));
for (const f of files) {
  const name = path.basename(f, ".png");
  const bg = darkBgLogos.has(name)
    ? { r: 16, g: 18, b: 24, alpha: 1 }
    : { r: 248, g: 246, b: 240, alpha: 1 };
  await sharp(path.join(LOGOS_DIR, f))
    .resize({ width: 1400, height: 1000, fit: "contain", background: bg })
    .flatten({ background: bg })
    .png()
    .toFile(path.join(REFS_DIR, f));
}
console.log("Prepared", files.length, "logo reference images in", REFS_DIR);
