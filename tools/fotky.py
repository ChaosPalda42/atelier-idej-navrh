"""Příprava fotek — ořez, varianty, manifest (C-007)."""
from __future__ import annotations

import os

from PIL import Image, ImageStat

POMERY = {"siroky": (3, 2), "navysku": (2, 3), "ctverec": (1, 1)}
SIRKY = (480, 960, 1600)


def orez_na_pomer(img: Image.Image, pomer: str) -> Image.Image:
    """Středový ořez na daný poměr stran z POMERY (ořezává se jen jeden rozměr)."""
    if pomer not in POMERY:
        raise ValueError(f"neznámý poměr: {pomer!r}")
    pw, ph = POMERY[pomer]
    w, h = img.size
    if w * ph > h * pw:  # širší než cíl -> ořezat šířku
        nova_sirka = int(round(h * pw / ph))
        x0 = (w - nova_sirka) // 2
        return img.crop((x0, 0, x0 + nova_sirka, h))
    nova_vyska = int(round(w * ph / pw))
    y0 = (h - nova_vyska) // 2
    return img.crop((0, y0, w, y0 + nova_vyska))


def zmensi(img: Image.Image, sirka: int) -> Image.Image:
    """Zmenší na danou šířku se zachováním poměru; nikdy nezvětšuje."""
    w, h = img.size
    if sirka >= w:
        return img
    nova_vyska = max(1, int(round(h * sirka / w)))
    return img.resize((sirka, nova_vyska))


def prumerna_barva(img: Image.Image) -> str:
    """Průměrná barva v "#rrggbb" malými písmeny."""
    r, g, b = (int(round(c)) for c in ImageStat.Stat(img.convert("RGB")).mean)
    return f"#{r:02x}{g:02x}{b:02x}"


def nazev_varianty(zaklad: str, sirka: int) -> str:
    return f"{zaklad}-{sirka}.jpg"


def srcset(varianty: list[dict]) -> str:
    return ", ".join(f"{v['soubor']} {v['sirka']}w" for v in varianty)


def zpracuj(cesta, vystup, zaklad, pomer="siroky", sirky=SIRKY) -> dict:
    """Načte obrázek, ořízne na poměr a uloží JPEG varianty do adresáře `vystup`."""
    with Image.open(cesta) as zdroj:
        orezany = orez_na_pomer(zdroj, pomer).convert("RGB")

    w, h = orezany.size
    sirky_cile = sorted({s for s in sirky if s <= w}) or [w]

    os.makedirs(vystup, exist_ok=True)
    varianty = []
    for s in sirky_cile:
        soubor = nazev_varianty(zaklad, s)
        zmenseny = zmensi(orezany, s)
        zmenseny.save(os.path.join(vystup, soubor), "JPEG", quality=82, optimize=True)
        varianty.append({"soubor": soubor, "sirka": zmenseny.width})

    return {
        "zaklad": zaklad,
        "pomer": pomer,
        "sirka": w,
        "vyska": h,
        "barva": prumerna_barva(orezany),
        "varianty": varianty,
        "srcset": srcset(varianty),
    }


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 4:
        print("použití: fotky.py <zdroj> <vystup> <zaklad> [pomer] [sirky ...]")
        sys.exit(1)
    c, v, z = sys.argv[1], sys.argv[2], sys.argv[3]
    p = sys.argv[4] if len(sys.argv) > 4 else "siroky"
    s = tuple(int(x) for x in sys.argv[5:]) or SIRKY
    print(zpracuj(c, v, z, p, s))
