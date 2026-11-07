// Generates the /hola networking card (HTML, QR, vCard, icons, OG image) from config.json.
// Usage: cd scripts/hola-card && npm install && node build.mjs
// Edit config.json (phone, WhatsApp text, Instagram, email) and the *.template.html files, then rebuild.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import QRCode from 'qrcode';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'config.json'), 'utf8'));
const OUT = path.resolve(HERE, cfg.outDir);
const glyphs = JSON.parse(fs.readFileSync(path.join(HERE, 'glyphs.json'), 'utf8')).glyphs;
const iconPath = (n) => fs.readFileSync(path.join(HERE, `${n}.svg`), 'utf8').match(/ d="([^"]+)"/)[1];
const WA_ICON = iconPath('whatsapp');
const IG_ICON = iconPath('instagram');
const INK = '#0e0a14', LETRA = '#ffcc29', PURPLE = '#6a4888', PAPER = '#f3eee3';

fs.mkdirSync(path.join(OUT, 'qr'), { recursive: true });

// ---------- links ----------
const waHref = `https://wa.me/${cfg.whatsapp.number}?text=${encodeURIComponent(cfg.whatsapp.text)}`;
const igUrl = cfg.instagram ? `https://www.instagram.com/${cfg.instagram}/` : null;
const igButton = igUrl ? `<a class="btn btn-line" href="${igUrl}" target="_blank" rel="noopener" lang="en" data-track="ig-contact">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${IG_ICON}"/></svg>
          Follow us on Instagram
        </a>` : '';
const sameAs = [igUrl].filter(Boolean);
const ldExtra = sameAs.length ? `,\n  "sameAs": ${JSON.stringify(sameAs)}` : '';

// ---------- multi-page html generation (Home + 5 dedicated chapter pages) ----------
let rawTpl = fs.readFileSync(path.join(HERE, 'index.template.html'), 'utf8')
  .replaceAll('__L_PATH__', glyphs.L.d)
  .replaceAll('__DL_PATH__', glyphs.DL.d)
  .replaceAll('__WA_ICON__', WA_ICON)
  .replaceAll('__WA_HREF__', waHref.replaceAll('&', '&amp;'))
  .replaceAll('__IG_BUTTON__', igButton)
  .replaceAll('__LD_EXTRA__', ldExtra);

function getBlock(src, name) {
  const re = new RegExp(`<!-- \\[\\[${name}_START\\]\\] -->([\\s\\S]*?)<!-- \\[\\[${name}_END\\]\\] -->`);
  const m = src.match(re);
  if (!m) throw new Error(`Missing block ${name} in index.template.html`);
  return m[1].trim();
}

const headAndStyle = rawTpl.split('<!-- [[HERO_START]] -->')[0];
const tailAndScripts = rawTpl.split('<!-- [[CONTACTO_END]] -->')[1];
const tailNoTsJs = tailAndScripts.replace(/\/\* \[\[TS_JS_START\]\] \*\/[\s\S]*?\/\* \[\[TS_JS_END\]\] \*\//, '');

const B_HERO = getBlock(rawTpl, 'HERO');
const B_TU_SOFTWARE = getBlock(rawTpl, 'TU_SOFTWARE');
const B_MARCAS = getBlock(rawTpl, 'MARCAS');
const B_SERVICIOS = getBlock(rawTpl, 'SERVICIOS');
const B_CAP_DISENO = getBlock(rawTpl, 'CAP_DISENO');
const B_CAP_CODIGO = getBlock(rawTpl, 'CAP_CODIGO');
const B_CAP_PLANOS = getBlock(rawTpl, 'CAP_PLANOS');
const B_CAP_SOFTWARE = getBlock(rawTpl, 'CAP_SOFTWARE');
const B_CAP_VIDEOS = getBlock(rawTpl, 'CAP_VIDEOS');
const B_BAND_ALT = getBlock(rawTpl, 'BAND_ALT');
const B_FUNDADOR = getBlock(rawTpl, 'FUNDADOR');
const B_CONTACTO = getBlock(rawTpl, 'CONTACTO');

function finalizeHtml(doc, contactNum) {
  const out = doc.replaceAll('__CONTACT_NUM__', contactNum);
  if (/__[A-Z_]+__/.test(out)) throw new Error('Unreplaced token in html: ' + out.match(/__[A-Z_]+__/)[0]);
  return out;
}

// 1. Home page (public/index.html + public/hola/index.html)
const homeHtml = finalizeHtml(
  `${headAndStyle}${B_HERO}\n\n${B_MARCAS}\n\n<main>\n  ${B_SERVICIOS}\n\n  ${B_BAND_ALT}\n\n  ${B_FUNDADOR}\n\n  ${B_CONTACTO}${tailNoTsJs}`,
  '03'
);
fs.writeFileSync(path.join(OUT, 'index.html'), homeHtml);
fs.writeFileSync(path.resolve(OUT, '..', 'index.html'), homeHtml);

// 2. Five Dedicated Chapter Pages (/branding, /web, /planos, /software, /videos)
const CHAPTER_PAGES = [
  {
    slug: 'branding',
    title: 'Branding & Dirección de Arte · Capítulo 01 — Dame la Letra',
    desc: 'Identidad visual, construcción de marca desde cero, universo gráfico, empaque y 32 Mini Branding Sets fotorrealistas en Louisville, KY. Casos: Ely’s Charcuterie, New Era Real Estate, La Bonita Jewelry y archivo de 32 sistemas.',
    jumps: '<div class="sub-jumps"><b>En este capítulo:</b> <a href="#p-elys">01 · Ely’s Charcuterie</a> <a href="#p-newera">02 · New Era Real Estate</a> <a href="#p-labonita">03 · La Bonita Jewelry</a> <a href="#mini-branding-sets">04 · 32 Mini Branding Sets</a></div>',
    body: B_CAP_DISENO,
    contactNum: '02',
    nextHref: '/web',
    nextTitle: '02 · Web, E-commerce &amp; Código',
    nextShort: 'Capítulo 02 · Web',
    includeTsJs: false,
  },
  {
    slug: 'web',
    title: 'Desarrollo Web, E-commerce & Código · Capítulo 02 — Dame la Letra',
    desc: 'Sitios web interactivos, tiendas online a medida, experiencias 3D de producto y plataformas digitales de alto rendimiento. Casos: Lucky Shaker, DPhotography Studios, Tri-Lion Academy y Prime Stone Builders.',
    jumps: '<div class="sub-jumps"><b>En este capítulo:</b> <a href="#p-lucky">01 · Lucky Shaker</a> <a href="#p-dp">02 · DPhotography Studios</a> <a href="#p-trilion">03 · Tri-Lion Academy</a> <a href="#p-primestone">04 · Prime Stone Builders</a></div>',
    body: B_CAP_CODIGO,
    contactNum: '03',
    nextHref: '/planos',
    nextTitle: '03 · Planos &amp; Arquitectura 3D',
    nextShort: 'Capítulo 03 · Planos 3D',
    includeTsJs: false,
  },
  {
    slug: 'planos',
    title: 'Planos Técnicos & Arquitectura 3D · Capítulo 03 — Dame la Letra',
    desc: 'Láminas arquitectónicas, ingeniería MEP/HVAC, detalles estructurales bajo código IRC y modelos 3D interactivos con Realidad Aumentada.',
    jumps: '<div class="sub-jumps"><b>En este capítulo:</b> <a href="#visor-3d">Visor 3D en Vivo (4 Modelos + AR)</a> <a href="#pliegos">20 Pliegos Técnicos (Ciudad · Residencial · IRC · MEP)</a></div>',
    body: B_CAP_PLANOS,
    contactNum: '04',
    nextHref: '/software',
    nextTitle: '04 · Tu Software · ARM &amp; Sistemas',
    nextShort: 'Capítulo 04 · Software',
    includeTsJs: false,
  },
  {
    slug: 'software',
    title: 'Tu Software · ARM a la Medida & Sistemas Propios · Capítulo 04 — Dame la Letra',
    desc: 'Construimos el sistema operativo de tu empresa con tu marca, en tu dominio y bajo tu control ($0 por usuario, sin contratos de permanencia). Explora el simulador interactivo y los 4 sistemas en producción: ZHomes, New Era ARM, My Chief CAD y Tzel.',
    jumps: '<div class="sub-jumps"><b>En este capítulo:</b> <a href="#tu-software">Tu Software · ARM a la Medida (Simulador 6 Industrias)</a> <a href="#cap-software">4 Sistemas en Producción (ZHomes · New Era · My Chief CAD · Tzel)</a></div>',
    body: `${B_TU_SOFTWARE}\n\n  ${B_CAP_SOFTWARE}`,
    contactNum: '05',
    nextHref: '/videos',
    nextTitle: '05 · Realización de Video &amp; Reels',
    nextShort: 'Capítulo 05 · Videos',
    includeTsJs: true,
  },
  {
    slug: 'videos',
    title: 'Realización de Video & Reels · Capítulo 05 — Dame la Letra',
    desc: 'Producción de art films en 3D, piezas verticales con sonido, animación editorial tipo collage y dirección en estudio pensada para detener el scroll.',
    jumps: '<div class="sub-jumps"><b>En este capítulo:</b> <a href="#realizacion-video">01 · Luxury Jewelry Art Film</a> <a href="#realizacion-video">02 · Top Agents Collage</a> <a href="#realizacion-video">03 · Top Sellers Cinético</a> <a href="#realizacion-video">04 · Sesión Editorial</a></div>',
    body: B_CAP_VIDEOS,
    contactNum: '06',
    nextHref: '/branding',
    nextTitle: '01 · Branding &amp; Dirección de Arte',
    nextShort: 'Capítulo 01 · Branding',
    includeTsJs: false,
  },
];

function buildSubHeader(slug, jumpsHtml) {
  const navItem = (s, num, label) =>
    `<a class="hchap${slug === s ? ' is-current' : ''}" href="/${s}"${slug === s ? ' aria-current="page"' : ''}><span>${num} /</span> ${label}</a>`;
  return `<header class="sub-hdr" id="inicio">
  <svg class="sub-glyph" viewBox="0 269 630 711" aria-hidden="true" focusable="false"><path d="${glyphs.L.d}"/></svg>
  <div class="top">
    <div class="sub-brand-row">
      <a class="sub-back" href="/"><span aria-hidden="true">←</span> Volver a Inicio</a>
      <a class="brand" href="/"><img src="/hola/img/dame-la-letra-logo.png" width="1102" height="161" alt="Dame la Letra"></a>
    </div>
    <div class="top-right">
      <button class="ar-pill" type="button" data-toggle-ar aria-label="Ver en tu espacio en Realidad Aumentada"><i>✦</i> Ver en tu espacio (AR)</button>
      <p class="top-meta"><span class="dot" aria-hidden="true"></span>Louisville, KY</p>
    </div>
  </div>
  <nav class="sub-chapters" aria-label="Capítulos del portafolio">
    <a class="hchap" href="/"><span>00 /</span> Inicio</a>
    ${navItem('branding', '01', 'Branding')}
    ${navItem('web', '02', 'Web &amp; Código')}
    ${navItem('planos', '03', 'Planos 3D')}
    ${navItem('software', '04', 'Tu Software · ARM')}
    ${navItem('videos', '05', 'Videos &amp; Reels')}
  </nav>
  ${jumpsHtml}
</header>`;
}

function buildChapterPager(p) {
  return `<section class="chap-pager" aria-label="Navegación entre capítulos">
    <div class="chap-pager-in">
      <div>
        <p class="chap-pager-meta">Explorar más disciplinas de Dame la Letra</p>
        <h3 class="chap-pager-title">Siguiente capítulo: <em>${p.nextTitle}</em></h3>
      </div>
      <div class="chap-pager-btns">
        <a class="btn btn-ghost" href="/">← Volver a Inicio</a>
        <a class="btn btn-primary" href="${p.nextHref}">
          Ir a ${p.nextShort}
          <svg class="arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 5.3 19.9 12l-6.7 6.7-1.4-1.4 4.3-4.3H4v-2h12.1l-4.3-4.3z"/></svg>
        </a>
      </div>
    </div>
  </section>`;
}

const PUBLIC_ROOT = path.resolve(OUT, '..');
for (const p of CHAPTER_PAGES) {
  const customHead = headAndStyle
    .replace('<title>Dame la Letra — Estudio creativo independiente · Miguel Sosa</title>', `<title>${p.title}</title>`)
    .replace('<meta name="description" content="No hacemos más de lo mismo. Dame la Letra es un estudio creativo independiente en Louisville, KY: estrategia, branding, realización de video, web, software y arquitectura 3D. Fundado por Miguel Sosa.">', `<meta name="description" content="${p.desc}">`)
    .replace('<link rel="canonical" href="https://www.damelaletra.com">', `<link rel="canonical" href="https://www.damelaletra.com/${p.slug}">`)
    .replace('<meta property="og:url" content="https://www.damelaletra.com">', `<meta property="og:url" content="https://www.damelaletra.com/${p.slug}">`)
    .replace('<meta property="og:title" content="Dame la Letra — No hacemos más de lo mismo.">', `<meta property="og:title" content="${p.title}">`)
    .replace('<meta property="og:description" content="Estudio creativo independiente. Diseño, video, desarrollo web, software y planos 3D. Fundado por Miguel Sosa.">', `<meta property="og:description" content="${p.desc}">`);

  const subHeader = buildSubHeader(p.slug, p.jumps);
  const pager = buildChapterPager(p);
  const pageTail = p.includeTsJs ? tailAndScripts : tailNoTsJs;
  const pageHtml = finalizeHtml(
    `${customHead}${subHeader}\n\n<main>\n  ${p.body}\n\n  ${pager}\n\n  ${B_BAND_ALT}\n\n  ${B_CONTACTO}${pageTail}`,
    p.contactNum
  );

  const pubDir = path.join(PUBLIC_ROOT, p.slug);
  const holaDir = path.join(OUT, p.slug);
  fs.mkdirSync(pubDir, { recursive: true });
  fs.mkdirSync(holaDir, { recursive: true });
  fs.writeFileSync(path.join(pubDir, 'index.html'), pageHtml);
  fs.writeFileSync(path.join(holaDir, 'index.html'), pageHtml);
}

// ---------- QR ----------
const qrOpts = { errorCorrectionLevel: 'M', margin: 4, color: { dark: '#000000', light: '#ffffff' } };
let qrSvg = await QRCode.toString(cfg.url, { ...qrOpts, type: 'svg' });
qrSvg = qrSvg.replace('<?xml version="1.0" encoding="utf-8"?>', '').trim();
await QRCode.toFile(path.join(OUT, 'qr', 'dame-la-letra-qr.png'), cfg.url, { ...qrOpts, width: 1200 });
fs.writeFileSync(path.join(OUT, 'qr', 'dame-la-letra-qr.svg'), qrSvg.replace('<svg ', '<svg width="300" height="300" '));

const arUrl = `${cfg.url}/?ar=1`;
let qrArSvg = await QRCode.toString(arUrl, { ...qrOpts, type: 'svg' });
qrArSvg = qrArSvg.replace('<?xml version="1.0" encoding="utf-8"?>', '').trim();
await QRCode.toFile(path.join(OUT, 'qr', 'dame-la-letra-qr-ar.png'), arUrl, { ...qrOpts, width: 1200 });
fs.writeFileSync(path.join(OUT, 'qr', 'dame-la-letra-qr-ar.svg'), qrArSvg.replace('<svg ', '<svg width="300" height="300" '));

let qrHtml = fs.readFileSync(path.join(HERE, 'qr.template.html'), 'utf8')
  .replace('__QR_SVG__', qrSvg.replace('<svg ', '<svg id="qr-std" aria-hidden="true" focusable="false" '))
  .replace('__QR_AR_SVG__', qrArSvg.replace('<svg ', '<svg id="qr-ar" hidden aria-hidden="true" focusable="false" '));
fs.writeFileSync(path.join(OUT, 'qr', 'index.html'), qrHtml);

// ---------- icons (DL monogram from the brand blackletter) ----------
const [bx0, by0, bx1, by1] = glyphs.DL.bounds;
const gw = bx1 - bx0, gh = by1 - by0;
function monogramSvg(size, pad = 0.16, radius = 0) {
  const inner = size * (1 - pad * 2);
  const s = inner / gw;
  const tx = (size - gw * s) / 2, ty = (size - gh * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${INK}"/><g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)}) translate(${-bx0} ${-by0})" fill="${LETRA}"><path d="${glyphs.DL.d}"/></g></svg>`;
}
fs.writeFileSync(path.join(OUT, 'favicon.svg'), monogramSvg(64, 0.1, 10));
await sharp(Buffer.from(monogramSvg(512, 0.1, 64))).resize(32, 32).png().toFile(path.join(OUT, 'favicon-32.png'));
await sharp(Buffer.from(monogramSvg(512, 0.16))).resize(180, 180).png().toFile(path.join(OUT, 'apple-touch-icon.png'));
await sharp(Buffer.from(monogramSvg(512, 0.16))).resize(192, 192).png().toFile(path.join(OUT, 'icon-192.png'));
await sharp(Buffer.from(monogramSvg(512, 0.16))).png().toFile(path.join(OUT, 'icon-512.png'));
fs.writeFileSync(path.join(OUT, 'site.webmanifest'), JSON.stringify({
  name: 'Dame la Letra', short_name: 'Dame la Letra', start_url: '/', scope: '/', display: 'standalone',
  background_color: INK, theme_color: INK,
  icons: [{ src: '/hola/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/hola/icon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 2));

// ---------- vCard 3.0 (iOS + Android) ----------
const esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
const fold = (line) => { // RFC 2426: fold at 75 octets
  const out = []; let s = line;
  while (Buffer.byteLength(s) > 75) { let n = 75; while (Buffer.byteLength(s.slice(0, n)) > 75) n--; out.push(s.slice(0, n)); s = ' ' + s.slice(n); }
  out.push(s); return out.join('\r\n');
};
const photo = (await sharp(Buffer.from(monogramSvg(512, 0.2))).resize(256, 256).jpeg({ quality: 82 }).toBuffer()).toString('base64');
const v = cfg.vcard;
const lines = [
  'BEGIN:VCARD', 'VERSION:3.0',
  `N:${esc(v.lastName)};${esc(v.firstName)};;;`,
  `FN:${esc(v.firstName + ' ' + v.lastName)}`,
  `ORG:${esc(v.org)}`,
  v.title && `TITLE:${esc(v.title)}`,
  v.phone && `TEL;TYPE=CELL,VOICE:${v.phone}`,
  v.email && `EMAIL;TYPE=INTERNET,WORK:${v.email}`,
  `URL:${cfg.url}`,
  igUrl && `X-SOCIALPROFILE;TYPE=instagram:${igUrl}`,
  igUrl && `item1.URL:${igUrl}`, igUrl && 'item1.X-ABLabel:Instagram',
  v.city && `ADR;TYPE=WORK:;;;${esc(v.city)};${esc(v.region)};;${esc(v.country)}`,
  v.note && `NOTE:${esc(v.note)}`,
  `PHOTO;ENCODING=b;TYPE=JPEG:${photo}`,
  'END:VCARD',
].filter(Boolean).map(fold);
fs.writeFileSync(path.join(OUT, cfg.vcardFile), lines.join('\r\n') + '\r\n');

// ---------- OG image ----------
const fontsDir = path.join(OUT, 'fonts').replace(/\\/g, '/');
const logoB64 = fs.readFileSync(path.join(OUT, 'img', 'dame-la-letra-logo.png')).toString('base64');
const ogHtml = `<!doctype html><html><head><style>
@font-face{font-family:Anton;src:url(data:font/woff2;base64,${fs.readFileSync(fontsDir + "/anton.woff2").toString("base64")})}
@font-face{font-family:CP;src:url(data:font/woff2;base64,${fs.readFileSync(fontsDir + "/courierprime-400.woff2").toString("base64")})}
html,body{margin:0;width:1200px;height:630px;background:${INK};overflow:hidden}
.g{position:absolute;right:-60px;top:-30px;height:720px;fill:${PURPLE};transform:rotate(-4deg)}
.logo{position:absolute;left:64px;top:56px;height:38px}
h1{position:absolute;left:60px;top:150px;margin:0;font:400 128px/.95 Anton;color:${PAPER};text-transform:uppercase}
.s{position:relative;display:inline-block}.s:after{content:"";position:absolute;left:-4px;right:-6px;top:46%;height:15px;background:#8459ab;transform:rotate(-3deg)}
.u{position:absolute;left:64px;bottom:50px;font:400 26px CP;color:${LETRA};letter-spacing:.04em}
.t{position:absolute;right:64px;bottom:50px;font:400 20px CP;color:${PAPER};letter-spacing:.12em;text-transform:uppercase}
</style></head><body>
<svg class="g" viewBox="0 269 630 711"><path d="${glyphs.L.d}"/></svg>
<img class="logo" src="data:image/png;base64,${logoB64}">
<h1>No hacemos<br>más de<br><span class="s">lo mismo.</span></h1>
<div class="u">damelaletra.com</div><div class="t">Estudio creativo independiente</div>
</body></html>`;
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(ogHtml, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const ogPng = await page.screenshot();
await sharp(ogPng).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, 'og.jpg'));
await browser.close();

console.log('built', { waHref, igUrl, url: cfg.url });
