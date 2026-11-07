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

// ---------- index.html ----------
let html = fs.readFileSync(path.join(HERE, 'index.template.html'), 'utf8');
html = html
  .replaceAll('__L_PATH__', glyphs.L.d)
  .replaceAll('__DL_PATH__', glyphs.DL.d)
  .replaceAll('__WA_ICON__', WA_ICON)
  .replaceAll('__WA_HREF__', waHref.replaceAll('&', '&amp;'))
  .replaceAll('__IG_BUTTON__', igButton)
  .replaceAll('__LD_EXTRA__', ldExtra);
if (/__[A-Z_]+__/.test(html)) throw new Error('Unreplaced token in index: ' + html.match(/__[A-Z_]+__/)[0]);
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.writeFileSync(path.resolve(OUT, '..', 'index.html'), html);

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
