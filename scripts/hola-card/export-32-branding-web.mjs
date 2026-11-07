import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { BRANDS } from "./brands-data.mjs";

const MOCKUPS_DIR = "C:/TRABAJO/TRABAJO/Portafolio/Nueva carpeta/mockups_fotograficos";
const BOARDS_DIR = "C:/TRABAJO/TRABAJO/Portafolio/Nueva carpeta/branding_sets";
const LOGOS_DIR = "C:/TRABAJO/TRABAJO/Portafolio/Nueva carpeta/reel/logos";
const OUT_WEB_DIR = "C:/TRABAJO/TRABAJO/LA LETRA/Dame la letra/public/hola/img/branding";

async function main() {
  await fs.mkdir(OUT_WEB_DIR, { recursive: true });
  const mockupFiles = (await fs.readdir(MOCKUPS_DIR)).filter(f => f.endsWith(".jpg")).sort();

  for (const b of BRANDS) {
    const num = String(b.id).padStart(2, "0");
    const mockupFile = mockupFiles.find(f => f.startsWith(`mockup_${num}_`));
    if (!mockupFile) {
      throw new Error(`Missing mockup for #${num}`);
    }
    const mockupPath = path.join(MOCKUPS_DIR, mockupFile);

    // 1. 1280px WebP for Stage & Desktop
    await sharp(mockupPath)
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(path.join(OUT_WEB_DIR, `mockup-${num}.webp`));

    // 2. 640px WebP for Grid Card Thumbnail
    await sharp(mockupPath)
      .resize({ width: 640, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(OUT_WEB_DIR, `mockup-${num}-sm.webp`));

    // 3. 1400px WebP of the Technical Brand System Board
    const safeSlug = b.file.replace(/[^a-zA-Z0-9_-]/g, "_");
    const boardPath = path.join(BOARDS_DIR, `brand_set_${num}_${safeSlug}.png`);
    await sharp(boardPath)
      .resize({ width: 1400, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(OUT_WEB_DIR, `board-${num}.webp`));

    // 4. 360px transparent WebP of the original logo
    const logoPath = path.join(LOGOS_DIR, `${b.file}.png`);
    await sharp(logoPath)
      .resize({ width: 360, height: 220, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88 })
      .toFile(path.join(OUT_WEB_DIR, `logo-${num}.webp`));

    console.log(`[OK] Exported web assets for #${num} ${b.brandName}`);
  }
  console.log("All 32 brand web assets exported to", OUT_WEB_DIR);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
