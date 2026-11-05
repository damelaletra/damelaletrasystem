import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const PUBLIC_DIR = 'c:/TRABAJO/TRABAJO/LA LETRA/Dame la letra/public';
const OUT_3D = path.join(PUBLIC_DIR, 'hola', '3d');
const THREE_DIR = 'c:/TRABAJO/TRABAJO/LA LETRA/Dame la letra/scripts/hola-card/node_modules/three';

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
};

const mayorHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'hola', 'mayor-viewer', 'index.html'), 'utf8');
const secondScriptIdx = mayorHtml.lastIndexOf('<script>');
const lastScriptEndIdx = mayorHtml.lastIndexOf('</script>');
const mayorSceneCode = mayorHtml
  .slice(secondScriptIdx + '<script>'.length, lastScriptEndIdx)
  .replaceAll('new THREE.DodecahedronGeometry(rLobe, 2)', 'new THREE.DodecahedronGeometry(rLobe, 0)')
  .replaceAll('new THREE.DodecahedronGeometry(0.065, 1)', 'new THREE.DodecahedronGeometry(0.065, 0)')
  .replaceAll('const nLobes = 11;', 'const nLobes = 6;')
  .replaceAll('for (let b = 0; b < 14; b++)', 'for (let b = 0; b < 5; b++)')
  .replaceAll('0.635 * pt.rx', '0.648 * pt.rx')
  .replaceAll('0.635 * pt.ry', '0.648 * pt.ry')
  .replace('plaqueFace.position.z = 0.055;', 'plaqueFace.position.z = 0.062;');

const builderHtmlContent = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<script type="importmap">
{
  "imports": {
    "three": "/__three__/build/three.module.js",
    "three/addons/": "/__three__/examples/jsm/"
  }
}
</script>
</head>
<body>
<div id="canvas-container" style="width:800px;height:600px"></div>
<script type="module">
import * as THREE_MOD from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

const THREE = Object.assign({}, THREE_MOD, { OrbitControls });
window.THREE = THREE;

${mayorSceneCode}

window.exportMayorAR = async function() {
  await new Promise((r) => setTimeout(r, 600));

  // Set waving flags to a crisp dynamic wave frame (t = 1.1s)
  const t = 1.1;
  for (const wf of wavingFlags) {
    const pos = wf.mesh.geometry.attributes.position;
    const fw = wf.flagW || 6.0;
    for (let i = 0; i < pos.count; i++) {
      const bx = wf.basePos[i * 3];
      const by = wf.basePos[i * 3 + 1];
      const distFromPole = bx + fw * 0.5;
      const ratio = distFromPole / fw;
      const wave = Math.sin(distFromPole * 1.4 - t * 3.8) * 0.22 * ratio
                 + Math.cos(by * 1.3 - t * 2.4) * 0.06 * ratio;
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
    wf.mesh.geometry.computeVertexNormals();
  }

  // Remove underground footings, CMU cores, rebar, and distant road/far grass
  footingMeshes.forEach((m) => { if (m.parent) m.parent.remove(m); });
  coreMeshes.forEach((m) => { if (m.parent) m.parent.remove(m); });
  rebarMeshes.forEach((m) => { if (m.parent) m.parent.remove(m); });
  if (farGrassMesh && farGrassMesh.parent) farGrassMesh.parent.remove(farGrassMesh);
  if (farCurbMesh && farCurbMesh.parent) farCurbMesh.parent.remove(farCurbMesh);
  if (roadMesh && roadMesh.parent) roadMesh.parent.remove(roadMesh);
  if (stripeMesh && stripeMesh.parent) stripeMesh.parent.remove(stripeMesh);
  if (grassMesh && grassMesh.parent) grassMesh.parent.remove(grassMesh);
  if (curbMesh && curbMesh.parent) curbMesh.parent.remove(curbMesh);

  // Add tailored architectural presentation plinth around the monument & civic plaza
  const arGrass = createExtrudedPoly([[-20.5, 0.0], [20.5, 0.0], [20.5, 22.0], [-20.5, 22.0]], -0.35, 0.0, matGrass, false);
  const arCurb  = createExtrudedPoly([[-20.5, 22.0], [20.5, 22.0], [20.5, 22.5], [-20.5, 22.5]], -0.35, 0.25, matCurb, false);
  const matPlinthBase = new THREE.MeshStandardMaterial({ color: 0x160f21, roughness: 0.4, metalness: 0.35 });
  const matPlinthGold = new THREE.MeshStandardMaterial({ color: 0xffcc29, roughness: 0.3, metalness: 0.65 });
  createExtrudedPoly([[-21.0, -6.4], [21.0, -6.4], [21.0, 22.9], [-21.0, 22.9]], -0.68, -0.30, matPlinthBase, false);
  createExtrudedPoly([[-21.25, -6.65], [21.25, -6.65], [21.25, 23.15], [-21.25, 23.15]], -0.78, -0.68, matPlinthGold, false);

  const toRemove = [];
  scene.traverse((obj) => {
    if (obj.isLine || obj.isLineSegments || obj.isLight || obj.type === 'GridHelper') {
      toRemove.push(obj);
    } else if (obj.isGroup && obj.position && obj.position.z < -28) {
      toRemove.push(obj);
    } else if (obj.isMesh && obj !== arGrass && obj !== arCurb) {
      obj.geometry.computeBoundingBox();
      const bb = obj.geometry.boundingBox;
      if (bb && (bb.min.x < -21.5 || bb.max.x > 21.5)) {
        toRemove.push(obj);
      }
      if (obj.position && obj.position.y < -0.45) {
        toRemove.push(obj);
      }
    }
  });
  toRemove.forEach((obj) => { if (obj.parent) obj.parent.remove(obj); });

  scene.updateMatrixWorld(true);

  // Group geometries by source material reference so each material + texture is exported only ONCE!
  const matBuckets = new Map();

  function cleanGeomForMerge(rawGeom, worldMatrix, flipWinding = false) {
    let g = rawGeom.clone();
    g.applyMatrix4(worldMatrix);
    g.translate(0, 0.78, 8.25);
    if (g.index) g = g.toNonIndexed();

    const posCount = g.attributes.position.count;
    if (!g.attributes.uv) {
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(posCount * 2), 2));
    }
    if (flipWinding) {
      const posArr = g.attributes.position.array;
      const uvArr = g.attributes.uv.array;
      for (let i = 0; i < posArr.length; i += 9) {
        for (let k = 0; k < 3; k++) {
          const tmp = posArr[i + 3 + k];
          posArr[i + 3 + k] = posArr[i + 6 + k];
          posArr[i + 6 + k] = tmp;
        }
      }
      for (let i = 0; i < uvArr.length; i += 6) {
        for (let k = 0; k < 2; k++) {
          const tmp = uvArr[i + 2 + k];
          uvArr[i + 2 + k] = uvArr[i + 4 + k];
          uvArr[i + 4 + k] = tmp;
        }
      }
    }
    g.computeVertexNormals();
    // Keep only position, normal, uv so mergeGeometries succeeds cleanly
    const clean = new THREE.BufferGeometry();
    clean.setAttribute('position', g.attributes.position);
    clean.setAttribute('normal', g.attributes.normal);
    clean.setAttribute('uv', g.attributes.uv);
    return clean;
  }

  scene.traverse((obj) => {
    if (!obj.isMesh || !obj.visible) return;
    let p = obj.parent;
    while (p) {
      if (p.visible === false) return;
      p = p.parent;
    }
    const oldMat = obj.material;
    if (!matBuckets.has(oldMat)) {
      matBuckets.set(oldMat, []);
    }
    const bucket = matBuckets.get(oldMat);
    bucket.push(cleanGeomForMerge(obj.geometry, obj.matrixWorld, false));
    if (oldMat.side === THREE.DoubleSide) {
      bucket.push(cleanGeomForMerge(obj.geometry, obj.matrixWorld, true));
    }
  });

  const exportScene = new THREE.Scene();
  const rootGroup = new THREE.Group();
  rootGroup.name = 'ProyectoDelAlcalde_LynnviewMonument';
  const scaleToMeters = 0.048;
  rootGroup.scale.set(scaleToMeters, scaleToMeters, scaleToMeters);

  let mergedCount = 0;
  for (const [oldMat, geoms] of matBuckets.entries()) {
    if (!geoms.length) continue;
    const mergedGeom = BufferGeometryUtils.mergeGeometries(geoms, false);
    const newMat = new THREE.MeshStandardMaterial({
      color: oldMat.color ? oldMat.color.clone() : new THREE.Color(0xffffff),
      roughness: typeof oldMat.roughness === 'number' ? oldMat.roughness : 0.75,
      metalness: typeof oldMat.metalness === 'number' ? oldMat.metalness : 0.05,
    });
    if (oldMat.map && oldMat.map.image) {
      const img = oldMat.map.image;
      const isTextSign = (oldMat === matPlaque || oldMat === matWallSign);
      const isFieldstone = (oldMat === matFieldstoneMain);
      const maxDim = isTextSign ? 512 : (isFieldstone ? 512 : 256);
      const w = Math.min(maxDim, img.width || maxDim);
      const h = Math.min(maxDim, img.height || maxDim);
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const compactTex = new THREE.CanvasTexture(cv);
      compactTex.wrapS = oldMat.map.wrapS;
      compactTex.wrapT = oldMat.map.wrapT;
      compactTex.repeat.copy(oldMat.map.repeat);
      compactTex.colorSpace = THREE.SRGBColorSpace;
      newMat.map = compactTex;
    }
    if (oldMat === matWallSign) {
      // Slightly offset wall sign forward along normal and use alphaTest so "City of Lynnview" is crisp on the stone wall
      newMat.transparent = true;
      newMat.alphaTest = 0.15;
    }
    const mesh = new THREE.Mesh(mergedGeom, newMat);
    mesh.name = 'mayor_mat_group_' + (mergedCount++);
    rootGroup.add(mesh);
  }

  exportScene.add(rootGroup);
  exportScene.updateMatrixWorld(true);

  const gltfExporter = new GLTFExporter();
  const glbBuffer = await new Promise((res, rej) => {
    gltfExporter.parse(exportScene, (result) => res(result), (err) => rej(err), { binary: true });
  });

  const usdzExporter = new USDZExporter();
  const usdzUint8 = await usdzExporter.parseAsync(exportScene);

  function abToBase64(buf) {
    const bytes = new Uint8Array(buf);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  return {
    mergedCount,
    glbB64: abToBase64(glbBuffer),
    usdzB64: abToBase64(usdzUint8.buffer),
  };
};
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/__mayor_builder__.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    return res.end(builderHtmlContent);
  }
  let fp;
  if (u.startsWith('/__three__/')) {
    fp = path.join(THREE_DIR, u.replace('/__three__/', ''));
  } else {
    fp = path.join(PUBLIC_DIR, u);
  }
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

const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/__mayor_builder__.html`, { waitUntil: 'networkidle' });
  console.log('Building optimized Mayor 3D AR models (.glb + .usdz)...');
  const { mergedCount, glbB64, usdzB64 } = await page.evaluate(() => window.exportMayorAR());

  const glbPath = path.join(OUT_3D, 'proyecto-alcalde-ar.glb');
  const usdzPath = path.join(OUT_3D, 'proyecto-alcalde-ar.usdz');
  fs.writeFileSync(glbPath, Buffer.from(glbB64, 'base64'));
  fs.writeFileSync(usdzPath, Buffer.from(usdzB64, 'base64'));

  console.log(`Exported ${mergedCount} merged material groups:`);
  console.log(' - GLB:', glbPath, (fs.statSync(glbPath).size / 1024 / 1024).toFixed(2), 'MB');
  console.log(' - USDZ:', usdzPath, (fs.statSync(usdzPath).size / 1024 / 1024).toFixed(2), 'MB');
} finally {
  await browser.close();
  server.close();
}
