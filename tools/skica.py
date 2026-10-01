"""Z fotky linková skica — bílé pozadí, tmavé čáry na hranách (C-008)."""
from __future__ import annotations

import os

from PIL import Image, ImageChops, ImageFilter, ImageOps


def sede(img: Image.Image) -> Image.Image:
    """Převod do režimu "L"."""
    return img.convert("L")


def rozdil_rozmazani(img: Image.Image, polomer: float) -> Image.Image:
    """Rozdíl dvou gaussovských rozmazání (polomer a polomer * 2.5) obrazu v "L"."""
    l = img.convert("L")
    jemne = l.filter(ImageFilter.GaussianBlur(polomer))
    hrube = l.filter(ImageFilter.GaussianBlur(polomer * 2.5))
    return ImageChops.difference(jemne, hrube)


def skica(img: Image.Image, polomer: float = 1.6, zesileni: float = 4.0, prah: int = 14) -> Image.Image:
    """Světlá kresba: bílé pozadí (255) a tmavé čáry na hranách, režim "L"."""
    v = rozdil_rozmazani(sede(img), polomer)
    v = v.point(lambda x: min(255, int(x * zesileni)))
    v = v.point(lambda x: 0 if x < prah else x)
    return ImageOps.invert(v)


def hustota(img: Image.Image) -> float:
    """Podíl pixelů s hodnotou < 128 ze všech, zaokrouhlený na 4 desetinná místa."""
    data = list(img.getdata())
    return round(sum(1 for x in data if x < 128) / len(data), 4)


def uloz_skicu(cesta, vystup, **kw) -> dict:
    """Načte obrázek z `cesta`, udělá skicu a uloží jako PNG do adresáře `vystup`."""
    with Image.open(cesta) as zdroj:
        obraz = skica(zdroj, **kw)
    os.makedirs(vystup, exist_ok=True)
    soubor = os.path.splitext(os.path.basename(cesta))[0] + ".png"
    obraz.save(os.path.join(vystup, soubor), "PNG")
    return {
        "soubor": soubor,
        "sirka": obraz.width,
        "vyska": obraz.height,
        "hustota": hustota(obraz),
    }


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("použití: skica.py <zdroj> <vystup> [polomer] [zesileni] [prah]")
        sys.exit(1)
    c, v = sys.argv[1], sys.argv[2]
    args = [float(x) if i < 2 else int(x) for i, x in enumerate(sys.argv[3:6])]
    print(uloz_skicu(c, v, *args))
