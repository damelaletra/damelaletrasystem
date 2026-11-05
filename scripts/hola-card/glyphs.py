"""Extract Cloister Black glyph outlines as SVG path data (brand typeface)."""
import json, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

import os
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "assets", "fonts", "cloister", "CloisterBlack.ttf")
f = TTFont(FONT)
gs = f.getGlyphSet()
cmap = f.getBestCmap()
upm = f["head"].unitsPerEm
asc = f["hhea"].ascent

def text_path(text, tracking=0):
    """Return (d, width, bounds) for a string, y flipped so it renders upright in SVG."""
    svg = SVGPathPen(gs)
    x = 0
    hmtx = f["hmtx"]
    for ch in text:
        g = cmap[ord(ch)]
        # flip Y: y' = asc - y ; translate x
        tp = TransformPen(svg, (1, 0, 0, -1, x, asc))
        gs[g].draw(tp)
        x += hmtx[g][0] + tracking
    bp = BoundsPen(gs)
    x2 = 0
    for ch in text:
        g = cmap[ord(ch)]
        tp = TransformPen(bp, (1, 0, 0, -1, x2, asc))
        gs[g].draw(tp)
        x2 += hmtx[g][0] + tracking
    return svg.getCommands(), x, bp.bounds

out = {}
for key, txt, tr in [("L", "L", 0), ("D", "D", 0), ("DL", "DL", -60), ("M", "M", 0), ("S", "S", 0)]:
    d, w, b = text_path(txt, tr)
    out[key] = {"d": d, "advance": w, "bounds": b}
json.dump({"upm": upm, "asc": asc, "glyphs": out}, open(sys.argv[1], "w"))
print(upm, asc, {k: v["bounds"] for k, v in out.items()})
