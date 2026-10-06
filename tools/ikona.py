# -*- coding: utf-8 -*-
"""Vyrobí rastrové ikony webu ze skutečných tahů značky.

Prohlížeč si v záložce vystačí s `favicon.svg`, který skládá sestavení.
Telefon ale na plochu chce PNG, a to se z SVG na tomhle stroji nemá čím
vyrenderovat (ImageMagick tahy neumí, rsvg ani resvg tu nejsou). Tahy jsou
naštěstí jen úsečky — `M x y L x y …` — takže se dají nakreslit přímo.

Spuštění:  uv run python -m tools.ikona
Vstup:     src/templates/znacka-cesty.mjs
Výstup:    src/assets/ikona-180.png, src/assets/ikona-512.png
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageDraw

KOREN = Path(__file__).resolve().parents[1]
CESTY = KOREN / "src" / "templates" / "znacka-cesty.mjs"
VEN = KOREN / "src" / "assets"

PAPIR = (250, 246, 238)
VELIKOSTI = (180, 512)
ODSAZENI = 8.0          # ve zdrojových jednotkách, stejné jako u favicon.svg
SILA = 2.6              # tahy se ztloustnou, jinak se při 16 px ztratí
NADVZOREK = 4           # kreslí se čtyřikrát větší a pak zmenší — hladké hrany


def nacti_znacku() -> dict:
    """Z ES modulu vytáhne JSON. Soubor je `export const ZNACKA = { … };`."""
    text = CESTY.read_text(encoding="utf-8")
    zacatek = text.index("{", text.index("ZNACKA"))
    konec = text.rindex("}") + 1
    return json.loads(text[zacatek:konec])


def body(d: str) -> list[tuple[float, float]]:
    cisla = [float(x) for x in re.findall(r"-?\d*\.?\d+", d)]
    return list(zip(cisla[0::2], cisla[1::2]))


def barva(zapis: str) -> tuple[int, int, int]:
    zapis = zapis.lstrip("#")
    return tuple(int(zapis[i:i + 2], 16) for i in (0, 2, 4))


def vyrob(velikost: int) -> Image.Image:
    znacka = nacti_znacku()
    kruh = znacka["kruh"]
    x, y, sirka, vyska = kruh["box"]
    stred = (x + sirka / 2, y + vyska / 2)
    strana = max(sirka, vyska) + ODSAZENI * 2
    levy, horni = stred[0] - strana / 2, stred[1] - strana / 2

    kresli_na = velikost * NADVZOREK
    mer = kresli_na / strana
    img = Image.new("RGB", (kresli_na, kresli_na), PAPIR)
    kresba = ImageDraw.Draw(img)

    for tah in kruh["tahy"]:
        cara = [((bx - levy) * mer, (by - horni) * mer) for bx, by in body(tah["d"])]
        if len(cara) < 2:
            continue
        kresba.line(cara, fill=barva(tah["barva"]),
                    width=max(1, round(tah["sirka"] * SILA * mer)), joint="curve")

    # zaoblené rohy jako u SVG varianty
    maska = Image.new("L", (kresli_na, kresli_na), 0)
    ImageDraw.Draw(maska).rounded_rectangle(
        [0, 0, kresli_na - 1, kresli_na - 1], radius=round(kresli_na * 0.17), fill=255)
    plocha = Image.new("RGBA", (kresli_na, kresli_na), (0, 0, 0, 0))
    plocha.paste(img, mask=maska)
    return plocha.resize((velikost, velikost), Image.LANCZOS)


def main(argv=None) -> int:
    VEN.mkdir(parents=True, exist_ok=True)
    for velikost in VELIKOSTI:
        cesta = VEN / f"ikona-{velikost}.png"
        vyrob(velikost).save(cesta, optimize=True)
        print(f"{cesta.relative_to(KOREN)}  {velikost}×{velikost}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
