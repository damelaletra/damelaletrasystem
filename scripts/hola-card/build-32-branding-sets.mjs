import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { BRANDS } from "./brands-data.mjs";
import { esc, clipWords, placeLogo, renderQR, renderApparel, renderHeroPiece, isLightHex } from "./brands-illustrations.mjs";

const LOGOS_DIR = "C:\\TRABAJO\\TRABAJO\\Portafolio\\Nueva carpeta\\reel\\logos";
const LOGOS_JSON = "C:\\TRABAJO\\TRABAJO\\Portafolio\\Nueva carpeta\\reel\\logos.json";
const OUT_DIR = "C:\\TRABAJO\\TRABAJO\\Portafolio\\Nueva carpeta\\branding_sets";
const ARTIFACT_DIR = "C:\\Users\\migue\\.gemini\\antigravity\\brain\\65c99efc-65ff-433f-8a5f-22f3705993d2";

function buildBoardSVG(b, logoHref, ar) {
  const isBoardLight = isLightHex(b.boardBg);
  const headerTextFill = isBoardLight ? "#121418" : "#F8FAFC";
  const subTextFill = isBoardLight ? "#475569" : "#94A3B8";
  const borderCol = b.primary;
  const cardFrontText = isLightHex(b.cardFrontBg) ? "#121418" : "#F8FAFC";
  const cardBackText = isLightHex(b.cardBackBg) ? "#121418" : "#FFFFFF";

  // Contrast companion box in Zone 1 (inverse of main logoBoxBg)
  const altLogoBg = isLightHex(b.logoBoxBg) ? "#121318" : "#F6F4EE";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000">
  <defs>
    <filter id="shadow" x="-8%" y="-8%" width="116%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.32"/>
    </filter>
    <filter id="softShadow" x="-5%" y="-5%" width="110%" height="112%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="${b.primary}" stroke-opacity="0.06" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Main Board Background -->
  <rect width="1600" height="1000" fill="${b.boardBg}"/>
  <rect width="1600" height="1000" fill="url(#grid)"/>

  <!-- Top Editorial Header Bar -->
  <rect x="36" y="22" width="1528" height="66" rx="12" fill="${b.panelBg}" stroke="${borderCol}" stroke-opacity="0.45" stroke-width="1.5"/>
  <rect x="52" y="36" width="112" height="38" rx="8" fill="${b.primary}"/>
  <text x="108" y="60" text-anchor="middle" fill="${isLightHex(b.primary) ? '#111111' : '#FFFFFF'}" font-family="Courier New, monospace" font-size="15" font-weight="700">SET #${String(b.id).padStart(2, "0")}</text>

  <text x="182" y="52" fill="${headerTextFill}" font-family="Arial Black, Impact, sans-serif" font-size="21" font-weight="900" letter-spacing="1">${esc(b.brandName)} — MINI BRANDING SET</text>
  <text x="182" y="72" fill="${b.primary}" font-family="Courier New, monospace" font-size="12" font-weight="700" letter-spacing="1.5">${esc(b.giroEs)} · ${esc(b.category.toUpperCase())}</text>

  <text x="1542" y="50" text-anchor="end" fill="${subTextFill}" font-family="Courier New, monospace" font-size="11" font-weight="700">DAME LA LETRA · BRAND SYSTEM BOARD</text>
  <text x="1542" y="70" text-anchor="end" fill="${b.primary}" font-family="Courier New, monospace" font-size="11" font-weight="700">TIPOGRAFÍA: ${esc(b.fontTitle.toUpperCase())}</text>

  <!-- ======================================================================= -->
  <!-- ZONE 1 (TOP-LEFT): LOGO PRINCIPAL, VARIACIÓN Y PALETA CROMÁTICA          -->
  <!-- ======================================================================= -->
  <g transform="translate(36, 104)">
    <rect width="474" height="425" rx="16" fill="${b.panelBg}" stroke="${borderCol}" stroke-opacity="0.4" stroke-width="1.5" filter="url(#softShadow)"/>
    <rect x="18" y="16" width="438" height="32" rx="6" fill="${b.surface}"/>
    <text x="32" y="36" fill="${b.primary}" font-family="Courier New, monospace" font-size="11.5" font-weight="700" letter-spacing="1.2">01 · LOGOTIPO OFICIAL, CONTRASTE Y PALETA</text>

    <!-- Primary Logo Display Canvas (Optimal Contrast Surface) -->
    <rect x="18" y="60" width="292" height="224" rx="12" fill="${b.logoBoxBg}" stroke="${b.primary}" stroke-width="2" filter="url(#softShadow)"/>
    <!-- Subtle Safe-Zone Corner Ticks -->
    <path d="M30,78 L30,70 L38,70 M298,70 L298,78 M30,266 L30,274 L38,274 M298,274 L298,266" fill="none" stroke="${b.primary}" stroke-width="1.5" opacity="0.65"/>
    ${placeLogo(logoHref, ar, 164, 166, 250, 178)}
    <text x="164" y="276" text-anchor="middle" fill="${isLightHex(b.logoBoxBg) ? '#334155' : '#CBD5E1'}" font-family="Courier New, monospace" font-size="8.5" font-weight="700">VERSIÓN PRINCIPAL · AREA DE RESPETO 1X</text>

    <!-- Secondary / Alternate Contrast Card + Typography Spec -->
    <rect x="322" y="60" width="134" height="122" rx="10" fill="${altLogoBg}" stroke="${b.primary}" stroke-opacity="0.6" stroke-width="1.5"/>
    ${placeLogo(logoHref, ar, 389, 112, 108, 78)}
    <text x="389" y="172" text-anchor="middle" fill="${isLightHex(altLogoBg) ? '#111' : '#EEE'}" font-family="Courier New, monospace" font-size="8" font-weight="700">FONDO ALTERNO</text>

    <rect x="322" y="192" width="134" height="92" rx="10" fill="${b.surface}" stroke="${b.primary}" stroke-opacity="0.35"/>
    <text x="334" y="212" fill="${b.primary}" font-family="Courier New, monospace" font-size="9" font-weight="700">TIPOGRAFÍA</text>
    <text x="334" y="234" fill="${headerTextFill}" font-family="Georgia, serif" font-size="22" font-weight="700">Aa Bb</text>
    <text x="334" y="254" fill="${headerTextFill}" font-family="Arial, sans-serif" font-size="9.5" font-weight="700">${esc(b.fontTitle.slice(0, 18))}</text>
    <text x="334" y="270" fill="${subTextFill}" font-family="Courier New, monospace" font-size="8.5">${esc(b.fontBody.slice(0, 19))}</text>

    <!-- 4 Official Color Swatches -->
    <g transform="translate(18, 298)">
      ${b.swatches.map((sw, i) => {
        const sx = i * 112;
        const swText = isLightHex(sw.hex) ? "#111111" : "#FFFFFF";
        return `<g transform="translate(${sx}, 0)">
          <rect width="102" height="108" rx="10" fill="${sw.hex}" stroke="${b.primary}" stroke-opacity="0.45" stroke-width="1.5" filter="url(#softShadow)"/>
          <rect x="8" y="64" width="86" height="36" rx="6" fill="#000000" fill-opacity="0.28"/>
          <text x="51" y="80" text-anchor="middle" fill="#FFFFFF" font-family="Courier New, monospace" font-size="10.5" font-weight="700">${esc(sw.hex)}</text>
          <text x="51" y="94" text-anchor="middle" fill="#F1F5F9" font-family="Arial, sans-serif" font-size="8.5">${esc(sw.name.slice(0, 14))}</text>
          <circle cx="20" cy="20" r="6" fill="${swText}" fill-opacity="0.3"/>
        </g>`;
      }).join("")}
    </g>
  </g>

  <!-- ======================================================================= -->
  <!-- ZONE 2 (BOTTOM-LEFT): TARJETAS DE PRESENTACIÓN (TIRO Y RETIRO)          -->
  <!-- ======================================================================= -->
  <g transform="translate(36, 545)">
    <rect width="474" height="419" rx="16" fill="${b.panelBg}" stroke="${borderCol}" stroke-opacity="0.4" stroke-width="1.5" filter="url(#softShadow)"/>
    <rect x="18" y="16" width="438" height="32" rx="6" fill="${b.surface}"/>
    <text x="32" y="36" fill="${b.primary}" font-family="Courier New, monospace" font-size="10.2" font-weight="700" letter-spacing="0.4">02 · TARJETAS DE PRESENTACIÓN (3.5" × 2" · TIRO Y RETIRO)</text>

    <!-- Front of Business Card (Tiro) -->
    <g transform="translate(24, 62)">
      <rect width="295" height="162" rx="12" fill="${b.cardFrontBg}" stroke="${b.primary}" stroke-width="2" filter="url(#shadow)"/>
      <rect x="0" y="148" width="295" height="14" rx="4" fill="${b.primary}"/>
      ${placeLogo(logoHref, ar, 147, 72, 185, 102)}
      <text x="147" y="138" text-anchor="middle" fill="${cardFrontText}" font-family="Courier New, monospace" font-size="8.5" font-weight="700" letter-spacing="1.2">${esc(b.web.toUpperCase())}</text>
      <text x="312" y="80" fill="${b.primary}" font-family="Courier New, monospace" font-size="10" font-weight="700">FRENTE / TIRO</text>
      <text x="312" y="98" fill="${headerTextFill}" font-family="Arial, sans-serif" font-size="10">• Cartulina 16pt</text>
      <text x="312" y="116" fill="${headerTextFill}" font-family="Arial, sans-serif" font-size="10">• Laminado Mate</text>
      <text x="312" y="134" fill="${headerTextFill}" font-family="Arial, sans-serif" font-size="10">• Spot UV / Foil</text>
    </g>

    <!-- Back of Business Card (Retiro) -->
    <g transform="translate(148, 236)">
      <rect width="302" height="164" rx="12" fill="${b.surface}" stroke="${b.primary}" stroke-width="2" filter="url(#shadow)"/>
      <rect x="0" y="0" width="10" height="164" rx="4" fill="${b.primary}"/>
      <!-- Small Logo Pill on Card Back -->
      <rect x="22" y="14" width="84" height="44" rx="6" fill="${b.logoBoxBg}" stroke="${b.primary}" stroke-width="1"/>
      ${placeLogo(logoHref, ar, 64, 36, 72, 34)}
      <text x="22" y="78" fill="${b.ink}" font-family="Arial, sans-serif" font-size="12.5" font-weight="700">${esc(b.person)}</text>
      <text x="22" y="94" fill="${b.primary}" font-family="Courier New, monospace" font-size="9" font-weight="700">${esc(b.role.slice(0, 36))}</text>
      <line x1="22" y1="103" x2="210" y2="103" stroke="${b.primary}" stroke-opacity="0.4"/>
      <text x="22" y="120" fill="${b.ink}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">TEL: ${esc(b.phone)}</text>
      <text x="22" y="135" fill="${b.ink}" font-family="Courier New, monospace" font-size="9">${esc(b.web)}</text>
      <text x="22" y="150" fill="${b.ink}" opacity="0.8" font-family="Arial, sans-serif" font-size="8.5">${esc(b.address)}</text>
      <!-- QR Code on Card Back -->
      ${renderQR(222, 22, 64, "#111111", "#FFFFFF")}
      <text x="254" y="102" text-anchor="middle" fill="${b.primary}" font-family="Courier New, monospace" font-size="8" font-weight="700">SCAN QR</text>
      <rect x="218" y="114" width="72" height="34" rx="6" fill="${b.primary}"/>
      <text x="254" y="130" text-anchor="middle" fill="${isLightHex(b.primary) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="8" font-weight="700">CONTACTO</text>
      <text x="254" y="141" text-anchor="middle" fill="${isLightHex(b.primary) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="7.5" font-weight="700">DIRECTO</text>
    </g>
    <text x="24" y="310" fill="${b.primary}" font-family="Courier New, monospace" font-size="10" font-weight="700">REVERSO /</text>
    <text x="24" y="325" fill="${b.primary}" font-family="Courier New, monospace" font-size="10" font-weight="700">RETIRO</text>
    <text x="24" y="345" fill="${subTextFill}" font-family="Arial, sans-serif" font-size="9.5">QR dinámico a</text>
    <text x="24" y="360" fill="${subTextFill}" font-family="Arial, sans-serif" font-size="9.5">WhatsApp o Web</text>
  </g>

  <!-- ======================================================================= -->
  <!-- ZONE 3 (CENTER): PIEZA ESTRELLA / EMPAQUE / APLICACIÓN DEL GIRO         -->
  <!-- ======================================================================= -->
  <g transform="translate(530, 104)">
    <rect width="540" height="860" rx="16" fill="${b.panelBg}" stroke="${borderCol}" stroke-opacity="0.45" stroke-width="1.5" filter="url(#softShadow)"/>
    <rect x="18" y="16" width="504" height="34" rx="6" fill="${b.surface}"/>
    <text x="32" y="37" fill="${b.primary}" font-family="Courier New, monospace" font-size="10.2" font-weight="700" letter-spacing="0.4">03 · ${esc(clipWords(b.heroTitle, 58))}</text>
    ${renderHeroPiece(b, logoHref, ar)}
  </g>

  <!-- ======================================================================= -->
  <!-- ZONE 4A (TOP-RIGHT): INDUMENTARIA Y UNIFORME BORDADO                    -->
  <!-- ======================================================================= -->
  <g transform="translate(1090, 104)">
    <rect width="474" height="430" rx="16" fill="${b.panelBg}" stroke="${borderCol}" stroke-opacity="0.4" stroke-width="1.5" filter="url(#softShadow)"/>
    <rect x="18" y="16" width="438" height="32" rx="6" fill="${b.surface}"/>
    <text x="32" y="36" fill="${b.primary}" font-family="Courier New, monospace" font-size="10.2" font-weight="700" letter-spacing="0.4">04 · ${esc(clipWords(b.apparelTitle, 50))}</text>
    <g transform="translate(0, 48)">
      ${renderApparel(b, logoHref, ar)}
    </g>
  </g>

  <!-- ======================================================================= -->
  <!-- ZONE 4B (BOTTOM-RIGHT): SEÑALÉTICA EXTERIOR Y SELLO DE MARCA            -->
  <!-- ======================================================================= -->
  <g transform="translate(1090, 550)">
    <rect width="474" height="414" rx="16" fill="${b.panelBg}" stroke="${borderCol}" stroke-opacity="0.4" stroke-width="1.5" filter="url(#softShadow)"/>
    <rect x="18" y="16" width="438" height="32" rx="6" fill="${b.surface}"/>
    <text x="32" y="36" fill="${b.primary}" font-family="Courier New, monospace" font-size="11" font-weight="700" letter-spacing="1">05 · SEÑALÉTICA DE FACHADA, BANDEROLA Y SELLO</text>

    <!-- Architectural Blade Sign (Banderola Exterior con Brazo de Hierro) -->
    <g transform="translate(22, 62)">
      <!-- Wall Pillar & Wrought Iron Bracket -->
      <rect x="0" y="0" width="24" height="225" rx="4" fill="#262930" stroke="${b.primary}" stroke-width="1.5"/>
      <rect x="24" y="28" width="265" height="12" rx="3" fill="#141518" stroke="${b.primary}" stroke-width="1.5"/>
      <path d="M24,78 Q62,40 92,40" fill="none" stroke="${b.primary}" stroke-width="4"/>
      <line x1="78" y1="40" x2="78" y2="58" stroke="${b.primary}" stroke-width="4"/>
      <line x1="222" y1="40" x2="222" y2="58" stroke="${b.primary}" stroke-width="4"/>

      <!-- Hanging Illuminated Sign Box -->
      <rect x="42" y="56" width="232" height="156" rx="12" fill="${b.logoBoxBg}" stroke="${b.primary}" stroke-width="3.5" filter="url(#shadow)"/>
      ${placeLogo(logoHref, ar, 158, 118, 196, 98)}
      <rect x="42" y="176" width="232" height="36" rx="8" fill="${b.primary}"/>
      <text x="158" y="198" text-anchor="middle" fill="${isLightHex(b.primary) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="10" font-weight="700">${esc(b.signText.slice(0, 28))}</text>
    </g>

    <!-- Circular Official Brand Stamp / Sticker on Right -->
    <g transform="translate(318, 76)">
      <circle cx="68" cy="84" r="64" fill="${b.logoBoxBg}" stroke="${b.primary}" stroke-width="3.5" filter="url(#shadow)"/>
      <circle cx="68" cy="84" r="56" fill="none" stroke="${b.primary}" stroke-width="1.2" stroke-dasharray="5 3"/>
      ${placeLogo(logoHref, ar, 68, 80, 86, 64)}
      <rect x="12" y="128" width="112" height="22" rx="10" fill="${b.primary}"/>
      <text x="68" y="143" text-anchor="middle" fill="${isLightHex(b.primary) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="8.5" font-weight="700">SELLO / STICKER</text>
      <text x="68" y="175" text-anchor="middle" fill="${headerTextFill}" font-family="Courier New, monospace" font-size="9" font-weight="700">TROQUEL CIRCULAR 5 CM</text>
    </g>

    <!-- Bottom Facade & Vehicle / Window Vinyl Strip -->
    <rect x="22" y="302" width="430" height="92" rx="10" fill="${b.surface}" stroke="${b.primary}" stroke-opacity="0.45"/>
    <text x="38" y="326" fill="${b.primary}" font-family="Courier New, monospace" font-size="10" font-weight="700">ROTULACIÓN DE VITRINA Y FACHADA · ${esc(b.signText)}</text>
    <text x="38" y="348" fill="${headerTextFill}" font-family="Arial, sans-serif" font-size="11.5" font-weight="700">${esc(b.signSub)}</text>
    <text x="38" y="370" fill="${subTextFill}" font-family="Courier New, monospace" font-size="10">ACRÍLICO RETROILUMINADO LED + VINIL MICROPERFORADO · ${esc(b.phone)}</text>
  </g>
</svg>`;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });

  const logosMeta = JSON.parse(await fs.readFile(LOGOS_JSON, "utf8"));
  const metaMap = new Map(logosMeta.map(m => [m.name, m]));

  console.log(`Generando los ${BRANDS.length} Mini Branding Sets...`);

  for (const b of BRANDS) {
    const pngPath = path.join(LOGOS_DIR, `${b.file}.png`);
    const pngBuf = await fs.readFile(pngPath);
    const logoHref = `data:image/png;base64,${pngBuf.toString("base64")}`;
    const meta = metaMap.get(b.file) || { ar: 1.5 };

    const svgContent = buildBoardSVG(b, logoHref, meta.ar);
    const safeSlug = b.file.replace(/[^a-zA-Z0-9_-]/g, "_");
    const baseName = `brand_set_${String(b.id).padStart(2, "0")}_${safeSlug}`;

    const outSvgPath = path.join(OUT_DIR, `${baseName}.svg`);
    const outPngPath = path.join(OUT_DIR, `${baseName}.png`);
    const artifactPngPath = path.join(ARTIFACT_DIR, `${baseName}.png`);

    await fs.writeFile(outSvgPath, svgContent, "utf8");
    const renderedPng = await sharp(Buffer.from(svgContent))
      .resize(1600, 1000)
      .png({ quality: 92, compressionLevel: 8 })
      .toBuffer();

    await fs.writeFile(outPngPath, renderedPng);
    await fs.writeFile(artifactPngPath, renderedPng);
    console.log(`[OK] #${String(b.id).padStart(2, "0")} ${b.brandName} -> ${baseName}.png`);
  }

  console.log("¡Los 32 Mini Branding Sets han sido generados con éxito!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
