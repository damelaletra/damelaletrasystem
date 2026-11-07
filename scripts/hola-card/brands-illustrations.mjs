// Bespoke SVG vector illustrations for Zone 3 (Industry Hero Piece) and Zone 4 (Apparel)

export function esc(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function wrapTwoLines(str = "", maxLen = 21) {
  const words = String(str).split(/\s+/);
  let line1 = "";
  let line2 = "";
  for (const w of words) {
    if ((line1 + (line1 ? " " : "") + w).length <= maxLen) {
      line1 += (line1 ? " " : "") + w;
    } else {
      line2 += (line2 ? " " : "") + w;
    }
  }
  return [line1, line2];
}

export function clipWords(str = "", maxLen = 52) {
  if (str.length <= maxLen) return str;
  const cut = str.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > 20 ? cut.slice(0, lastSpace) : cut;
}

// Helper to place the rasterized high-res logo centered inside a target box (cx, cy, maxW, maxH)
export function placeLogo(href, ar, cx, cy, maxW, maxH, opacity = 1) {
  let w = maxW;
  let h = w / ar;
  if (h > maxH) {
    h = maxH;
    w = h * ar;
  }
  const x = (cx - w / 2).toFixed(1);
  const y = (cy - h / 2).toFixed(1);
  return `<image href="${href}" x="${x}" y="${y}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" opacity="${opacity}" preserveAspectRatio="xMidYMid meet"/>`;
}

// Helper for a clean QR code vector block
export function renderQR(x, y, size, color = "#111111", bg = "#FFFFFF") {
  const s = size / 7;
  return `<g transform="translate(${x},${y})">
    <rect width="${size}" height="${size}" rx="4" fill="${bg}"/>
    <rect x="${s*0.5}" y="${s*0.5}" width="${s*2}" height="${s*2}" fill="none" stroke="${color}" stroke-width="${s*0.45}"/>
    <rect x="${s*1.1}" y="${s*1.1}" width="${s*0.8}" height="${s*0.8}" fill="${color}"/>
    <rect x="${s*4.5}" y="${s*0.5}" width="${s*2}" height="${s*2}" fill="none" stroke="${color}" stroke-width="${s*0.45}"/>
    <rect x="${s*5.1}" y="${s*1.1}" width="${s*0.8}" height="${s*0.8}" fill="${color}"/>
    <rect x="${s*0.5}" y="${s*4.5}" width="${s*2}" height="${s*2}" fill="none" stroke="${color}" stroke-width="${s*0.45}"/>
    <rect x="${s*1.1}" y="${s*5.1}" width="${s*0.8}" height="${s*0.8}" fill="${color}"/>
    <rect x="${s*3.1}" y="${s*0.8}" width="${s*0.6}" height="${s*1.4}" fill="${color}"/>
    <rect x="${s*3.1}" y="${s*2.8}" width="${s*1.2}" height="${s*0.6}" fill="${color}"/>
    <rect x="${s*0.8}" y="${s*3.1}" width="${s*1.6}" height="${s*0.6}" fill="${color}"/>
    <rect x="${s*4.6}" y="${s*3.2}" width="${s*1.6}" height="${s*0.6}" fill="${color}"/>
    <rect x="${s*3.2}" y="${s*4.4}" width="${s*0.7}" height="${s*1.8}" fill="${color}"/>
    <rect x="${s*4.5}" y="${s*4.6}" width="${s*1.8}" height="${s*0.7}" fill="${color}"/>
    <rect x="${s*5.2}" y="${s*5.6}" width="${s*1.1}" height="${s*0.8}" fill="${color}"/>
  </g>`;
}

// Renders the Embroidered Uniform / Apparel piece inside a local coordinate space (0..474, 0..400)
export function renderApparel(b, logoHref, ar) {
  const t = b.apparelType;
  const isLightLogoBg = isLightHex(b.logoBoxBg);
  const garmentFill = isLightLogoBg ? "#F4F2EC" : "#15171C";
  const garmentStroke = isLightLogoBg ? "#D0C9B8" : "#2D323E";
  const collarFill = b.primary;
  const badgeBg = b.logoBoxBg;

  // Different silhouette styles based on industry
  if (t === "apron" || t === "baker_apron" || t === "taquero_apron" || t === "mechanic_apron" || t === "icecream_cap_apron") {
    const apronColor = t === "apron" ? "#2E473B" : t === "baker_apron" ? "#FFF8E7" : t === "icecream_cap_apron" ? "#1E56C5" : "#16181D";
    const strapColor = b.primary;
    return `<g transform="translate(20, 12)">
      <!-- Butcher / Atelier Apron Silhouette -->
      <path d="M135,18 C135,4 195,4 195,18 L195,55 L135,55 Z" fill="none" stroke="${strapColor}" stroke-width="8" stroke-linecap="round"/>
      <path d="M115,48 L215,48 L255,135 L255,345 C255,356 246,364 235,364 L95,364 C84,364 75,356 75,345 L75,135 Z" fill="${apronColor}" stroke="${b.primary}" stroke-width="2.5" filter="url(#shadow)"/>
      <path d="M75,140 L35,160 M255,140 L295,160" stroke="${strapColor}" stroke-width="6" stroke-linecap="round"/>
      <!-- Front tool pocket -->
      <rect x="105" y="235" width="120" height="82" rx="8" fill="${b.surface}" stroke="${b.primary}" stroke-width="1.5"/>
      <line x1="165" y1="235" x2="165" y2="317" stroke="${b.primary}" stroke-width="1.2" stroke-dasharray="4 3"/>
      <!-- Chest Embroidered Patch -->
      <rect x="115" y="84" width="100" height="72" rx="10" fill="${badgeBg}" stroke="${b.primary}" stroke-width="2"/>
      ${placeLogo(logoHref, ar, 165, 120, 82, 56)}
      <!-- Matching Cap + Badge on the right -->
      <g transform="translate(290, 65)">
        <path d="M15,70 C15,28 115,28 115,70 Z" fill="${apronColor}" stroke="${b.primary}" stroke-width="2" filter="url(#shadow)"/>
        <path d="M8,70 Q65,86 135,72 Q105,92 15,78 Z" fill="${b.primary}"/>
        <rect x="34" y="34" width="60" height="32" rx="6" fill="${badgeBg}" stroke="${b.primary}" stroke-width="1.2"/>
        ${placeLogo(logoHref, ar, 64, 50, 48, 24)}
      </g>
      <!-- Spec card -->
      <rect x="285" y="190" width="150" height="155" rx="10" fill="${b.surface}" stroke="${b.primary}" stroke-opacity="0.45"/>
      <text x="300" y="216" fill="${b.primary}" font-family="Courier New, monospace" font-size="10" font-weight="700">UNIFORME DE OFICIO</text>
      <text x="300" y="238" fill="${b.ink}" font-family="Arial, sans-serif" font-size="11" font-weight="700">Lona / Gabardina 12oz</text>
      <text x="300" y="258" fill="${b.ink}" opacity="0.8" font-family="Arial, sans-serif" font-size="10">• Bordado pecho alta densidad</text>
      <text x="300" y="276" fill="${b.ink}" opacity="0.8" font-family="Arial, sans-serif" font-size="10">• Herrajes anticorrosión</text>
      <text x="300" y="294" fill="${b.ink}" opacity="0.8" font-family="Arial, sans-serif" font-size="10">• Bolsillo doble de trabajo</text>
      <rect x="300" y="310" width="120" height="20" rx="4" fill="${b.primary}"/>
      <text x="360" y="324" text-anchor="middle" fill="${isLightHex(b.primary) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="9" font-weight="700">BORDADO OFICIAL</text>
    </g>`;
  }

  if (t === "hoodie_lanyard" || t === "studio_hoodie" || t === "agency_hoodie" || t === "streetwear_hoodie" || t === "photographer_vest") {
    return `<g transform="translate(18, 12)">
      <!-- Heavyweight Hoodie Silhouette -->
      <path d="M95,48 L135,28 C155,14 195,14 215,28 L255,48 L310,115 L282,155 L250,115 L250,355 L100,355 L100,115 L68,155 L40,115 Z" fill="${garmentFill}" stroke="${b.primary}" stroke-width="2.2" filter="url(#shadow)"/>
      <!-- Hood & Drawstrings -->
      <path d="M125,34 Q175,6 225,34 Q210,68 175,68 Q140,68 125,34 Z" fill="${b.surface}" stroke="${b.primary}" stroke-width="1.8"/>
      <line x1="162" y1="66" x2="162" y2="112" stroke="${b.primary}" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="188" y1="66" x2="188" y2="112" stroke="${b.primary}" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Kangaroo pocket -->
      <path d="M122,250 L228,250 L240,335 L110,335 Z" fill="${b.surface}" stroke="${garmentStroke}" stroke-width="1.5"/>
      <!-- Center / Chest Graphic Box -->
      <rect x="118" y="96" width="114" height="92" rx="10" fill="${badgeBg}" stroke="${b.primary}" stroke-width="2"/>
      ${placeLogo(logoHref, ar, 175, 142, 96, 72)}
      <!-- VIP Lanyard / Woven Tag on Right -->
      <g transform="translate(318, 30)">
        <path d="M35,0 L60,95 L85,0" fill="none" stroke="${b.primary}" stroke-width="8"/>
        <rect x="10" y="92" width="100" height="145" rx="8" fill="${badgeBg}" stroke="${b.primary}" stroke-width="2" filter="url(#shadow)"/>
        <rect x="10" y="92" width="100" height="24" rx="6" fill="${b.primary}"/>
        <text x="60" y="108" text-anchor="middle" fill="${isLightHex(b.primary) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="9" font-weight="700">STAFF / CREW</text>
        ${placeLogo(logoHref, ar, 60, 152, 76, 52)}
        <text x="60" y="202" text-anchor="middle" fill="${isLightHex(badgeBg) ? '#111' : '#FFF'}" font-family="Arial, sans-serif" font-size="8.5" font-weight="700">${esc(b.brandName.slice(0, 18))}</text>
        <text x="60" y="222" text-anchor="middle" fill="${b.primary}" font-family="Courier New, monospace" font-size="8">ALL ACCESS PASS</text>
      </g>
      <rect x="315" y="288" width="122" height="66" rx="8" fill="${b.surface}" stroke="${b.primary}" stroke-opacity="0.4"/>
      <text x="376" y="312" text-anchor="middle" fill="${b.primary}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">450 GSM COTTON</text>
      <text x="376" y="330" text-anchor="middle" fill="${b.ink}" font-family="Arial, sans-serif" font-size="9">Bordado + Serigrafía HD</text>
    </g>`;
  }

  // Default: Embroidered Polo / Scrubs / Cycling Jersey / Executive Shirt + Cap/Badge
  return `<g transform="translate(18, 12)">
    <!-- Polo / Jersey / Scrubs Torso -->
    <path d="M98,42 L140,26 L210,26 L252,42 L308,104 L276,144 L248,112 L248,354 L102,354 L102,112 L74,144 L42,104 Z" fill="${garmentFill}" stroke="${garmentStroke}" stroke-width="2.2" filter="url(#shadow)"/>
    <!-- Collar & Placket -->
    <path d="M140,26 L175,62 L210,26 L196,18 L154,18 Z" fill="${collarFill}"/>
    <rect x="169" y="56" width="12" height="64" rx="3" fill="${collarFill}"/>
    <circle cx="175" cy="72" r="2.3" fill="${badgeBg}"/>
    <circle cx="175" cy="90" r="2.3" fill="${badgeBg}"/>
    <circle cx="175" cy="108" r="2.3" fill="${badgeBg}"/>
    <!-- Sleeve Accent Stripes -->
    <line x1="48" y1="112" x2="78" y2="138" stroke="${b.primary}" stroke-width="5"/>
    <line x1="302" y1="112" x2="272" y2="138" stroke="${b.primary}" stroke-width="5"/>
    <!-- Left-Chest Embroidered Logo Badge (Viewer's Right of Placket) -->
    <rect x="190" y="76" width="50" height="40" rx="6" fill="${badgeBg}" stroke="${b.primary}" stroke-width="1.6"/>
    ${placeLogo(logoHref, ar, 215, 96, 42, 32)}
    <text x="215" y="130" text-anchor="middle" fill="${isLightHex(garmentFill) ? '#222' : '#DDD'}" font-family="Courier New, monospace" font-size="7.5" font-weight="700">BORDADO PECHO</text>
    <!-- Zoomed Embroidery Callout Circle + Cap on the Right -->
    <g transform="translate(312, 24)">
      <circle cx="66" cy="66" r="58" fill="${badgeBg}" stroke="${b.primary}" stroke-width="3" stroke-dasharray="6 3" filter="url(#shadow)"/>
      ${placeLogo(logoHref, ar, 66, 66, 86, 68)}
      <rect x="14" y="114" width="104" height="20" rx="10" fill="${b.primary}"/>
      <text x="66" y="128" text-anchor="middle" fill="${isLightHex(b.primary) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="8.5" font-weight="700">ZOOM BORDADO 3D</text>
    </g>
    <!-- Matching Credential / Cap / Spec Box -->
    <rect x="312" y="176" width="128" height="176" rx="10" fill="${b.surface}" stroke="${b.primary}" stroke-opacity="0.45"/>
    <text x="326" y="200" fill="${b.primary}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">ESPECIFICACIÓN TEXTIL</text>
    <text x="326" y="220" fill="${b.ink}" font-family="Arial, sans-serif" font-size="10.5" font-weight="700">Piqué / Dry-Fit Pro</text>
    <text x="326" y="242" fill="${b.ink}" opacity="0.82" font-family="Arial, sans-serif" font-size="9.5">• Pecho izq: 9.5 cm ancho</text>
    <text x="326" y="260" fill="${b.ink}" opacity="0.82" font-family="Arial, sans-serif" font-size="9.5">• Hilo Madeira Polyneon</text>
    <text x="326" y="278" fill="${b.ink}" opacity="0.82" font-family="Arial, sans-serif" font-size="9.5">• Cuello y puños contraste</text>
    <text x="326" y="296" fill="${b.ink}" opacity="0.82" font-family="Arial, sans-serif" font-size="9.5">• Gafete magnético / Gorra</text>
    <rect x="326" y="314" width="100" height="24" rx="5" fill="${badgeBg}" stroke="${b.primary}" stroke-width="1.2"/>
    <text x="376" y="330" text-anchor="middle" fill="${isLightHex(badgeBg) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="8.5" font-weight="700">STAFF VERIFIED</text>
  </g>`;
}

export function isLightHex(hex = "#FFFFFF") {
  const c = hex.replace("#", "");
  if (c.length !== 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 150;
}

// Renders the bespoke Industry Hero Application in Zone 3 (local coords: 0..508 width, 0..780 height)
export function renderHeroPiece(b, logoHref, ar) {
  const p = b.primary;
  const s = b.secondary;
  const bg = b.logoBoxBg;
  const fg = isLightHex(bg) ? "#121418" : "#F8FAFC";
  const surf = b.surface;
  const ink = b.ink;

  // Common bottom spec & deliverables bar (y = 580..765) so every board has both a rich top hero illustration AND a bespoke collateral/deliverables trio below it
  const bottomDeliverables = `
    <g transform="translate(14, 578)">
      <rect width="480" height="190" rx="12" fill="${surf}" stroke="${p}" stroke-opacity="0.45" stroke-width="1.5"/>
      <text x="20" y="26" fill="${p}" font-family="Courier New, monospace" font-size="10.5" font-weight="700" letter-spacing="1.5">ENTREGABLES APLICADOS AL GIRO · ${esc(b.brandName)}</text>
      <line x1="20" y1="36" x2="460" y2="36" stroke="${p}" stroke-opacity="0.3"/>
      <!-- 3 Service / Application Pillars -->
      ${b.services.map((srv, idx) => {
        const bx = 20 + idx * 150;
        const [l1, l2] = wrapTwoLines(srv, 21);
        return `<g transform="translate(${bx}, 48)">
          <rect width="140" height="82" rx="8" fill="${b.panelBg}" stroke="${p}" stroke-opacity="0.35"/>
          <circle cx="22" cy="22" r="11" fill="${p}"/>
          <text x="22" y="26" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="10" font-weight="700">0${idx + 1}</text>
          <text x="40" y="25" fill="${p}" font-family="Courier New, monospace" font-size="9" font-weight="700">MÓDULO 0${idx + 1}</text>
          <text x="10" y="48" fill="${ink}" font-family="Arial, sans-serif" font-size="9.5" font-weight="700">${esc(l1)}</text>
          <text x="10" y="64" fill="${ink}" opacity="0.82" font-family="Arial, sans-serif" font-size="9">${esc(l2)}</text>
        </g>`;
      }).join("")}
      <!-- Tagline Banner -->
      <rect x="20" y="142" width="440" height="34" rx="6" fill="${p}"/>
      <text x="240" y="163" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="9.5" font-weight="700" letter-spacing="0.4">${esc(b.tagline)}</text>
    </g>
  `;

  let topArt = "";

  switch (b.heroType) {
    case "chiropractic":
      topArt = `
        <!-- Chiropractic Folder + Cervical/Lumbar Spine Diagnostic Chart -->
        <rect x="20" y="16" width="235" height="535" rx="12" fill="#0018A8" stroke="#00A624" stroke-width="2.5" filter="url(#shadow)"/>
        <rect x="38" y="40" width="199" height="125" rx="8" fill="#FFFFFF"/>
        ${placeLogo(logoHref, ar, 137, 102, 175, 100)}
        <text x="137" y="205" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="13" font-weight="700">DIGITAL X-RAY DOSSIER</text>
        <text x="137" y="225" text-anchor="middle" fill="#7FE3FF" font-family="Courier New, monospace" font-size="10">SPINAL DECOMPRESSION LAB</text>
        <!-- Vertebrae alignment graphic on folder -->
        ${[0,1,2,3,4,5,6].map(i => `<rect x="${105 + (i%2)*4}" y="${250 + i*26}" width="64" height="18" rx="6" fill="${i===3 ? '#00A624' : '#FFFFFF'}" opacity="${i===3 ? '1' : '0.85'}"/>`).join("")}
        <text x="137" y="468" text-anchor="middle" fill="#FFFFFF" font-family="Courier New, monospace" font-size="10" font-weight="700">PATIENT: _______________</text>
        <rect x="48" y="490" width="178" height="36" rx="6" fill="#00A624"/>
        <text x="137" y="513" text-anchor="middle" fill="#FFFFFF" font-family="Courier New, monospace" font-size="11" font-weight="700">C1–L5 ALIGNMENT OK</text>

        <!-- Clinical Spine Chart Clipboard on Right -->
        <rect x="272" y="28" width="218" height="522" rx="10" fill="#FFFFFF" stroke="#0018A8" stroke-width="2" filter="url(#shadow)"/>
        <rect x="336" y="14" width="90" height="26" rx="5" fill="#00A624"/>
        ${placeLogo(logoHref, ar, 381, 78, 120, 62)}
        <line x1="292" y1="120" x2="470" y2="120" stroke="#0018A8" stroke-width="1.5"/>
        <text x="381" y="142" text-anchor="middle" fill="#0018A8" font-family="Arial, sans-serif" font-size="11" font-weight="700">VERTEBRAL SUBLUXATION MAP</text>
        <!-- Spine S-curve vector -->
        <path d="M350,165 C330,210 370,260 350,315 C335,355 365,400 350,435" fill="none" stroke="#0018A8" stroke-width="10" stroke-linecap="round" stroke-dasharray="10 6"/>
        <circle cx="354" cy="235" r="14" fill="none" stroke="#00A624" stroke-width="3"/>
        <circle cx="348" cy="345" r="14" fill="none" stroke="#00A624" stroke-width="3"/>
        <text x="385" y="190" fill="#0B162C" font-family="Courier New, monospace" font-size="10" font-weight="700">C1-C7 CERVICAL</text>
        <text x="385" y="275" fill="#00A624" font-family="Courier New, monospace" font-size="10" font-weight="700">T1-T12 THORACIC</text>
        <text x="385" y="365" fill="#0018A8" font-family="Courier New, monospace" font-size="10" font-weight="700">L1-L5 LUMBAR</text>
        <text x="385" y="425" fill="#0B162C" font-family="Courier New, monospace" font-size="10" font-weight="700">SACRUM / PELVIS</text>
        <rect x="292" y="465" width="178" height="62" rx="6" fill="#EEF3FA" stroke="#0018A8"/>
        <text x="304" y="486" fill="#0018A8" font-family="Courier New, monospace" font-size="9.5" font-weight="700">NEXT ADJUSTMENT DATE:</text>
        <text x="304" y="510" fill="#00A624" font-family="Arial, sans-serif" font-size="12" font-weight="700">MON / WED / FRI · 9:00 AM</text>
      `;
      break;

    case "construction_abb":
    case "construction_up":
      topArt = `
        <!-- Safety Hard Hat + Blueprint Bid Clipboard & Caution Perimeter Banner -->
        <g transform="translate(22, 24)">
          <!-- Hard Hat Vector -->
          <path d="M25,175 C25,75 215,75 215,175 Z" fill="${p}" stroke="#111" stroke-width="3" filter="url(#shadow)"/>
          <path d="M95,78 L145,78 L152,175 L88,175 Z" fill="#FFFFFF" opacity="0.22"/>
          <rect x="8" y="170" width="224" height="22" rx="10" fill="#141518" stroke="${p}" stroke-width="2"/>
          <rect x="65" y="102" width="110" height="60" rx="8" fill="${bg}" stroke="#111" stroke-width="2"/>
          ${placeLogo(logoHref, ar, 120, 132, 92, 48)}
          <text x="120" y="218" text-anchor="middle" fill="${ink}" font-family="Courier New, monospace" font-size="10.5" font-weight="700">CASCO ANSI Z89.1 · SUPERVISOR</text>
        </g>
        <!-- Blueprint & Estimate Clipboard on Right -->
        <rect x="268" y="18" width="220" height="365" rx="10" fill="${bg}" stroke="${p}" stroke-width="2.5" filter="url(#shadow)"/>
        <rect x="333" y="8" width="90" height="24" rx="5" fill="${p}"/>
        ${placeLogo(logoHref, ar, 378, 72, 135, 65)}
        <rect x="286" y="118" width="184" height="130" rx="6" fill="#0E2A47" stroke="#38BDF8" stroke-width="1.5"/>
        <!-- Blueprint Floorplan Grid -->
        <line x1="286" y1="160" x2="470" y2="160" stroke="#38BDF8" stroke-opacity="0.35"/>
        <line x1="286" y1="205" x2="470" y2="205" stroke="#38BDF8" stroke-opacity="0.35"/>
        <line x1="345" y1="118" x2="345" y2="248" stroke="#38BDF8" stroke-opacity="0.35"/>
        <line x1="410" y1="118" x2="410" y2="248" stroke="#38BDF8" stroke-opacity="0.35"/>
        <rect x="305" y="136" width="145" height="92" fill="none" stroke="#FFFFFF" stroke-width="2"/>
        <line x1="365" y1="136" x2="365" y2="228" stroke="#FFFFFF" stroke-width="1.5"/>
        <text x="378" y="242" text-anchor="middle" fill="#7FE3FF" font-family="Courier New, monospace" font-size="8.5">STRUCTURAL PLAN · SCALE 1:100</text>
        <text x="288" y="274" fill="#111" font-family="Courier New, monospace" font-size="10" font-weight="700">ESTIMATE #2026-089 · APPROVED</text>
        <text x="288" y="294" fill="#333" font-family="Arial, sans-serif" font-size="10">• Concrete &amp; Foundation: INCLUDED</text>
        <text x="288" y="312" fill="#333" font-family="Arial, sans-serif" font-size="10">• Structural Steel / Framing: OK</text>
        <rect x="288" y="330" width="180" height="34" rx="5" fill="${p}"/>
        <text x="378" y="352" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="10.5" font-weight="700">AUTHORIZED BUILDER</text>

        <!-- Perimeter Fence Banner Bottom -->
        <rect x="22" y="405" width="466" height="150" rx="10" fill="#111317" stroke="${p}" stroke-width="3" filter="url(#shadow)"/>
        <rect x="22" y="405" width="466" height="22" fill="${p}"/>
        <text x="255" y="420" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="10" font-weight="700" letter-spacing="2">CAUTION · CONSTRUCTION ZONE · HARD HAT REQUIRED</text>
        <rect x="40" y="442" width="145" height="96" rx="8" fill="${bg}"/>
        ${placeLogo(logoHref, ar, 112, 490, 125, 80)}
        <text x="205" y="468" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="18" font-weight="700">${esc(b.brandName)}</text>
        <text x="205" y="492" fill="${p}" font-family="Courier New, monospace" font-size="11.5" font-weight="700">GENERAL CONTRACTORS · LICENSED &amp; INSURED</text>
        <text x="205" y="518" fill="#D4D7DC" font-family="Courier New, monospace" font-size="12" font-weight="700">SITE OFFICE: ${esc(b.phone)} · ${esc(b.web)}</text>
      `;
      break;

    case "mtb_park":
      topArt = `
        <!-- Handlebar MTB Race Number Plate + Trail Difficulty Totem -->
        <g transform="translate(20, 22)">
          <path d="M25,40 L245,40 L265,120 L235,295 L35,295 L5,120 Z" fill="#F3EFE6" stroke="#C87D46" stroke-width="4" filter="url(#shadow)"/>
          <circle cx="55" cy="62" r="7" fill="#16241B"/>
          <circle cx="215" cy="62" r="7" fill="#16241B"/>
          <rect x="35" y="80" width="200" height="30" rx="5" fill="#1B3022"/>
          <text x="135" y="100" text-anchor="middle" fill="#F3EFE6" font-family="Courier New, monospace" font-size="11" font-weight="700">OFFICIAL TRAIL PASS · 2026</text>
          ${placeLogo(logoHref, ar, 135, 165, 165, 95)}
          <text x="135" y="268" text-anchor="middle" fill="#1B3022" font-family="Impact, Arial Black, sans-serif" font-size="54" font-weight="900">#042</text>
          <text x="135" y="328" text-anchor="middle" fill="#F3EFE6" font-family="Courier New, monospace" font-size="10.5" font-weight="700">PLACA DE MANUBRIO RESISTENTE AL BARRO</text>
        </g>
        <!-- Wooden Trailhead Wayfinding Totem on Right -->
        <rect x="315" y="18" width="165" height="535" rx="12" fill="#2A1B12" stroke="#C87D46" stroke-width="3" filter="url(#shadow)"/>
        <rect x="331" y="36" width="133" height="100" rx="8" fill="#F3EFE6"/>
        ${placeLogo(logoHref, ar, 397, 86, 115, 82)}
        <!-- Trail Difficulty Badges -->
        <rect x="331" y="156" width="133" height="72" rx="8" fill="#1B3022" stroke="#6AB04C" stroke-width="2"/>
        <circle cx="358" cy="192" r="14" fill="#6AB04C"/>
        <text x="382" y="188" fill="#FFF" font-family="Arial, sans-serif" font-size="11" font-weight="700">RIVER LOOP</text>
        <text x="382" y="205" fill="#6AB04C" font-family="Courier New, monospace" font-size="9.5">EASY · 4.2 MILES</text>

        <rect x="331" y="244" width="133" height="72" rx="8" fill="#152938" stroke="#3E6B89" stroke-width="2"/>
        <rect x="344" y="266" width="26" height="26" rx="3" fill="#3E6B89"/>
        <text x="382" y="276" fill="#FFF" font-family="Arial, sans-serif" font-size="11" font-weight="700">BLUE RIDGE</text>
        <text x="382" y="293" fill="#7FE3FF" font-family="Courier New, monospace" font-size="9.5">FLOW · 6.8 MILES</text>

        <rect x="331" y="332" width="133" height="82" rx="8" fill="#111" stroke="#C87D46" stroke-width="2"/>
        <polygon points="357,352 371,373 357,394 343,373" fill="#C87D46"/>
        <text x="380" y="368" fill="#FFF" font-family="Arial, sans-serif" font-size="10.5" font-weight="700">GATOR DROP</text>
        <text x="380" y="385" fill="#C87D46" font-family="Courier New, monospace" font-size="9">BLACK DIAMOND</text>
        <text x="380" y="400" fill="#AAA" font-family="Courier New, monospace" font-size="8.5">EXPERT ONLY</text>

        <!-- Wristband below plate -->
        <rect x="24" y="375" width="265" height="175" rx="12" fill="#1F3126" stroke="#3E6B89" stroke-width="2"/>
        <text x="42" y="404" fill="#C87D46" font-family="Courier New, monospace" font-size="10.5" font-weight="700">MAPA TOPOGRÁFICO &amp; ELEVACIÓn</text>
        <path d="M42,465 Q95,410 140,455 T235,425 T270,460" fill="none" stroke="#6AB04C" stroke-width="3"/>
        <path d="M42,495 Q105,445 155,485 T255,455" fill="none" stroke="#3E6B89" stroke-width="2" stroke-dasharray="5 4"/>
        <text x="42" y="530" fill="#F3EFE6" font-family="Courier New, monospace" font-size="10">ELEV. GAIN: +1,420 FT · EMERGENCY: 911</text>
      `;
      break;

    case "photo_bf":
    case "photo_lorena":
      topArt = `
        <!-- Fine Art Keepsake Box + Engraved USB & Silk Ribbon Envelope -->
        <rect x="24" y="22" width="255" height="340" rx="12" fill="${bg}" stroke="${p}" stroke-width="2.5" filter="url(#shadow)"/>
        <rect x="38" y="36" width="227" height="312" rx="8" fill="none" stroke="${s}" stroke-width="1.2" stroke-dasharray="4 3"/>
        <!-- Silk Ribbon Bow on Left Edge -->
        <rect x="24" y="172" width="255" height="28" fill="${p}" opacity="0.9"/>
        <rect x="64" y="95" width="175" height="130" rx="8" fill="${bg}" stroke="${p}" stroke-width="1.8" filter="url(#shadow)"/>
        ${placeLogo(logoHref, ar, 151, 160, 148, 95)}
        <text x="151" y="275" text-anchor="middle" fill="${fg}" font-family="Georgia, serif" font-size="12" font-style="italic">Fine Art Print Collection</text>
        <text x="151" y="325" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">ARCHIVAL LINEN CLAMSHELL BOX</text>

        <!-- Engraved Wooden/Metal USB Compartment on Right -->
        <rect x="300" y="22" width="186" height="340" rx="12" fill="${surf}" stroke="${p}" stroke-width="2" filter="url(#shadow)"/>
        <text x="393" y="52" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="10" font-weight="700">MEMORIA USB 64GB</text>
        <rect x="353" y="75" width="80" height="44" rx="4" fill="#CBD5E1" stroke="#64748B" stroke-width="2"/>
        <rect x="366" y="88" width="18" height="18" fill="#475569"/>
        <rect x="402" y="88" width="18" height="18" fill="#475569"/>
        <rect x="338" y="115" width="110" height="175" rx="12" fill="${bg}" stroke="${p}" stroke-width="2.5" filter="url(#shadow)"/>
        ${placeLogo(logoHref, ar, 393, 202, 90, 110)}
        <text x="393" y="325" text-anchor="middle" fill="${ink}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">RAW + HIGH-RES GALLERY</text>

        <!-- Gift Voucher / Session Certificate Below -->
        <rect x="24" y="384" width="462" height="172" rx="12" fill="${bg}" stroke="${p}" stroke-width="2" filter="url(#shadow)"/>
        <rect x="24" y="384" width="14" height="172" rx="4" fill="${p}"/>
        ${placeLogo(logoHref, ar, 125, 470, 135, 95)}
        <line x1="215" y1="404" x2="215" y2="536" stroke="${p}" stroke-opacity="0.35" stroke-dasharray="5 4"/>
        <text x="235" y="422" fill="${p}" font-family="Courier New, monospace" font-size="10.5" font-weight="700" letter-spacing="1.5">GIFT VOUCHER · SESIÓN FOTOGRÁFICA</text>
        <text x="235" y="450" fill="${fg}" font-family="Georgia, serif" font-size="18" font-weight="700">Portrait &amp; Editorial Experience</text>
        <text x="235" y="476" fill="${fg}" opacity="0.8" font-family="Arial, sans-serif" font-size="10.5">Incluye dirección de pose, iluminación de estudio y</text>
        <text x="235" y="494" fill="${fg}" opacity="0.8" font-family="Arial, sans-serif" font-size="10.5">galería privada online con entrega en alta resolución.</text>
        <rect x="235" y="510" width="225" height="28" rx="6" fill="${p}"/>
        <text x="347" y="528" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="10" font-weight="700">RESERVAS: ${esc(b.phone)}</text>
      `;
      break;

    case "jewelry_clover":
    case "jewelry_soza":
      topArt = `
        <!-- Luxury Velvet Ring Box + 18K Gold & Diamond Certificate + Boutique Bag -->
        <g transform="translate(22, 18)">
          <!-- Open Velvet Ring Box -->
          <rect x="10" y="18" width="220" height="155" rx="18" fill="#0D0D11" stroke="${p}" stroke-width="2.5" filter="url(#shadow)"/>
          <rect x="22" y="30" width="196" height="131" rx="12" fill="none" stroke="${p}" stroke-opacity="0.55" stroke-width="1"/>
          ${placeLogo(logoHref, ar, 120, 95, 160, 90)}
          <!-- Lower Velvet Cushion with Solitaire Diamond Ring -->
          <rect x="5" y="180" width="230" height="145" rx="16" fill="#17171E" stroke="${p}" stroke-width="2.5" filter="url(#shadow)"/>
          <ellipse cx="120" cy="252" rx="85" ry="26" fill="#09090C" stroke="${p}" stroke-width="1.2"/>
          <circle cx="120" cy="246" r="24" fill="none" stroke="${p}" stroke-width="5"/>
          <polygon points="120,202 136,218 120,232 104,218" fill="#FFFFFF" stroke="${p}" stroke-width="1.8"/>
          <text x="120" y="348" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="10" font-weight="700">ESTUCHE EN TERCIOPELO CON FOIL 18K</text>
        </g>

        <!-- Luxury Boutique Shopping Bag on Right -->
        <g transform="translate(278, 22)">
          <path d="M55,45 C55,5 145,5 145,45" fill="none" stroke="${p}" stroke-width="4.5" stroke-linecap="round"/>
          <polygon points="18,45 182,45 196,315 4,315" fill="#0B0B0F" stroke="${p}" stroke-width="2.2" filter="url(#shadow)"/>
          <line x1="12" y1="285" x2="188" y2="285" stroke="${p}" stroke-width="1.5"/>
          ${placeLogo(logoHref, ar, 100, 165, 145, 95)}
          <text x="100" y="344" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="10" font-weight="700">BOLSA BOUTIQUE CON CORDÓN DE SEDA</text>
        </g>

        <!-- Certificate of Authenticity & Diamond Grading Card Below -->
        <rect x="24" y="388" width="462" height="168" rx="12" fill="#0E0E13" stroke="${p}" stroke-width="2.2" filter="url(#shadow)"/>
        <rect x="34" y="398" width="442" height="148" rx="8" fill="none" stroke="${p}" stroke-opacity="0.4" stroke-dasharray="6 3"/>
        ${placeLogo(logoHref, ar, 120, 465, 145, 85)}
        <text x="212" y="424" fill="${p}" font-family="Courier New, monospace" font-size="10.5" font-weight="700" letter-spacing="1">CERTIFICATE OF AUTHENTICITY</text>
        <text x="212" y="446" fill="#FFFFFF" font-family="Georgia, serif" font-size="12" font-weight="700">Fine 18K Solid Gold &amp; Natural Gemstones</text>
        <text x="212" y="470" fill="#D4AF37" font-family="Courier New, monospace" font-size="9.5">• METAL: 750 / 18K SOLID GOLD</text>
        <text x="212" y="488" fill="#D4AF37" font-family="Courier New, monospace" font-size="9.5">• CLARITY: VVS1 · IDEAL CUT</text>
        <text x="212" y="506" fill="#D4AF37" font-family="Courier New, monospace" font-size="9.5">• LIFETIME CLEANING WARRANTY</text>
        <circle cx="436" cy="495" r="28" fill="${p}"/>
        <text x="436" y="492" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="8.5" font-weight="700">GIA / 18K</text>
        <text x="436" y="504" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="7.5" font-weight="700">CERTIFIED</text>
      `;
      break;

    case "florist":
      topArt = `
        <!-- Botanical Kraft Bouquet Sleeve + Wax Seal + Flower Care Guide Card -->
        <g transform="translate(24, 18)">
          <!-- Conical Kraft Floral Wrap -->
          <polygon points="20,35 235,35 180,335 75,335" fill="#EFE6D5" stroke="#2E473B" stroke-width="2.5" filter="url(#shadow)"/>
          <!-- Decorative Botanical Blooms at Top -->
          <circle cx="85" cy="36" r="24" fill="#D9384A"/>
          <circle cx="130" cy="28" r="28" fill="#E85D6F"/>
          <circle cx="175" cy="38" r="22" fill="#D9384A"/>
          <path d="M50,35 Q30,10 65,18 M205,35 Q225,10 190,18" fill="none" stroke="#2E473B" stroke-width="5" stroke-linecap="round"/>
          <!-- Brand Label on Bouquet Wrap -->
          <rect x="52" y="105" width="150" height="92" rx="8" fill="#FFFFFF" stroke="#D9384A" stroke-width="2"/>
          ${placeLogo(logoHref, ar, 127, 151, 130, 72)}
          <!-- Red Wax Seal -->
          <circle cx="127" cy="248" r="24" fill="#D9384A" stroke="#9E1F2E" stroke-width="3" filter="url(#shadow)"/>
          <text x="127" y="252" text-anchor="middle" fill="#FFF" font-family="Georgia, serif" font-size="11" font-weight="700">DF</text>
          <text x="127" y="362" text-anchor="middle" fill="#2E473B" font-family="Courier New, monospace" font-size="10" font-weight="700">PAPEL KRAFT BOTÁNICO + SELLO DE LACRE</text>
        </g>

        <!-- Flower Care & Dedication Card on Right -->
        <rect x="285" y="24" width="200" height="340" rx="12" fill="#FFFFFF" stroke="#2E473B" stroke-width="2" filter="url(#shadow)"/>
        <rect x="285" y="24" width="200" height="32" rx="10" fill="#2E473B"/>
        <text x="385" y="45" text-anchor="middle" fill="#FAF6F0" font-family="Courier New, monospace" font-size="10" font-weight="700">FLOWER CARE GUIDE</text>
        ${placeLogo(logoHref, ar, 385, 98, 145, 65)}
        <line x1="305" y1="142" x2="465" y2="142" stroke="#D9384A" stroke-opacity="0.4"/>
        <text x="305" y="168" fill="#2E473B" font-family="Arial, sans-serif" font-size="10.5" font-weight="700">1. Corta 2 cm en diagonal</text>
        <text x="305" y="186" fill="#555" font-family="Arial, sans-serif" font-size="9.5">Cada 2 días bajo agua fresca.</text>
        <text x="305" y="214" fill="#2E473B" font-family="Arial, sans-serif" font-size="10.5" font-weight="700">2. Nutriente floral incluido</text>
        <text x="305" y="232" fill="#555" font-family="Arial, sans-serif" font-size="9.5">Disuelve 1 sobre en el florero.</text>
        <text x="305" y="260" fill="#2E473B" font-family="Arial, sans-serif" font-size="10.5" font-weight="700">3. Luz indirecta fresca</text>
        <text x="305" y="278" fill="#555" font-family="Arial, sans-serif" font-size="9.5">Evita el sol directo y corrientes.</text>
        <rect x="305" y="302" width="160" height="42" rx="6" fill="#FAF6F0" stroke="#D9384A"/>
        <text x="385" y="320" text-anchor="middle" fill="#D9384A" font-family="Georgia, serif" font-size="10" font-style="italic">"Con amor en tu día especial"</text>
        <text x="385" y="335" text-anchor="middle" fill="#2E473B" font-family="Courier New, monospace" font-size="8.5">${esc(b.phone)}</text>

        <!-- Luxury Hatbox Arrangement Bottom -->
        <rect x="24" y="392" width="462" height="164" rx="12" fill="#2E473B" stroke="#D9384A" stroke-width="2" filter="url(#shadow)"/>
        <rect x="44" y="412" width="150" height="124" rx="8" fill="#FFFFFF"/>
        ${placeLogo(logoHref, ar, 119, 474, 130, 90)}
        <text x="212" y="438" fill="#FAF6F0" font-family="Georgia, serif" font-size="14.5" font-weight="700">Luxury Velvet Hatbox Collection</text>
        <text x="212" y="462" fill="#D9A05B" font-family="Courier New, monospace" font-size="9.5" font-weight="700">CAJA SOMBRERERA IMPERMEABLE + CINTA SATINADA</text>
        <text x="212" y="488" fill="#FAF6F0" opacity="0.9" font-family="Arial, sans-serif" font-size="10">Rosas ecuatorianas de tallo largo, eucalipto fresco y</text>
        <text x="212" y="506" fill="#FAF6F0" opacity="0.9" font-family="Arial, sans-serif" font-size="10">tarjetería perfumada para bodas, aniversarios y eventos.</text>
      `;
      break;

    case "remodeling_dhomes":
    case "realestate_newera":
      topArt = `
        <!-- Real Estate / Remodeling Inverted-L Yard Sign Post + Luxury Key Presentation Box -->
        <g transform="translate(22, 16)">
          <!-- White / Gold Architectural Post -->
          <rect x="22" y="10" width="18" height="350" rx="3" fill="${p}"/>
          <rect x="6" y="36" width="248" height="16" rx="3" fill="${p}"/>
          <!-- Hanging Yard Sign Panel -->
          <rect x="52" y="58" width="192" height="225" rx="10" fill="${bg}" stroke="${p}" stroke-width="3" filter="url(#shadow)"/>
          <rect x="52" y="58" width="192" height="34" rx="8" fill="${p}"/>
          <text x="148" y="80" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="11" font-weight="700">${b.heroType === "remodeling_dhomes" ? "REMODELING IN PROGRESS" : "EXCLUSIVE LISTING"}</text>
          ${placeLogo(logoHref, ar, 148, 152, 156, 95)}
          <rect x="66" y="218" width="164" height="48" rx="6" fill="#111215"/>
          <text x="148" y="238" text-anchor="middle" fill="${p}" font-family="Arial, sans-serif" font-size="12" font-weight="700">${esc(b.phone)}</text>
          <text x="148" y="256" text-anchor="middle" fill="#FFF" font-family="Courier New, monospace" font-size="9">${esc(b.web)}</text>
          <!-- Rider Sign Below -->
          <rect x="52" y="294" width="192" height="38" rx="6" fill="${p}" filter="url(#shadow)"/>
          <text x="148" y="318" text-anchor="middle" fill="#111" font-family="Arial, sans-serif" font-size="13" font-weight="700">${b.heroType === "remodeling_dhomes" ? "DESIGN + BUILD BY D HOMES" : "SOLD · WELCOME HOME"}</text>
        </g>

        <!-- Closing Folder & Custom Key Box on Right -->
        <rect x="284" y="24" width="202" height="335" rx="12" fill="#14161B" stroke="${p}" stroke-width="2.2" filter="url(#shadow)"/>
        <rect x="302" y="44" width="166" height="105" rx="8" fill="${bg}"/>
        ${placeLogo(logoHref, ar, 385, 96, 140, 82)}
        <text x="385" y="178" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="10.5" font-weight="700">CLOSING &amp; KEY HANDOVER BOX</text>
        <!-- Golden Key Vector -->
        <circle cx="352" cy="232" r="22" fill="none" stroke="${p}" stroke-width="5"/>
        <circle cx="352" cy="232" r="8" fill="${p}"/>
        <line x1="374" y1="232" x2="442" y2="232" stroke="${p}" stroke-width="6" stroke-linecap="round"/>
        <line x1="418" y1="232" x2="418" y2="250" stroke="${p}" stroke-width="5" stroke-linecap="round"/>
        <line x1="434" y1="232" x2="434" y2="254" stroke="${p}" stroke-width="5" stroke-linecap="round"/>
        <rect x="304" y="282" width="162" height="54" rx="6" fill="${surf}" stroke="${p}"/>
        <text x="385" y="304" text-anchor="middle" fill="#FFF" font-family="Arial, sans-serif" font-size="10.5" font-weight="700">CARPETA DE PROPIETARIO</text>
        <text x="385" y="322" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="9">CONTRATOS · PLANOS · GARANTÍA</text>

        <!-- Lower Architectural / Property Showcase Strip -->
        <rect x="24" y="388" width="462" height="168" rx="12" fill="${surf}" stroke="${p}" stroke-width="2"/>
        <text x="44" y="418" fill="${p}" font-family="Courier New, monospace" font-size="11" font-weight="700">PRESENTACIÓN DE PROYECTO Y ACABADOS RESIDENCIALES</text>
        <text x="44" y="446" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="15" font-weight="700">${esc(b.brandName)} · Louisville, KY</text>
        <text x="44" y="472" fill="#D4D7DC" font-family="Arial, sans-serif" font-size="10.5">• Dosier impreso con renders 3D, presupuesto desglosado y cronograma.</text>
        <text x="44" y="492" fill="#D4D7DC" font-family="Arial, sans-serif" font-size="10.5">• Llavero metálico grabado en láser para el día de entrega de llaves.</text>
        <text x="44" y="512" fill="#D4D7DC" font-family="Arial, sans-serif" font-size="10.5">• Señalización exterior resistente a intemperie con QR directo a WhatsApp.</text>
      `;
      break;

    case "academy_dg":
    case "academy_lens":
      topArt = `
        <!-- Official Academy Diploma Certificate + Student ID Badge -->
        <rect x="22" y="18" width="464" height="335" rx="12" fill="${bg}" stroke="${p}" stroke-width="3" filter="url(#shadow)"/>
        <rect x="34" y="30" width="440" height="311" rx="8" fill="none" stroke="${p}" stroke-width="1.2" stroke-dasharray="6 3"/>
        ${placeLogo(logoHref, ar, 254, 92, 165, 86)}
        <text x="254" y="156" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="11" font-weight="700" letter-spacing="2">CERTIFICATE OF GRADUATION &amp; MASTERY</text>
        <text x="254" y="182" text-anchor="middle" fill="${fg}" font-family="Georgia, serif" font-size="12" font-style="italic">This certifies that the student named below has successfully completed</text>
        <text x="254" y="218" text-anchor="middle" fill="${fg}" font-family="Georgia, serif" font-size="22" font-weight="700">Alejandro Valdés</text>
        <line x1="120" y1="228" x2="388" y2="228" stroke="${p}" stroke-width="1.5"/>
        <text x="254" y="252" text-anchor="middle" fill="${fg}" font-family="Arial, sans-serif" font-size="11.5" font-weight="700">${esc(b.services[0])}</text>
        <!-- Gold Foil Notary Seal on Diploma -->
        <circle cx="408" cy="285" r="34" fill="${p}" stroke="#FFF" stroke-width="2" filter="url(#shadow)"/>
        <text x="408" y="282" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="8.5" font-weight="700">VERIFIED</text>
        <text x="408" y="295" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="8" font-weight="700">DIPLOMA</text>
        <line x1="74" y1="302" x2="195" y2="302" stroke="${fg}" stroke-opacity="0.6"/>
        <text x="134" y="318" text-anchor="middle" fill="${fg}" font-family="Courier New, monospace" font-size="9">${esc(b.person)}</text>

        <!-- Student / Studio Pass + Pocket Guide Below -->
        <rect x="22" y="374" width="222" height="184" rx="10" fill="${surf}" stroke="${p}" stroke-width="2"/>
        <text x="133" y="402" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="10" font-weight="700">CREDENCIAL DE ALUMNO VIP</text>
        <rect x="42" y="414" width="182" height="126" rx="8" fill="${bg}"/>
        ${placeLogo(logoHref, ar, 133, 464, 120, 68)}
        <text x="133" y="524" text-anchor="middle" fill="${fg}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">ID #2026-884 · FULL ACCESS</text>

        <rect x="262" y="374" width="224" height="184" rx="10" fill="${surf}" stroke="${p}" stroke-width="2"/>
        <text x="374" y="402" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="10" font-weight="700">MANUAL &amp; WORKBOOK</text>
        <text x="282" y="432" fill="${ink}" font-family="Arial, sans-serif" font-size="11" font-weight="700">Kit de Bienvenida del Estudiante:</text>
        <text x="282" y="456" fill="${ink}" opacity="0.85" font-family="Arial, sans-serif" font-size="10">• Cuaderno de prácticas impreso</text>
        <text x="282" y="476" fill="${ink}" opacity="0.85" font-family="Arial, sans-serif" font-size="10">• Acceso a plataforma 24/7 con QR</text>
        <text x="282" y="496" fill="${ink}" opacity="0.85" font-family="Arial, sans-serif" font-size="10">• Diploma físico con sello relieve</text>
        <rect x="282" y="514" width="184" height="26" rx="5" fill="${p}"/>
        <text x="374" y="531" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">${esc(b.web)}</text>
      `;
      break;

    case "detailing":
      topArt = `
        <!-- 2 Pro Detailing Spray Bottles (Ceramic 9H & Wheel Cleaner) + Rearview Mirror Air Freshener -->
        <g transform="translate(26, 20)">
          <!-- Spray Bottle 1: Ceramic Coating -->
          <path d="M55,15 L125,15 L145,42 L110,48 L110,75 L65,75 L65,42 L40,58 Z" fill="#0077FF"/>
          <rect x="35" y="75" width="105" height="255" rx="18" fill="#0D121A" stroke="#0077FF" stroke-width="2.5" filter="url(#shadow)"/>
          <rect x="45" y="115" width="85" height="175" rx="8" fill="#121924" stroke="#00D4FF" stroke-width="1.5"/>
          ${placeLogo(logoHref, ar, 87, 165, 76, 56)}
          <text x="87" y="222" text-anchor="middle" fill="#00D4FF" font-family="Courier New, monospace" font-size="10" font-weight="700">CERAMIC 9H</text>
          <text x="87" y="238" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="8.5">HYDROPHOBIC COAT</text>
          <rect x="53" y="254" width="68" height="20" rx="4" fill="#0077FF"/>
          <text x="87" y="268" text-anchor="middle" fill="#FFF" font-family="Courier New, monospace" font-size="8.5" font-weight="700">500 ML PRO</text>

          <!-- Spray Bottle 2: Interior & Leather -->
          <g transform="translate(135, 0)">
            <path d="M55,15 L125,15 L145,42 L110,48 L110,75 L65,75 L65,42 L40,58 Z" fill="#00D4FF"/>
            <rect x="35" y="75" width="105" height="255" rx="18" fill="#0D121A" stroke="#00D4FF" stroke-width="2.5" filter="url(#shadow)"/>
            <rect x="45" y="115" width="85" height="175" rx="8" fill="#121924" stroke="#0077FF" stroke-width="1.5"/>
            ${placeLogo(logoHref, ar, 87, 165, 76, 56)}
            <text x="87" y="222" text-anchor="middle" fill="#FFFFFF" font-family="Courier New, monospace" font-size="10" font-weight="700">ULTRA GLOSS</text>
            <text x="87" y="238" text-anchor="middle" fill="#00D4FF" font-family="Arial, sans-serif" font-size="8.5">QUICK DETAILER</text>
            <rect x="53" y="254" width="68" height="20" rx="4" fill="#00D4FF"/>
            <text x="87" y="268" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="8.5" font-weight="700">PH NEUTRAL</text>
          </g>
        </g>

        <!-- Die-Cut Mirror Air Freshener & Warranty Sticker on Right -->
        <g transform="translate(318, 26)">
          <line x1="82" y1="0" x2="82" y2="48" stroke="#00D4FF" stroke-width="3" stroke-dasharray="4 3"/>
          <polygon points="82,42 156,95 140,265 24,265 8,95" fill="#0D121A" stroke="#0077FF" stroke-width="2.5" filter="url(#shadow)"/>
          <circle cx="82" cy="64" r="6" fill="#121924" stroke="#00D4FF" stroke-width="2"/>
          ${placeLogo(logoHref, ar, 82, 145, 118, 78)}
          <text x="82" y="216" text-anchor="middle" fill="#00D4FF" font-family="Courier New, monospace" font-size="9.5" font-weight="700">NEW CAR SCENT</text>
          <text x="82" y="234" text-anchor="middle" fill="#FFF" font-family="Courier New, monospace" font-size="8.5">${esc(b.phone)}</text>
          <text x="82" y="294" text-anchor="middle" fill="#00D4FF" font-family="Courier New, monospace" font-size="9.5" font-weight="700">AROMATIZANTE DE ESPEJO</text>
        </g>

        <!-- Ceramic Coating Door-Jamb Warranty Card Below -->
        <rect x="24" y="382" width="462" height="174" rx="12" fill="#0D121A" stroke="#0077FF" stroke-width="2.2"/>
        <text x="44" y="414" fill="#00D4FF" font-family="Courier New, monospace" font-size="11" font-weight="700">CERTIFICADO DE PROTECCIÓN CERÁMICA 9H &amp; PPF</text>
        <text x="44" y="442" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="14" font-weight="700">VIN / VEHICLE: _______________________ · GARANTÍA 5 AÑOS</text>
        <text x="44" y="470" fill="#CBD5E1" font-family="Arial, sans-serif" font-size="10.5">• Sticker impermeable para marco de puerta con fecha de mantenimiento.</text>
        <text x="44" y="490" fill="#CBD5E1" font-family="Arial, sans-serif" font-size="10.5">• Tapete de papel kraft protector de piso "Gracias por confiar tu auto".</text>
        <rect x="44" y="510" width="220" height="30" rx="6" fill="#0077FF"/>
        <text x="154" y="529" text-anchor="middle" fill="#FFF" font-family="Courier New, monospace" font-size="10" font-weight="700">CITAS: ${esc(b.phone)}</text>
      `;
      break;

    case "fashion_ffs":
      topArt = `
        <!-- Runway Backstage VIP Laminate Pass + Model Comp Card (Zed Card) -->
        <g transform="translate(24, 18)">
          <path d="M70,0 L105,48 L140,0" fill="none" stroke="#D5C3AA" stroke-width="7"/>
          <rect x="18" y="44" width="175" height="305" rx="12" fill="#FAF9F6" stroke="#D5C3AA" stroke-width="2.5" filter="url(#shadow)"/>
          <rect x="18" y="44" width="175" height="38" rx="10" fill="#0D0D0F"/>
          <text x="105" y="68" text-anchor="middle" fill="#D5C3AA" font-family="Courier New, monospace" font-size="11" font-weight="700" letter-spacing="2">BACKSTAGE VIP</text>
          ${placeLogo(logoHref, ar, 105, 152, 138, 105)}
          <rect x="34" y="226" width="143" height="58" rx="6" fill="#0D0D0F"/>
          <text x="105" y="248" text-anchor="middle" fill="#FAF9F6" font-family="Georgia, serif" font-size="12" font-weight="700">FRONT ROW &amp; RUNWAY</text>
          <text x="105" y="268" text-anchor="middle" fill="#D5C3AA" font-family="Courier New, monospace" font-size="9.5">SEASON FW / SS COLLECTION</text>
          <text x="105" y="325" text-anchor="middle" fill="#0D0D0F" font-family="Courier New, monospace" font-size="9.5" font-weight="700">PASS #001 · ALL ACCESS</text>
        </g>

        <!-- Model Agency Comp Card on Right -->
        <rect x="242" y="22" width="242" height="340" rx="12" fill="#FAF9F6" stroke="#D5C3AA" stroke-width="2" filter="url(#shadow)"/>
        <rect x="258" y="38" width="210" height="175" rx="6" fill="#16161A"/>
        ${placeLogo(logoHref, ar, 363, 112, 120, 88)}
        <text x="363" y="196" text-anchor="middle" fill="#D5C3AA" font-family="Courier New, monospace" font-size="9.5" letter-spacing="2">EDITORIAL TALENT PORTFOLIO</text>
        <text x="363" y="242" text-anchor="middle" fill="#0D0D0F" font-family="Georgia, serif" font-size="20" font-weight="700" letter-spacing="2">VALENTINA R.</text>
        <text x="363" y="266" text-anchor="middle" fill="#555" font-family="Courier New, monospace" font-size="9.5">HEIGHT: 5'10" · BUST: 32" · WAIST: 24"</text>
        <text x="363" y="284" text-anchor="middle" fill="#555" font-family="Courier New, monospace" font-size="9.5">HIPS: 34.5" · SHOES: 8.5 · EYES: HAZEL</text>
        <line x1="268" y1="302" x2="458" y2="302" stroke="#D5C3AA"/>
        <text x="363" y="324" text-anchor="middle" fill="#0D0D0F" font-family="Courier New, monospace" font-size="9.5" font-weight="700">BOOKINGS: ${esc(b.web)}</text>

        <!-- Front Row Seat Card Below -->
        <rect x="24" y="386" width="460" height="170" rx="12" fill="#16161A" stroke="#D5C3AA" stroke-width="2"/>
        <text x="44" y="420" fill="#D5C3AA" font-family="Courier New, monospace" font-size="11" font-weight="700" letter-spacing="2">INVITACIÓN DE PRIMERA FILA (FRONT ROW SEAT ASSIGNMENT)</text>
        <text x="44" y="454" fill="#FAF9F6" font-family="Georgia, serif" font-size="20" font-weight="700">SEAT A-01 · VIP PRESS &amp; BUYERS</text>
        <text x="44" y="484" fill="#D5C3AA" font-family="Arial, sans-serif" font-size="11">• Sobre negro mate con sello en lacre color champagne y QR de confirmación RSVP.</text>
        <text x="44" y="506" fill="#D5C3AA" font-family="Arial, sans-serif" font-size="11">• Media Wall / Step-and-Repeat de alfombra roja con monograma FFS intercalado.</text>
      `;
      break;

    default:
      // Rich custom layout for the remaining specialized industries (#11 to #32)
      topArt = renderSpecializedTopArt(b, logoHref, ar);
      break;
  }

  return `<g transform="translate(16, 62)">
    ${topArt}
    ${bottomDeliverables}
  </g>`;
}

function renderSpecializedTopArt(b, logoHref, ar) {
  const p = b.primary;
  const s = b.secondary;
  const bg = b.logoBoxBg;
  const fg = isLightHex(bg) ? "#121418" : "#F8FAFC";
  const surf = b.surface;
  const ink = b.ink;

  switch (b.heroType) {
    case "fence_jf":
      return `
        <!-- Riveted Aluminum Fence Plate + Linear Foot Estimate Sheet -->
        <rect x="20" y="24" width="248" height="190" rx="12" fill="#D4D7DC" stroke="#151518" stroke-width="3" filter="url(#shadow)"/>
        <circle cx="38" cy="42" r="6" fill="#151518"/><circle cx="250" cy="42" r="6" fill="#151518"/>
        <circle cx="38" cy="196" r="6" fill="#151518"/><circle cx="250" cy="196" r="6" fill="#151518"/>
        <rect x="44" y="42" width="200" height="115" rx="8" fill="#FFFFFF" stroke="#E1251B" stroke-width="2"/>
        ${placeLogo(logoHref, ar, 144, 99, 175, 95)}
        <rect x="44" y="164" width="200" height="32" rx="4" fill="#E1251B"/>
        <text x="144" y="185" text-anchor="middle" fill="#FFFFFF" font-family="Courier New, monospace" font-size="11" font-weight="700">INSTALLED BY JIMAGUAS · ${esc(b.phone)}</text>
        <text x="144" y="238" text-anchor="middle" fill="${ink}" font-family="Courier New, monospace" font-size="10" font-weight="700">PLACA DE ALUMINIO REMACHADA EN CADA CERCA</text>

        <!-- Fence Picket Diagram & Quote Pad on Right -->
        <rect x="286" y="22" width="200" height="338" rx="10" fill="#F5F6F8" stroke="#E1251B" stroke-width="2.5" filter="url(#shadow)"/>
        <rect x="286" y="22" width="200" height="34" rx="8" fill="#E1251B"/>
        <text x="386" y="44" text-anchor="middle" fill="#FFF" font-family="Courier New, monospace" font-size="10.5" font-weight="700">COTIZACIÓN POR PIE LINEAL</text>
        <!-- Fence Pickets Illustration -->
        ${[0,1,2,3,4,5].map(i => `<polygon points="${306+i*27},82 ${316+i*27},68 ${326+i*27},82 ${326+i*27},168 ${306+i*27},168" fill="#D4D7DC" stroke="#151518" stroke-width="1.5"/>`).join("")}
        <rect x="300" y="102" width="172" height="10" fill="#E1251B"/>
        <rect x="300" y="142" width="172" height="10" fill="#E1251B"/>
        <text x="304" y="196" fill="#151518" font-family="Courier New, monospace" font-size="10" font-weight="700">[✓] Cedar Privacy 6ft / 8ft</text>
        <text x="304" y="216" fill="#151518" font-family="Courier New, monospace" font-size="10" font-weight="700">[✓] White Vinyl &amp; Aluminum</text>
        <text x="304" y="236" fill="#151518" font-family="Courier New, monospace" font-size="10" font-weight="700">[✓] Chain-Link &amp; Double Gate</text>
        <rect x="304" y="256" width="164" height="84" rx="6" fill="#151518"/>
        <text x="386" y="282" text-anchor="middle" fill="#E1251B" font-family="Courier New, monospace" font-size="10" font-weight="700">TOTAL LINEAR FEET: 185 FT</text>
        <text x="386" y="304" text-anchor="middle" fill="#FFF" font-family="Arial, sans-serif" font-size="11" font-weight="700">POSTS IN 3,000 PSI CONCRETE</text>
        <text x="386" y="324" text-anchor="middle" fill="#D4D7DC" font-family="Courier New, monospace" font-size="9">5-YEAR WORKMANSHIP WARRANTY</text>

        <!-- Yard Sign Below Left -->
        <rect x="20" y="264" width="248" height="292" rx="10" fill="#1C1E23" stroke="#E1251B" stroke-width="2"/>
        <text x="144" y="294" text-anchor="middle" fill="#E1251B" font-family="Courier New, monospace" font-size="10.5" font-weight="700">ROTULACIÓN DE CAMIONETA Y REMOLQUE</text>
        <rect x="38" y="310" width="212" height="165" rx="8" fill="#F5F6F8"/>
        ${placeLogo(logoHref, ar, 144, 392, 180, 125)}
        <text x="144" y="505" text-anchor="middle" fill="#FFF" font-family="Arial, sans-serif" font-size="12" font-weight="700">FREE ESTIMATES · LOUISVILLE, KY</text>
        <text x="144" y="528" text-anchor="middle" fill="#E1251B" font-family="Courier New, monospace" font-size="11" font-weight="700">${esc(b.phone)}</text>
      `;

    case "la_letra":
    case "proptech_tzel":
    case "marketing_twoit":
      return `
        <!-- Interactive Software / PropTech / Agency Dashboard + Smart NFC Card -->
        <rect x="20" y="18" width="466" height="332" rx="14" fill="#110E1B" stroke="${p}" stroke-width="2.5" filter="url(#shadow)"/>
        <!-- Browser / App Top Bar -->
        <rect x="20" y="18" width="466" height="34" rx="12" fill="${surf}"/>
        <circle cx="42" cy="35" r="5" fill="#FF5B1F"/><circle cx="58" cy="35" r="5" fill="#FFCC29"/><circle cx="74" cy="35" r="5" fill="#10B981"/>
        <text x="253" y="39" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="10" font-weight="700">${esc(b.web)} · SISTEMA EN VIVO</text>
        <!-- Sidebar + Logo Box -->
        <rect x="36" y="66" width="155" height="266" rx="10" fill="${bg}" stroke="${p}" stroke-width="1.8"/>
        ${placeLogo(logoHref, ar, 113, 152, 132, 125)}
        <rect x="48" y="242" width="131" height="28" rx="6" fill="${p}"/>
        <text x="113" y="260" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="9.5" font-weight="700">100% TU PROPIO SISTEMA</text>
        <text x="113" y="292" text-anchor="middle" fill="${fg}" font-family="Courier New, monospace" font-size="8.5" font-weight="700">SIN LICENCIAS POR USUARIO</text>
        <text x="113" y="310" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="8.5" font-weight="700">DOMINIO Y CONTROL TOTAL</text>

        <!-- Main KPI & Pipeline Cards on Right of App Window -->
        <rect x="206" y="66" width="125" height="78" rx="8" fill="${surf}" stroke="${p}" stroke-opacity="0.5"/>
        <text x="220" y="88" fill="${p}" font-family="Courier New, monospace" font-size="9" font-weight="700">OPERACIÓN EN VIVO</text>
        <text x="220" y="118" fill="#FFF" font-family="Arial, sans-serif" font-size="22" font-weight="700">+340%</text>
        <text x="220" y="134" fill="#10B981" font-family="Courier New, monospace" font-size="8.5">CONTROL Y VELOCIDAD</text>

        <rect x="343" y="66" width="127" height="78" rx="8" fill="${surf}" stroke="${s}" stroke-opacity="0.6"/>
        <text x="357" y="88" fill="${p}" font-family="Courier New, monospace" font-size="9" font-weight="700">USUARIOS ACTIVOS</text>
        <text x="357" y="118" fill="#FFF" font-family="Arial, sans-serif" font-size="22" font-weight="700">$0 / MES</text>
        <text x="357" y="134" fill="${p}" font-family="Courier New, monospace" font-size="8.5">POR AGENTE / EMPLEADO</text>

        <!-- Pipeline / Map Radar Visualization -->
        <rect x="206" y="156" width="264" height="176" rx="8" fill="#0A0812" stroke="${p}" stroke-opacity="0.4"/>
        <text x="222" y="180" fill="${p}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">PIPELINE OPERATIVO &amp; RADAR INTELIGENTE</text>
        <polyline points="222,285 268,255 312,268 362,218 410,230 452,192" fill="none" stroke="${p}" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="362" cy="218" r="6" fill="#10B981"/><circle cx="452" cy="192" r="6" fill="${p}"/>
        <rect x="222" y="298" width="232" height="22" rx="4" fill="${surf}"/>
        <text x="338" y="313" text-anchor="middle" fill="#FFF" font-family="Courier New, monospace" font-size="9">WHATSAPP + IA + COTIZADOR INTEGRADO</text>

        <!-- NFC Smart Card + AR Trigger Below -->
        <rect x="20" y="368" width="466" height="190" rx="12" fill="${surf}" stroke="${p}" stroke-width="2"/>
        <rect x="38" y="388" width="215" height="150" rx="10" fill="${bg}" stroke="${p}" stroke-width="2" filter="url(#shadow)"/>
        ${placeLogo(logoHref, ar, 145, 452, 145, 88)}
        <text x="145" y="522" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">NFC + AR INTERACTIVE CARD</text>
        <!-- NFC Waves Icon -->
        <path d="M275,425 Q290,440 275,455 M284,418 Q304,440 284,462 M293,411 Q318,440 293,469" fill="none" stroke="${p}" stroke-width="2.5" stroke-linecap="round"/>
        <text x="304" y="425" fill="#FFF" font-family="Arial, sans-serif" font-size="11.5" font-weight="700">Tarjeta Inteligente NFC + QR</text>
        <text x="304" y="446" fill="${p}" font-family="Courier New, monospace" font-size="8.8" font-weight="700">TAP EN EL TELÉFONO DEL CLIENTE</text>
        <text x="270" y="474" fill="${ink}" opacity="0.88" font-family="Arial, sans-serif" font-size="9.5">• Abre portafolio interactivo y experiencia AR</text>
        <text x="270" y="494" fill="${ink}" opacity="0.88" font-family="Arial, sans-serif" font-size="9.5">• Guarda contacto vCard directo en 1 toque</text>
        <text x="270" y="514" fill="${ink}" opacity="0.88" font-family="Arial, sans-serif" font-size="9.5">• Conecta directo al diagnóstico por WhatsApp</text>
      `;

    case "notary_leunam":
    case "church_senda":
      return `
        <!-- Official Legal / Ministry Folder + Embossed Seal + Envelope -->
        <rect x="22" y="18" width="242" height="345" rx="12" fill="${bg}" stroke="${p}" stroke-width="2.5" filter="url(#shadow)"/>
        <rect x="22" y="18" width="242" height="36" rx="10" fill="${p}"/>
        <text x="143" y="41" text-anchor="middle" fill="#FFF" font-family="Courier New, monospace" font-size="10.5" font-weight="700">${b.heroType === "notary_leunam" ? "EXPEDIENTE OFICIAL · USCIS / IRS" : "BIENVENIDOS A CASA · MINISTERIO"}</text>
        ${placeLogo(logoHref, ar, 143, 142, 175, 130)}
        <line x1="46" y1="230" x2="240" y2="230" stroke="${p}" stroke-width="1.5"/>
        <text x="143" y="256" text-anchor="middle" fill="${fg}" font-family="Georgia, serif" font-size="13" font-weight="700">${esc(b.brandName)}</text>
        <text x="143" y="278" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">${b.heroType === "notary_leunam" ? "CONFIDENTIAL CLIENT FILE" : "CARPETA DE DISCIPULADO Y FE"}</text>
        <!-- Gold Embossed Foil Seal -->
        <circle cx="143" cy="318" r="26" fill="#FFD200" stroke="${p}" stroke-width="2.5" filter="url(#shadow)"/>
        <text x="143" y="316" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="8" font-weight="700">OFFICIAL</text>
        <text x="143" y="328" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="8" font-weight="700">SEAL</text>

        <!-- Official Envelope & Checklist Card on Right -->
        <rect x="282" y="22" width="204" height="340" rx="10" fill="#FFFFFF" stroke="${p}" stroke-width="2" filter="url(#shadow)"/>
        ${placeLogo(logoHref, ar, 384, 86, 135, 78)}
        <text x="384" y="150" text-anchor="middle" fill="#0B1624" font-family="Arial, sans-serif" font-size="11.5" font-weight="700">${b.heroType === "notary_leunam" ? "CHECKLIST DE DOCUMENTOS" : "TARJETA DE CONEXIÓN Y ORACIÓN"}</text>
        <rect x="300" y="166" width="168" height="128" rx="6" fill="#F1F5F9" stroke="${p}"/>
        <text x="312" y="190" fill="#0B1624" font-family="Courier New, monospace" font-size="9.5" font-weight="700">[✓] ${esc(b.services[0].slice(0,22))}</text>
        <text x="312" y="216" fill="#0B1624" font-family="Courier New, monospace" font-size="9.5" font-weight="700">[✓] ${esc(b.services[1].slice(0,22))}</text>
        <text x="312" y="242" fill="#0B1624" font-family="Courier New, monospace" font-size="9.5" font-weight="700">[✓] ${esc(b.services[2].slice(0,22))}</text>
        <text x="312" y="272" fill="${p}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">TEL: ${esc(b.phone)}</text>
        <rect x="300" y="308" width="168" height="34" rx="6" fill="${p}"/>
        <text x="384" y="329" text-anchor="middle" fill="#FFF" font-family="Courier New, monospace" font-size="10" font-weight="700">${b.heroType === "notary_leunam" ? "NOTARÍA CERTIFICADA" : "DOMINGOS 10:30 AM"}</text>

        <!-- Envelope #10 Below -->
        <rect x="22" y="384" width="464" height="172" rx="10" fill="#FFFFFF" stroke="${p}" stroke-width="2" filter="url(#shadow)"/>
        <rect x="22" y="384" width="464" height="14" fill="${p}"/>
        ${placeLogo(logoHref, ar, 96, 456, 115, 78)}
        <text x="175" y="438" fill="#0B1624" font-family="Arial, sans-serif" font-size="14" font-weight="700">SOBRE MEMBRETADO OFICIAL #10</text>
        <text x="175" y="460" fill="${p}" font-family="Courier New, monospace" font-size="10.5" font-weight="700">${esc(b.address)} · ${esc(b.phone)}</text>
        <rect x="175" y="480" width="280" height="54" rx="6" fill="#F8FAFC" stroke="#CBD5E1"/>
        <text x="190" y="502" fill="#334155" font-family="Courier New, monospace" font-size="10">DESTINATARIO / EXPEDIENTE REGISTRADO</text>
        <text x="190" y="520" fill="#64748B" font-family="Courier New, monospace" font-size="9.5">LOUISVILLE, KY · CONFIDENCIAL</text>
      `;

    case "cuban_bakery":
    case "tacos":
    case "restaurant_taino":
    case "icecream_mendaito":
      return `
        <!-- Food & Hospitality Packaging Box / Basket Liner + Cup / Bottles / Menu -->
        <rect x="22" y="18" width="258" height="338" rx="14" fill="${bg}" stroke="${p}" stroke-width="3" filter="url(#shadow)"/>
        <!-- Decorative Top Checker / Stripe Border -->
        <rect x="22" y="18" width="258" height="30" rx="10" fill="${p}"/>
        <text x="151" y="38" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="10.5" font-weight="700" letter-spacing="1.5">EMPAQUE GASTRONÓMICO DE AUTOR</text>
        ${placeLogo(logoHref, ar, 151, 152, 195, 145)}
        <rect x="44" y="248" width="214" height="44" rx="8" fill="${s}"/>
        <text x="151" y="268" text-anchor="middle" fill="#FFF" font-family="Arial, sans-serif" font-size="12" font-weight="700">${esc(b.brandName)}</text>
        <text x="151" y="284" text-anchor="middle" fill="#FFF" opacity="0.9" font-family="Courier New, monospace" font-size="9">SABOR 100% AUTÉNTICO Y FRESCO</text>
        <text x="151" y="330" text-anchor="middle" fill="${fg}" font-family="Courier New, monospace" font-size="10" font-weight="700">PEDIDOS: ${esc(b.phone)}</text>

        <!-- Custom Beverage Cup / Salsa Bottle / Cocktail Menu on Right -->
        <g transform="translate(302, 22)">
          <!-- Cup / Bottle Lid -->
          <rect x="22" y="10" width="142" height="22" rx="8" fill="${p}"/>
          <polygon points="30,32 156,32 142,265 44,265" fill="${bg}" stroke="${p}" stroke-width="2.5" filter="url(#shadow)"/>
          <rect x="35" y="88" width="116" height="105" fill="${p}" opacity="0.14"/>
          ${placeLogo(logoHref, ar, 93, 140, 102, 82)}
          <text x="93" y="232" text-anchor="middle" fill="${fg}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">16 OZ / TO-GO CUP</text>
          <!-- Round Coaster / Seal Below Cup -->
          <circle cx="93" cy="308" r="34" fill="${p}" stroke="#FFF" stroke-width="2" filter="url(#shadow)"/>
          <text x="93" y="305" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="8.5" font-weight="700">SELLO DE</text>
          <text x="93" y="317" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="8.5" font-weight="700">FRESCURA</text>
        </g>

        <!-- Menu Board & Delivery Bag Seal Strip Below -->
        <rect x="22" y="378" width="464" height="178" rx="12" fill="${surf}" stroke="${p}" stroke-width="2"/>
        <text x="40" y="408" fill="${p}" font-family="Courier New, monospace" font-size="10.5" font-weight="700">MENÚ DE MESA, ETIQUETAS DELIVERY Y EMPAQUE TÉRMICO</text>
        <text x="40" y="434" fill="${ink}" font-family="Arial, sans-serif" font-size="11.5" font-weight="700">${esc(b.tagline)}</text>
        <text x="42" y="464" fill="${ink}" opacity="0.88" font-family="Arial, sans-serif" font-size="10.5">• Papel encerado antigrasa impreso con patrón repetitivo del logotipo.</text>
        <text x="42" y="484" fill="${ink}" opacity="0.88" font-family="Arial, sans-serif" font-size="10.5">• Sello adhesivo de seguridad "Recién hecho para ti" para bolsas de entrega.</text>
        <text x="42" y="504" fill="${ink}" opacity="0.88" font-family="Arial, sans-serif" font-size="10.5">• Menú QR plastificado de mesa y tarjeta de cliente frecuente (10 sellos).</text>
        <rect x="42" y="518" width="230" height="26" rx="5" fill="${p}"/>
        <text x="157" y="535" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">ORDENA HOY: ${esc(b.phone)}</text>
      `;

    case "lashes_me":
    case "party_mm":
      return `
        <!-- Beauty Lash Tray / Luxury Event Styling Proposal Box + Ribbon Hangtag -->
        <rect x="22" y="20" width="252" height="338" rx="14" fill="${bg}" stroke="${p}" stroke-width="2.5" filter="url(#shadow)"/>
        <rect x="36" y="34" width="224" height="310" rx="10" fill="none" stroke="${p}" stroke-width="1.2" stroke-dasharray="5 3"/>
        ${placeLogo(logoHref, ar, 148, 128, 175, 115)}
        <rect x="48" y="210" width="200" height="32" rx="6" fill="#121214"/>
        <text x="148" y="230" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="10" font-weight="700">${b.heroType === "lashes_me" ? "CASHMERE LASH TRAY · 0.05 D-CURL" : "PROPUESTA DE DISEÑO DE EVENTO"}</text>
        <!-- Lash rows or Color Balloon Swatches -->
        ${[0,1,2].map(i => `<rect x="54" y="${254 + i*24}" width="188" height="16" rx="4" fill="${p}" opacity="${0.85 - i*0.2}"/>`).join("")}
        <text x="148" y="338" text-anchor="middle" fill="#121214" font-family="Courier New, monospace" font-size="9.5" font-weight="700">${esc(b.web)}</text>

        <!-- Foam Cleanser Bottle / Gift Hangtag on Right -->
        <g transform="translate(298, 22)">
          <rect x="20" y="14" width="150" height="330" rx="16" fill="#FFFFFF" stroke="${p}" stroke-width="2.5" filter="url(#shadow)"/>
          <circle cx="95" cy="40" r="9" fill="${bg}" stroke="${p}" stroke-width="2"/>
          ${placeLogo(logoHref, ar, 95, 118, 122, 82)}
          <line x1="38" y1="175" x2="152" y2="175" stroke="${p}"/>
          <text x="95" y="202" text-anchor="middle" fill="#121214" font-family="Georgia, serif" font-size="13" font-weight="700">${b.heroType === "lashes_me" ? "Aftercare Instructions" : "Custom Event Tag"}</text>
          <text x="95" y="226" text-anchor="middle" fill="#555" font-family="Arial, sans-serif" font-size="9.5">• ${esc(b.services[0].slice(0,22))}</text>
          <text x="95" y="246" text-anchor="middle" fill="#555" font-family="Arial, sans-serif" font-size="9.5">• ${esc(b.services[1].slice(0,22))}</text>
          <rect x="36" y="274" width="118" height="48" rx="8" fill="${p}"/>
          <text x="95" y="296" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="9.5" font-weight="700">BOOK APPOINTMENT</text>
          <text x="95" y="312" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="9">${esc(b.phone)}</text>
        </g>

        <!-- Loyalty & Appointment Card Below -->
        <rect x="22" y="380" width="464" height="176" rx="12" fill="${surf}" stroke="${p}" stroke-width="2"/>
        <text x="42" y="412" fill="${p}" font-family="Courier New, monospace" font-size="11" font-weight="700">TARJETA DE CITAS VIP, CUIDADOS Y FIDELIDAD</text>
        <text x="42" y="440" fill="${ink}" font-family="Georgia, serif" font-size="16" font-weight="700">${esc(b.brandName)} · Experience</text>
        <!-- 5 VIP Loyalty Circles -->
        ${[1,2,3,4,5].map(n => `<g transform="translate(${42 + (n-1)*72}, 460)">
          <circle cx="26" cy="26" r="24" fill="${n<=3 ? p : bg}" stroke="${p}" stroke-width="2"/>
          <text x="26" y="30" text-anchor="middle" fill="${n<=3 ? '#111' : fg}" font-family="Courier New, monospace" font-size="10" font-weight="700">${n<=3 ? 'VIP ✓' : '0'+n}</text>
        </g>`).join("")}
        <text x="42" y="538" fill="${ink}" opacity="0.85" font-family="Courier New, monospace" font-size="10">5TA CITA O MONTAJE CON BENEFICIO EXCLUSIVO VIP · ${esc(b.phone)}</text>
      `;

    case "dealer_kingdom":
    case "bikeshop_ubc":
    case "cycling_ridecrank":
      return `
        <!-- Showroom License Plate / Bike Tune-Up Tag + Key Fob / Water Bottle -->
        <rect x="22" y="22" width="275" height="168" rx="12" fill="${bg}" stroke="${p}" stroke-width="3.5" filter="url(#shadow)"/>
        <circle cx="44" cy="42" r="6" fill="#334155"/><circle cx="275" cy="42" r="6" fill="#334155"/>
        <circle cx="44" cy="170" r="6" fill="#334155"/><circle cx="275" cy="170" r="6" fill="#334155"/>
        ${placeLogo(logoHref, ar, 160, 96, 215, 110)}
        <rect x="52" y="156" width="216" height="24" rx="4" fill="${p}"/>
        <text x="160" y="172" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="10" font-weight="700">${esc(b.brandName)}</text>

        <!-- Service Checklist / Spec Hangtag on Right -->
        <rect x="315" y="22" width="170" height="335" rx="12" fill="${surf}" stroke="${p}" stroke-width="2.5" filter="url(#shadow)"/>
        <circle cx="400" cy="46" r="10" fill="#111" stroke="${p}" stroke-width="2.5"/>
        <rect x="330" y="68" width="140" height="86" rx="8" fill="${bg}"/>
        ${placeLogo(logoHref, ar, 400, 111, 120, 72)}
        <text x="400" y="178" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="10" font-weight="700">CERTIFIED INSPECTION</text>
        <text x="330" y="204" fill="#FFF" font-family="Courier New, monospace" font-size="9.5">[✓] ${esc(b.services[0].slice(0,18))}</text>
        <text x="330" y="226" fill="#FFF" font-family="Courier New, monospace" font-size="9.5">[✓] ${esc(b.services[1].slice(0,18))}</text>
        <text x="330" y="248" fill="#FFF" font-family="Courier New, monospace" font-size="9.5">[✓] ${esc(b.services[2].slice(0,18))}</text>
        <rect x="330" y="276" width="140" height="60" rx="8" fill="${p}"/>
        <text x="400" y="302" text-anchor="middle" fill="#111" font-family="Arial, sans-serif" font-size="13" font-weight="700">READY TO RIDE</text>
        <text x="400" y="322" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="9.5" font-weight="700">${esc(b.phone)}</text>

        <!-- Buyer Folder / Custom Decal & Keychain Box Below Left -->
        <rect x="22" y="208" width="275" height="348" rx="12" fill="${surf}" stroke="${p}" stroke-width="2"/>
        <text x="160" y="238" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="10.5" font-weight="700">KIT DE ENTREGA AL CLIENTE</text>
        <rect x="42" y="254" width="235" height="145" rx="8" fill="${bg}"/>
        ${placeLogo(logoHref, ar, 160, 326, 175, 115)}
        <text x="42" y="428" fill="#FFF" font-family="Arial, sans-serif" font-size="11.5" font-weight="700">• Carpeta de Garantía y Mantenimiento</text>
        <text x="42" y="452" fill="#FFF" font-family="Arial, sans-serif" font-size="11.5" font-weight="700">• Llavero / Sticker Metálico Troquelado</text>
        <text x="42" y="476" fill="#FFF" font-family="Arial, sans-serif" font-size="11.5" font-weight="700">• Etiqueta Colgante de Especificaciones</text>
        <rect x="42" y="502" width="235" height="34" rx="6" fill="${p}"/>
        <text x="160" y="523" text-anchor="middle" fill="#111" font-family="Courier New, monospace" font-size="10.5" font-weight="700">${esc(b.web)}</text>
      `;

    case "mattress_venega":
    default:
      return `
        <!-- Mattress Corner Sash / Streetwear Hangtag & Woven Label Showcase -->
        <rect x="22" y="20" width="255" height="338" rx="14" fill="${bg}" stroke="${p}" stroke-width="3" filter="url(#shadow)"/>
        <rect x="22" y="20" width="255" height="36" rx="10" fill="${p}"/>
        <text x="149" y="43" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="10.5" font-weight="700" letter-spacing="1.5">${b.heroType === "mattress_venega" ? "BANDA ESQUINERA DE COLCHÓN" : "HEAVYWEIGHT HANGTAG &amp; NECK LABEL"}</text>
        ${placeLogo(logoHref, ar, 149, 148, 200, 130)}
        <rect x="44" y="238" width="210" height="54" rx="8" fill="${surf}"/>
        <text x="149" y="262" text-anchor="middle" fill="#FFF" font-family="Arial, sans-serif" font-size="12" font-weight="700">${esc(b.tagline.slice(0, 32))}</text>
        <text x="149" y="280" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="9.5" font-weight="700">${b.heroType === "mattress_venega" ? "10-YEAR ORTHOPEDIC WARRANTY" : "LIMITED DROP · 100% HEAVY COTTON"}</text>
        <text x="149" y="330" text-anchor="middle" fill="${fg}" font-family="Courier New, monospace" font-size="10" font-weight="700">${esc(b.web)}</text>

        <!-- Woven Label / Law Tag & Spec Card on Right -->
        <rect x="296" y="20" width="190" height="338" rx="12" fill="${surf}" stroke="${p}" stroke-width="2.2" filter="url(#shadow)"/>
        <circle cx="391" cy="44" r="9" fill="${bg}" stroke="${p}" stroke-width="2"/>
        <text x="391" y="76" text-anchor="middle" fill="${p}" font-family="Courier New, monospace" font-size="10" font-weight="700">${b.heroType === "mattress_venega" ? "SELECTOR DE FIRMEZA" : "ETIQUETA TEJIDA DE CUELLO"}</text>
        <rect x="316" y="92" width="150" height="92" rx="8" fill="${bg}" stroke="${p}" stroke-width="1.5"/>
        ${placeLogo(logoHref, ar, 391, 138, 128, 72)}
        <text x="316" y="214" fill="#FFF" font-family="Courier New, monospace" font-size="9.5" font-weight="700">• ${esc(b.services[0].slice(0,20))}</text>
        <text x="316" y="238" fill="#FFF" font-family="Courier New, monospace" font-size="9.5" font-weight="700">• ${esc(b.services[1].slice(0,20))}</text>
        <text x="316" y="262" fill="#FFF" font-family="Courier New, monospace" font-size="9.5" font-weight="700">• ${esc(b.services[2].slice(0,20))}</text>
        <rect x="316" y="290" width="150" height="44" rx="6" fill="${p}"/>
        <text x="391" y="310" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="10" font-weight="700">GARANTÍA OFICIAL</text>
        <text x="391" y="325" text-anchor="middle" fill="${isLightHex(p) ? '#111' : '#FFF'}" font-family="Courier New, monospace" font-size="9">${esc(b.phone)}</text>

        <!-- Frosted Zip Bag / Mattress Protector Packaging Below -->
        <rect x="22" y="380" width="464" height="176" rx="12" fill="${surf}" stroke="${p}" stroke-width="2"/>
        <text x="42" y="412" fill="${p}" font-family="Courier New, monospace" font-size="11" font-weight="700">${b.heroType === "mattress_venega" ? "EMPAQUE DE ALMOHADAS MEMORY FOAM Y CERTIFICADO" : "BOLSA FROSTED ZIPLOCK + STICKER PACK DE COLECCIÓN"}</text>
        <text x="42" y="442" fill="#FFF" font-family="Arial, sans-serif" font-size="15" font-weight="700">${esc(b.brandName)} · Presentación de Marca</text>
        <text x="42" y="470" fill="#D4D7DC" font-family="Arial, sans-serif" font-size="10.5">• Etiquetas textiles cosidas en alta definición con instrucciones de cuidado.</text>
        <text x="42" y="492" fill="#D4D7DC" font-family="Arial, sans-serif" font-size="10.5">• Empaque protector impreso con sello de autenticidad y código QR.</text>
        <text x="42" y="514" fill="#D4D7DC" font-family="Arial, sans-serif" font-size="10.5">• Tarjeta de agradecimiento y garantía directa con el cliente.</text>
      `;
  }
}


