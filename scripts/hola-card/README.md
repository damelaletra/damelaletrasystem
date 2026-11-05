# /hola — Tarjeta digital de networking (Dame la Letra)

URL pública: **https://www.damelaletra.com/hola** · QR para mostrar en el teléfono: **https://www.damelaletra.com/hola/qr**

La salida es estática (`public/hola/`) y no depende del backend: Vercel y Express (`express.static`) la sirven tal cual.
Esta carpeta solo contiene el generador.

## Editar datos de contacto

1. Edita `config.json` (WhatsApp, texto prellenado, Instagram, email, datos del vCard).
2. Edita textos/diseño en `index.template.html` (página) o `qr.template.html` (pantalla QR).
3. Regenera:

```bash
cd scripts/hola-card
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install   # solo la primera vez
node build.mjs
```

`build.mjs` genera: `index.html`, `qr/index.html`, `qr/dame-la-letra-qr.{png,svg}`, `miguel-sosa-dame-la-letra.vcf`,
favicons (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192/512.png`), `site.webmanifest` y `og.jpg`.
Usa Chrome instalado en `C:/Program Files/Google/Chrome/Application/chrome.exe` para renderizar `og.jpg`.

## Archivos auxiliares

- `glyphs.json` — contornos de la tipografía de marca (Cloister Black) usados para la “L” del hero y el monograma DL. Se genera con `glyphs.py` (requiere `fonttools`).
- `images.mjs` — script de una sola vez que convirtió capturas de los proyectos (carpetas de clientes en `C:/TRABAJO/...` y capturas de los sitios en vivo) a WebP en `public/hola/img/`. Las rutas de origen son locales.

## Tokens de la plantilla

`__WA_HREF__`, `__WA_ICON__`, `__IG_BUTTON__`, `__LD_EXTRA__`, `__L_PATH__`, `__DL_PATH__` (página) y `__QR_SVG__` (QR). El build falla si queda alguno sin reemplazar.
