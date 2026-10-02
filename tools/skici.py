# -*- coding: utf-8 -*-
"""Připraví naskenované skici architekta pro web.

Skici jsou kresby na papíře. Aby na webu neseděly jako „obrázek v rámečku",
ale jako kresba přímo na listu, udělají se dvě věci:

  1. **Vybílení papíru** — najde se světlý tón podkladu a roztáhne se na bílou,
     takže zůstane jen tah pera a fixu. Web pak obrázek nasadí v režimu
     `multiply`, bílá zmizí a kresba leží rovnou na papíře stránky.
  2. **Responzivní varianty** — stejné šířky jako u fotek, aby se na mobilu
     netáhly megabajty. Poměr stran se NEOŘEZÁVÁ, skica je skica.

Spuštění:  uv run python -m tools.skici
Vstup:     podklady/prace/WEB/*.jpg   (názvy ve tvaru `01_rodinné domy.jpg`)
Výstup:    data/obrazky/*.jpg + data/obrazky/seznam.json
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps

from tools.fotky import nazev_varianty, prumerna_barva, srcset, zmensi

KOREN = Path(__file__).resolve().parents[1]
ZDROJ = KOREN / "podklady" / "prace" / "WEB"
VEN = KOREN / "data" / "obrazky"
SIRKY = (520, 1040, 1600)

# ze jména souboru se pozná, do které skupiny skica patří
SKUPINY = {
    "rodinné domy": "rodinne-domy",
    "bytové domy": "bytove-domy",
    "bytový dům": "bytove-domy",
    "garáže": "garaze",
    "interiéry": "interiery",
}


def bez_diakritiky(text: str) -> str:
    rozlozene = unicodedata.normalize("NFD", text)
    return "".join(z for z in rozlozene if unicodedata.category(z) != "Mn")


def slug(text: str) -> str:
    cisty = re.sub(r"[^a-z0-9]+", "-", bez_diakritiky(text).lower())
    return cisty.strip("-")


# dvě skici mají v názvu jen „obrazek"; zařazení podle toho, co je na nich
RUCNE = {"01": "bytove-domy", "02": "rodinne-domy"}

NAZVY = {
    "rodinne-domy": "Rodinný dům",
    "bytove-domy": "Bytový dům",
    "interiery": "Interiér",
    "garaze": "Garáž",
    "studie": "Studie",
}


def skupina_ze_jmena(jmeno: str) -> str:
    zaklad = jmeno.lower()
    for klic, hodnota in SKUPINY.items():
        if klic in zaklad:
            return hodnota
    return RUCNE.get(jmeno[:2], "studie")


def vybel_papir(img: Image.Image, mekkost: float = 48.0, dotah: float = 0.06) -> Image.Image:
    """Odečte nerovnoměrné pozadí skenu, takže zůstane jen tah pera.

    Skeny z mobilu mají papír jednou nažloutlý, jindy šedý a skoro vždycky
    tmavší u krajů. Procentem se to spravit nedá — proto se spočítá *rozmazané
    pozadí* (jak by sken vypadal bez kresby) a od něj se obraz odečte:
    kde se obraz od pozadí neliší, je papír a vyjde bílá; kde je tmavší,
    zůstane kresba i s barvou. `dotah` ještě roztáhne zbylé světlé tóny.
    """
    rgb = img.convert("RGB")
    sirka, vyska = rgb.size
    zmensene = max(1, round(max(sirka, vyska) / 420))
    maly = rgb.resize((max(1, sirka // zmensene), max(1, vyska // zmensene)), Image.BILINEAR)
    polomer = max(2.0, mekkost / zmensene * (max(sirka, vyska) / 1600))
    pozadi = maly.filter(ImageFilter.GaussianBlur(polomer)).resize(rgb.size, Image.BILINEAR)

    kanaly = []
    for kanal, pozadi_kanalu in zip(rgb.split(), pozadi.split()):
        kresba = ImageChops.subtract(pozadi_kanalu, kanal)     # 0 = papír, víc = tuš
        kanaly.append(ImageChops.invert(kresba))
    ven = Image.merge("RGB", kanaly)

    # jemné dotažení kontrastu, ať tenké tahy nezešednou
    sede = ImageOps.grayscale(ven)
    histogram = sede.histogram()
    celkem = sum(histogram)
    nasbirano, prah = 0, 0
    for hodnota in range(256):
        nasbirano += histogram[hodnota]
        if nasbirano >= celkem * 0.002:
            prah = hodnota
            break
    svetla = max(1, 255 - round(255 * dotah))
    rozsah = max(1, svetla - prah)
    tabulka = [max(0, min(255, round((i - prah) * 255 / rozsah))) for i in range(256)]
    return ven.point(tabulka * 3)


def zpracuj(cesta: Path, poradi: int) -> dict:
    jmeno = cesta.stem
    skupina = skupina_ze_jmena(jmeno)
    popis = NAZVY.get(skupina, re.sub(r"^\d+[-_]\s*", "", jmeno).strip())
    zaklad = f"{poradi:02d}-{skupina}"

    with Image.open(cesta) as puvodni:
        obraz = vybel_papir(puvodni)

    VEN.mkdir(parents=True, exist_ok=True)
    varianty = []
    for sirka in SIRKY:
        if sirka > obraz.size[0] and varianty:
            continue
        zmenseny = zmensi(obraz, min(sirka, obraz.size[0]))
        soubor = nazev_varianty(zaklad, zmenseny.size[0])
        zmenseny.save(VEN / soubor, quality=84, optimize=True)
        if not any(v["sirka"] == zmenseny.size[0] for v in varianty):
            varianty.append({"soubor": soubor, "sirka": zmenseny.size[0]})

    return {
        "zaklad": zaklad,
        "popis": popis,
        "skupina": skupina,
        "sirka": obraz.size[0],
        "vyska": obraz.size[1],
        "barva": prumerna_barva(obraz),
        "varianty": varianty,
        "srcset": srcset(varianty),
    }


def main(argv=None) -> int:
    soubory = sorted(p for p in ZDROJ.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png"))
    if not soubory:
        print(f"v {ZDROJ} nic není")
        return 1
    if VEN.exists():
        for stary in VEN.glob("*.jpg"):
            stary.unlink()
    seznam = [zpracuj(p, i + 1) for i, p in enumerate(soubory)]
    (VEN / "seznam.json").write_text(
        json.dumps(seznam, ensure_ascii=False, indent=1), encoding="utf-8")
    skupiny: dict[str, int] = {}
    for s in seznam:
        skupiny[s["skupina"]] = skupiny.get(s["skupina"], 0) + 1
    print(f"{len(seznam)} skic -> {VEN.relative_to(KOREN)}; " +
          ", ".join(f"{k}: {v}" for k, v in sorted(skupiny.items())))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
