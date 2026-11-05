import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import sharp from 'sharp';
import { chromium } from 'playwright';

const PUBLIC_DIR = 'C:/TRABAJO/TRABAJO/LA LETRA/Dame la letra/public';
const OUT_3D = path.join(PUBLIC_DIR, 'hola', '3d');
const THREE_DIR = 'C:/TRABAJO/TRABAJO/LA LETRA/Dame la letra/scripts/hola-card/node_modules/three';

fs.mkdirSync(OUT_3D, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2',
};

let builderHtmlContent = '';
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/__builder__.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    return res.end(builderHtmlContent);
  }
  let fp;
  if (u.startsWith('/__three__/')) {
    fp = path.join(THREE_DIR, u.replace('/__three__/', ''));
  } else {
    fp = path.join(PUBLIC_DIR, u);
  }
  if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
  if (!fs.existsSync(fp)) {
    res.writeHead(404);
    return res.end('Not found: ' + u);
  }
  const ext = path.extname(fp).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
  fs.createReadStream(fp).pipe(res);
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address();
const baseUrl = `http://127.0.0.1:${port}`;

const browser = await chromium.launch({ channel: 'chrome' });
try {
  // 1. Capture high-res textures of the actual /hola website sections
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
  await page.goto(`${baseUrl}/hola/index.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('in'));
    document.querySelectorAll('.fab, .ar-pill, .btn-ar, #ar-hud').forEach((el) => (el.style.display = 'none'));
  });
  await page.locator('#visor-3d').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  async function snapElement(selector, width = 720, height = 1120) {
    const buf = await page.locator(selector).screenshot({ type: 'png' });
    const resized = await sharp(buf)
      .resize(width, height, { fit: 'contain', background: { r: 14, g: 10, b: 20, alpha: 1 } })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
    return 'data:image/jpeg;base64,' + resized.toString('base64');
  }

  console.log('Capturing real /hola sections for 3D AR panels...');
  const heroB64 = await snapElement('#inicio', 720, 1152);
  const svcB64 = await snapElement('#servicios', 720, 1080);
  const cap1B64 = await snapElement('#p-elys', 640, 880);
  const cap1bB64 = await snapElement('#p-newera', 640, 880);
  const cap2B64 = await snapElement('#p-lucky', 640, 880);
  const cap3B64 = await snapElement('#visor-3d', 720, 624);
  const cap4B64 = await snapElement('#cap-software', 720, 880);
  const founderB64 = await snapElement('#fundador', 720, 1152);
  const contactB64 = await snapElement('#contacto', 720, 960);

  // 2. Build 3D floating installation in Three.js and export .GLB + .USDZ
  const builderHtml = `<!doctype html><html><head>
  <script type="importmap">
  {
    "imports": {
      "three": "${baseUrl}/__three__/build/three.module.js",
      "three/addons/": "${baseUrl}/__three__/examples/jsm/"
    }
  }
  </script>
  </head><body><script type="module">
  import * as THREE from 'three';
  import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
  import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';

  window.buildModels = async function(textures) {
    const loader = new THREE.TextureLoader();
    const loadTex = (url) => new Promise((res, rej) => loader.load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.flipY = true;
      res(t);
    }, undefined, rej));

    const [tHero, tSvc, tCap1, tCap1b, tCap2, tCap3, tCap4, tFounder, tContact] = await Promise.all([
      loadTex(textures.heroB64),
      loadTex(textures.svcB64),
      loadTex(textures.cap1B64),
      loadTex(textures.cap1bB64),
      loadTex(textures.cap2B64),
      loadTex(textures.cap3B64),
      loadTex(textures.cap4B64),
      loadTex(textures.founderB64),
      loadTex(textures.contactB64),
    ]);

    // Helper to create canvas textures for header/floor
    function makeBannerTex(text, sub) {
      const c = document.createElement('canvas');
      c.width = 1024; c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0e0a14';
      ctx.fillRect(0, 0, 1024, 256);
      ctx.strokeStyle = '#ffcc29';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 1004, 236);
      ctx.fillStyle = '#ffcc29';
      ctx.font = 'bold 74px Impact, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text, 512, 118);
      ctx.fillStyle = '#f3eee3';
      ctx.font = '32px monospace';
      ctx.fillText(sub, 512, 186);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    function makeFloorRingTex() {
      const c = document.createElement('canvas');
      c.width = 512; c.height = 512;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0e0a14';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#ffcc29';
      ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(256, 256, 236, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#6a4888';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(256, 256, 190, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffcc29';
      ctx.font = 'bold 34px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DAME LA LETRA · AR', 256, 248);
      ctx.fillStyle = '#f3eee3';
      ctx.font = '22px monospace';
      ctx.fillText('CAMINA ALREDEDOR DE LA WEB', 256, 286);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }

    const scene = new THREE.Scene();
    const root = new THREE.Group();
    root.name = 'DameLaLetraFloatingWeb';
    scene.add(root);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x160f21, roughness: 0.35, metalness: 0.4 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffcc29, roughness: 0.28, metalness: 0.65 });
    const violetMat = new THREE.MeshStandardMaterial({ color: 0x6a4888, roughness: 0.4, metalness: 0.3 });

    // Helper: creates a double-sided or framed 3D floating web screen in meters
    function addFloatingPanel({ w, h, d = 0.026, x, y, z, ry = 0, rx = 0, frontTex, backTex, accent = goldMat }) {
      const grp = new THREE.Group();
      grp.position.set(x, y, z);
      grp.rotation.set(rx, ry, 0);

      // Outer Gold/Violet Offset Frame (Brutalist Dame la Letra signature shadow in 3D!)
      const shadowGeo = new THREE.BoxGeometry(w + 0.03, h + 0.03, d * 0.7);
      const shadowMesh = new THREE.Mesh(shadowGeo, accent);
      shadowMesh.position.set(0.018, -0.018, -d * 0.65);
      grp.add(shadowMesh);

      // Main Dark Body
      const bodyGeo = new THREE.BoxGeometry(w + 0.024, h + 0.024, d);
      const bodyMesh = new THREE.Mesh(bodyGeo, frameMat);
      grp.add(bodyMesh);

      // Front Screen
      const screenGeo = new THREE.PlaneGeometry(w, h);
      const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.22, metalness: 0.05 });
      const frontMesh = new THREE.Mesh(screenGeo, frontMat);
      frontMesh.position.z = d / 2 + 0.002;
      grp.add(frontMesh);

      // Back Screen
      const backMat = new THREE.MeshStandardMaterial({ map: backTex || frontTex, roughness: 0.22, metalness: 0.05 });
      const backMesh = new THREE.Mesh(screenGeo, backMat);
      backMesh.rotation.y = Math.PI;
      backMesh.position.z = -(d / 2 + 0.002);
      grp.add(backMesh);

      root.add(grp);
      return grp;
    }

    // 1. Floor Anchor Disc at Y=0.006m (so AR Quick Look & Scene Viewer anchor Y=0 on the floor while all screens float in mid-air!)
    const floorGeo = new THREE.CylinderGeometry(0.42, 0.44, 0.012, 48);
    const floorMat = new THREE.MeshStandardMaterial({ map: makeFloorRingTex(), roughness: 0.4, metalness: 0.2 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, 0.006, 0);
    root.add(floorMesh);

    const ringGeo = new THREE.TorusGeometry(0.46, 0.008, 16, 64);
    ringGeo.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, goldMat);
    ringMesh.position.set(0, 0.012, 0);
    root.add(ringMesh);

    // 2. Center Main Floating Phone/Web Monolith (Floats at Y = 0.50m to 1.82m in mid-air!)
    // Front: Hero | Back: Miguel Sosa (Detrás de las ideas)
    addFloatingPanel({
      w: 0.78, h: 1.28, d: 0.032,
      x: 0, y: 1.18, z: 0, ry: 0,
      frontTex: tHero, backTex: tFounder, accent: goldMat
    });

    // Pop-out 3D Card floating in front-bottom of Center Monolith ("Lo que hacemos" & "Hablemos")
    addFloatingPanel({
      w: 0.54, h: 0.42, d: 0.02,
      x: 0, y: 0.36, z: 0.18, ry: 0, rx: -0.1,
      frontTex: tContact, backTex: tSvc, accent: violetMat
    });

    // 3. Left Floating Wing (Angled 28 deg toward viewer — floats at Y = 0.46m to 1.72m)
    // Top Left: Capítulo 01 Branding (Ely's & New Era)
    addFloatingPanel({
      w: 0.62, h: 0.78, d: 0.024,
      x: -0.78, y: 1.32, z: 0.22, ry: 0.46,
      frontTex: tCap1, backTex: tCap1b, accent: violetMat
    });
    // Bottom Left: Capítulo 02 Web & E-Commerce (Lucky Shaker)
    addFloatingPanel({
      w: 0.62, h: 0.62, d: 0.024,
      x: -0.78, y: 0.56, z: 0.22, ry: 0.46,
      frontTex: tCap2, backTex: tSvc, accent: goldMat
    });

    // 4. Right Floating Wing (Angled -28 deg toward viewer — floats at Y = 0.46m to 1.72m)
    // Top Right: Capítulo 03 Planos & Arquitectura 3D (Proyecto del Alcalde 3D)
    addFloatingPanel({
      w: 0.66, h: 0.62, d: 0.024,
      x: 0.78, y: 1.38, z: 0.22, ry: -0.46,
      frontTex: tCap3, backTex: tCap3, accent: goldMat
    });
    // Bottom Right: Capítulo 04 Software Propio & IA (ZHomes, New Era ARM, My Chief CAD, Tzel)
    addFloatingPanel({
      w: 0.66, h: 0.74, d: 0.024,
      x: 0.78, y: 0.64, z: 0.22, ry: -0.46,
      frontTex: tCap4, backTex: tContact, accent: violetMat
    });

    // 5. Top Floating Crown Header Banner at Y = 1.98m
    const bannerTex = makeBannerTex('DAME LA LETRA', 'BRANDING · WEB · ARQUITECTURA 3D · SOFTWARE IA');
    addFloatingPanel({
      w: 1.18, h: 0.26, d: 0.024,
      x: 0, y: 2.00, z: 0.06, ry: 0, rx: 0.06,
      frontTex: bannerTex, backTex: bannerTex, accent: goldMat
    });

    scene.updateMatrixWorld(true);

    // Export Binary GLB
    const gltfExp = new GLTFExporter();
    const glbBuf = await new Promise((res, rej) =>
      gltfExp.parse(scene, (r) => res(r), (e) => rej(e), { binary: true })
    );

    // Export iOS AR Quick Look USDZ
    const usdzExp = new USDZExporter();
    const usdzBuf = usdzExp.parseAsync
      ? await usdzExp.parseAsync(scene)
      : await new Promise((res, rej) => usdzExp.parse(scene, (r) => res(r), (e) => rej(e)));

    function abToB64(ab) {
      const bytes = new Uint8Array(ab);
      let bin = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      return btoa(bin);
    }

    return {
      glbB64: abToB64(glbBuf),
      usdzB64: abToB64(usdzBuf.buffer || usdzBuf),
    };
  };
  </script></body></html>`;

  builderHtmlContent = builderHtml;
  const expPage = await browser.newPage();
  expPage.on('pageerror', (e) => console.error('ExpPage error:', e));
  expPage.on('console', (m) => { if (m.type() === 'error') console.error('Console err:', m.text()); });
  await expPage.goto(`${baseUrl}/__builder__.html`, { waitUntil: 'networkidle' });
  await expPage.waitForFunction(() => typeof window.buildModels === 'function');

  console.log('Generating .GLB and .USDZ 3D floating website models...');
  const { glbB64, usdzB64 } = await expPage.evaluate(async (textures) => {
    return await window.buildModels(textures);
  }, { heroB64, svcB64, cap1B64, cap1bB64, cap2B64, cap3B64, cap4B64, founderB64, contactB64 });

  const glbPath = path.join(OUT_3D, 'dame-la-letra-web-ar.glb');
  const usdzPath = path.join(OUT_3D, 'dame-la-letra-web-ar.usdz');
  fs.writeFileSync(glbPath, Buffer.from(glbB64, 'base64'));
  fs.writeFileSync(usdzPath, Buffer.from(usdzB64, 'base64'));

  console.log('Saved:', {
    glb: glbPath,
    glbMB: (fs.statSync(glbPath).size / 1024 / 1024).toFixed(2) + ' MB',
    usdz: usdzPath,
    usdzMB: (fs.statSync(usdzPath).size / 1024 / 1024).toFixed(2) + ' MB',
  });

  // Render preview of the 3D floating website inside <model-viewer>
  const mvPage = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await mvPage.goto(`${baseUrl}/hola/index.html`, { waitUntil: 'networkidle' });
  await mvPage.setContent(`<!doctype html><html><head>
    <script type="module" src="${baseUrl}/hola/vendor/model-viewer.min.js"></script>
    <style>html,body{margin:0;width:100%;height:100%;background:radial-gradient(circle at 50% 45%,#2c1b42 0%,#0e0a14 75%)}model-viewer{width:100%;height:100%}</style>
  </head><body>
    <model-viewer id="mv" src="${baseUrl}/hola/3d/dame-la-letra-web-ar.glb" camera-controls camera-orbit="16deg 78deg 92%" shadow-intensity="1" exposure="1.08"></model-viewer>
  </body></html>`, { waitUntil: 'networkidle' });
  await mvPage.waitForTimeout(1800);
  await mvPage.screenshot({ path: 'C:/Users/migue/.gemini/antigravity/brain/24fd06a5-6ade-4c9e-8a05-ad552b8e87b7/v4_3d_web_totem_preview.png' });
} finally {
  await browser.close();
  server.close();
}
