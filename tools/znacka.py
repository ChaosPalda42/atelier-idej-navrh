# -*- coding: utf-8 -*-
"""Generátor značky ateliér IDEJ: ručně tažené kruhy + vysázený logotyp v křivkách."""
from __future__ import annotations

import math
import random
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.misc.transform import Transform

FONTY = Path("/Users/AI/Weby/FDb/fonty")


# ---------------------------------------------------------------- ruční kruh
def _body_kruhu(cx, cy, rx, ry, sklon, start, span, n, harm):
    """Body po obvodu mírně elipsovitého, nakloněného a zvlněného tahu."""
    pts = []
    s, c = math.sin(math.radians(sklon)), math.cos(math.radians(sklon))
    for i in range(n + 1):
        t = i / n
        uhel = math.radians(start + span * t)
        zvlneni = sum(amp * math.sin(k * uhel + faze) for k, (amp, faze) in harm.items())
        x, y = rx * (1 + zvlneni) * math.cos(uhel), ry * (1 + zvlneni) * math.sin(uhel)
        pts.append((cx + x * c - y * s, cy + x * s + y * c))
    return pts


def _krivka(pts, napeti=1.0):
    """Catmull-Rom přes body -> jedna kubická cesta."""
    d = [f"M {pts[0][0]:.2f} {pts[0][1]:.2f}"]
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i > 0 else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < len(pts) else pts[i + 1]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6 * napeti, p1[1] + (p2[1] - p0[1]) / 6 * napeti)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6 * napeti, p2[1] - (p3[1] - p1[1]) / 6 * napeti)
        d.append(f"C {c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {p2[0]:.2f} {p2[1]:.2f}")
    return " ".join(d)


def tahy_kruhu(cx, cy, r, *, seed=7, pocet=3):
    """Tři tahy přes sebe — tak, jak se kruh obtahuje tužkou. Každý trochu jinde."""
    rnd = random.Random(seed)
    out = []
    for i in range(pocet):
        harm = {2: (rnd.uniform(0.008, 0.016), rnd.uniform(0, 6.28)),
                3: (rnd.uniform(0.005, 0.011), rnd.uniform(0, 6.28)),
                5: (rnd.uniform(0.002, 0.005), rnd.uniform(0, 6.28))}
        ox, oy = rnd.uniform(-0.030, 0.030) * r, rnd.uniform(-0.026, 0.026) * r
        rx = r * rnd.uniform(0.955, 1.020)
        ry = r * rnd.uniform(0.955, 1.020)
        sklon = rnd.uniform(-14, 14)
        start = -118 + i * rnd.uniform(-26, 26)
        span = rnd.uniform(366, 398)
        pts = _body_kruhu(cx + ox, cy + oy, rx, ry, sklon, start, span, 64, harm)
        out.append(_krivka(pts))
    return out


# ------------------------------------------------------------------ logotyp
def text_v_krivkach(text, font_path, velikost, *, tracking=0.0, x=0.0, y=0.0):
    """Vrátí (d, sirka) — text jako jedna cesta, souřadnice už ve výsledné velikosti."""
    font = TTFont(font_path)
    upem = font["head"].unitsPerEm
    mer = velikost / upem
    glyphset = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    kusy, pero_x = [], x
    for znak in text:
        jmeno = cmap.get(ord(znak))
        if jmeno is None:
            pero_x += velikost * 0.3
            continue
        pen = SVGPathPen(glyphset, ntos=lambda v: f"{v:.2f}")
        tpen = TransformPen(pen, Transform(mer, 0, 0, -mer, pero_x, y))
        glyphset[jmeno].draw(tpen)
        d = pen.getCommands()
        if d:
            kusy.append(d)
        pero_x += hmtx[jmeno][0] * mer + tracking
    return " ".join(kusy), pero_x - x - tracking


def main():
    ven = Path(__file__).parent
    ORANZ = "#ef7d1c"
    TUHA = "#1c1a17"

    # --- kombinovaná značka (čtverec, jako předloha) -------------------------
    kruhy = tahy_kruhu(200, 178, 136, seed=11)
    a_d, a_w = text_v_krivkach("ateliér", FONTY / "Inter-Regular.ttf", 58, tracking=0.5)
    i_d, i_w = text_v_krivkach("IDEJ", FONTY / "Inter-Regular.ttf", 58, tracking=4.2)
    mezera = 26
    celkem = a_w + mezera + i_w
    x0 = 200 - celkem / 2
    a_d, _ = text_v_krivkach("ateliér", FONTY / "Inter-Regular.ttf", 58, tracking=0.5, x=x0, y=380)
    i_d, _ = text_v_krivkach("IDEJ", FONTY / "Inter-Regular.ttf", 58, tracking=4.2,
                             x=x0 + a_w + mezera, y=380)

    SIRKY = (2.9, 2.4, 2.1)
    tahy_svg = "\n".join(
        f'    <path class="tah tah{i+1}" stroke-width="{SIRKY[i % 3]}" d="{d}"/>'
        for i, d in enumerate(kruhy))
    stohovana = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="ateliér IDEJ">
  <g fill="none" stroke="{ORANZ}" stroke-linecap="round" stroke-linejoin="round">
{tahy_svg}
  </g>
  <g class="logotyp" fill="{TUHA}">
    <path class="slovo slovo-ateliér" d="{a_d}"/>
    <path class="slovo slovo-idej" d="{i_d}"/>
  </g>
</svg>
'''
    (ven / "znacka-stohovana.svg").write_text(stohovana, encoding="utf-8")

    # --- horizontální verze (do hlavičky webu) ------------------------------
    kruhy_h = tahy_kruhu(46, 46, 38, seed=11)
    ah_d, ah_w = text_v_krivkach("ateliér", FONTY / "Inter-Regular.ttf", 34, tracking=0.3, x=108, y=58)
    ih_d, _ = text_v_krivkach("IDEJ", FONTY / "Inter-Regular.ttf", 34, tracking=2.6,
                              x=108 + ah_w + 14, y=58)
    tahy_h = "\n".join(f'    <path class="tah tah{i+1}" d="{d}"/>' for i, d in enumerate(kruhy_h))
    horizontalni = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 92" role="img" aria-label="ateliér IDEJ">
  <g fill="none" stroke="{ORANZ}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
{tahy_h}
  </g>
  <g class="logotyp" fill="{TUHA}">
    <path d="{ah_d}"/>
    <path d="{ih_d}"/>
  </g>
</svg>
'''
    (ven / "znacka-horizontalni.svg").write_text(horizontalni, encoding="utf-8")

    # --- samotná značka (favicon, razítko) ----------------------------------
    kruhy_z = tahy_kruhu(32, 32, 26, seed=11)
    tahy_z = "\n".join(f'  <path d="{d}"/>' for d in kruhy_z)
    (ven / "znacka-samotna.svg").write_text(
        f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="ateliér IDEJ">
  <g fill="none" stroke="{ORANZ}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
{tahy_z}
  </g>
</svg>
''', encoding="utf-8")
    print("hotovo:", *[p.name for p in sorted(ven.glob("*.svg"))])


if __name__ == "__main__":
    main()
