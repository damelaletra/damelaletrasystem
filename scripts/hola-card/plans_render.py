"""Render selected plan sheets at high DPI and crop to the drawing only (privacy):
removes the title block (client/address), frame and margins. Output: public/hola/img/plan-*.webp"""
import os, sys, glob
import pymupdf
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "public", "hola", "img")
B = r"C:\TRABAJO\barba construction\planos"
M = r"C:\TRABAJO\My Chief\proyectos"

# id, pdf (glob), page, keep-fraction of width (drops right title block), extra crop box (fractions) or None, label
SEL = [
    ("plan-floor-a", B + r"\4806 Dreams End Dr\*Dr 5.pdf", 0, 0.86, None),
    ("plan-mep", B + r"\6106 port antonio rd\*AC.pdf", 0, 0.86, None),
    ("plan-render-brick", B + r"\1625 woodland*\*1 Y 2.pdf", 1, 0.86, None),
    ("plan-elev-2story", B + r"\7107 Greendoor Ct\*FRONT PORCH 1.1.pdf", 2, 0.86, None),
    ("plan-deck-section", B + r"\**\deckSOLO.pdf", 0, 0.86, None),
    ("plan-floor-b", B + r"\7107 Greendoor Ct\7107 Greendoor Ct.pdf", 0, 0.86, None),
    ("plan-cottage", B + r"\8904 3rd st rd\*1.1.pdf", 1, 0.86, None),
    ("plan-deck-3d", B + r"\**\deck 1.pdf", 2, 0.86, None),
    ("plan-hvac", B + r"\4806 Dreams End Dr\*AC 1.pdf", 0, 0.86, None),
    ("plan-mychief-basement", M + r"\2513 Foxy Poise Rd\*Basement_Plan.pdf", 0, 0.80, None),
    ("plan-mychief-details", M + r"\2513 Foxy Poise Rd\*Excavation*.pdf", 0, 0.80, None),
]

def autocrop(im, keep_w):
    g = ImageOps.grayscale(im)
    W, H = g.size
    # inner region: drop the right title block and a margin that contains the sheet frame
    x0, y0, x1, y1 = int(W * 0.035), int(H * 0.045), int(W * keep_w), int(H * 0.955)
    inner = g.crop((x0, y0, x1, y1))
    # dark pixels -> bbox of the drawing
    mask = inner.point(lambda v: 255 if v < 200 else 0)
    bb = mask.getbbox()
    if not bb:
        return im
    pad = int(W * 0.015)
    l, t, r, b = bb
    box = (max(0, x0 + l - pad), max(0, y0 + t - pad), min(W, x0 + r + pad), min(H, y0 + b + pad))
    return im.crop(box)

os.makedirs(OUT, exist_ok=True)
for pid, pat, pg, keep, _ in SEL:
    files = sorted(glob.glob(pat, recursive=True))
    if not files:
        print("MISSING", pid, pat); continue
    doc = pymupdf.open(files[0])
    page = doc[min(pg, doc.page_count - 1)]
    pix = page.get_pixmap(dpi=170)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    im = autocrop(im, keep)
    big = im.copy(); big.thumbnail((1800, 1800), Image.LANCZOS)
    big.save(os.path.join(OUT, f"{pid}-1800.webp"), "WEBP", quality=72, method=6)
    sm = im.copy(); sm.thumbnail((720, 720), Image.LANCZOS)
    sm.save(os.path.join(OUT, f"{pid}-720.webp"), "WEBP", quality=72, method=6)
    print(pid, os.path.basename(files[0]), big.size, sm.size)
