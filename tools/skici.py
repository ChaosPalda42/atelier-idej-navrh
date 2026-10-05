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
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageMath, ImageOps

from tools.fotky import nazev_varianty, prumerna_barva, srcset, zmensi

KOREN = Path(__file__).resolve().parents[1]
ZDROJ = KOREN / "podklady" / "prace" / "WEB"
# Skici nahrané správou webu. Na rozdíl od `podklady/` je tahle složka
# v repozitáři — jinak by se nahraná skica neměla jak dostat na server.
NAHRANE = KOREN / "zdroje" / "skici"
VEN = KOREN / "data" / "obrazky"
SIRKY = (520, 1040, 1600)

# soubory, které tenhle nástroj vyrábí: „01-rodinne-domy-520.png",
# „z-neco-sken-1040.jpg" a razítko
MOJE = re.compile(r"^(\d{2}-|z-|razitko\.)")

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


def pruhledne(img: Image.Image) -> Image.Image:
    """Z vybílené kresby udělá obrázek bez papíru — zůstane jen inkoust.

    Papír je bílý, takže průhlednost je prostě „jak daleko od bílé":
    a = 255 − min(R,G,B). Barva se musí z bílé *vydělit* zpátky, jinak by
    světlé tahy vybledly: C' = (C − min) · 255 / (255 − min).
    """
    r, g, b = img.convert("RGB").split()
    nejtmavsi = ImageChops.darker(ImageChops.darker(r, g), b)
    alfa = ImageChops.invert(nejtmavsi)

    def odbel(kanal):
        return ImageMath.lambda_eval(
            lambda a: a["convert"](
                (a["float"](a["c"]) - a["float"](a["m"])) * 255
                / a["max"](a["float"](a["a"]), 1), "L"),
            c=kanal, m=nejtmavsi, a=alfa)

    return Image.merge("RGBA", (odbel(r), odbel(g), odbel(b), alfa))


def zpracuj(cesta: Path, poradi: int) -> dict:
    jmeno = cesta.stem
    skupina = skupina_ze_jmena(jmeno)
    popis = NAZVY.get(skupina, re.sub(r"^\d+[-_]\s*", "", jmeno).strip())
    zaklad = f"{poradi:02d}-{skupina}"

    with Image.open(cesta) as nactena:
        # fotky z mobilu mají otočení jen v EXIF; bez tohohle leží skica na boku
        rovne = ImageOps.exif_transpose(nactena).convert("RGB")
    kresba = pruhledne(vybel_papir(rovne))

    VEN.mkdir(parents=True, exist_ok=True)
    varianty, puvodni = [], []
    for sirka in SIRKY:
        if sirka > kresba.size[0] and varianty:
            continue
        cil = min(sirka, kresba.size[0])

        zmensena = zmensi(kresba, cil)
        # málo barev stačí a PNG s průhledností je pak třetinové
        soubor = f"{zaklad}-{zmensena.size[0]}.png"
        zmensena.quantize(colors=96, method=Image.Quantize.FASTOCTREE).save(
            VEN / soubor, optimize=True)
        if not any(v["sirka"] == zmensena.size[0] for v in varianty):
            varianty.append({"soubor": soubor, "sirka": zmensena.size[0]})

        if cil >= 900:   # originál se ukazuje až po kliknutí, menší nemá smysl
            skutecna = zmensi(rovne, cil)
            jmeno = nazev_varianty(zaklad + "-sken", skutecna.size[0])
            skutecna.save(VEN / jmeno, quality=84, optimize=True)
            if not any(v["sirka"] == skutecna.size[0] for v in puvodni):
                puvodni.append({"soubor": jmeno, "sirka": skutecna.size[0]})

    return {
        "zaklad": zaklad,
        "popis": popis,
        "skupina": skupina,
        "sirka": kresba.size[0],
        "vyska": kresba.size[1],
        "barva": prumerna_barva(rovne),
        "varianty": varianty,
        "srcset": srcset(varianty),
        "sken": puvodni[-1] if puvodni else (varianty[-1] if varianty else None),
    }


RAZITKO = KOREN / "podklady" / "razitko"


def zpracuj_razitko() -> str:
    """Razítko ateliéru projde stejnou cestou jako skici — zbude jen tuš.

    Otisk je na podkladu otočený o čtvrt otáčky doleva, proto se rovná
    o 90° po směru hodinových ručiček.
    """
    zdroje = sorted(RAZITKO.glob("*.jp*g")) + sorted(RAZITKO.glob("*.png")) if RAZITKO.exists() else []
    if not zdroje:
        return ""
    with Image.open(zdroje[0]) as nactene:
        rovne = ImageOps.exif_transpose(nactene).convert("RGB")
    rovne = rovne.rotate(-90, expand=True)
    kresba = pruhledne(vybel_papir(rovne))
    VEN.mkdir(parents=True, exist_ok=True)
    zmensene = zmensi(kresba, min(600, kresba.size[0]))
    zmensene.quantize(colors=48, method=Image.Quantize.FASTOCTREE).save(VEN / "razitko.png", optimize=True)
    return "razitko.png"


def zpracuj_nahranou(popisek: Path) -> dict | None:
    """Skica nahraná správou webu: obrázek + JSON s popisem vedle něj.

    Projde stejnou cestou jako skici z podkladů, jen jméno a zařazení si
    nevymýšlí z názvu souboru — bere je z popisku, který zapsala správa.
    """
    udaje = json.loads(popisek.read_text(encoding="utf-8"))
    obrazek = popisek.parent / udaje.get("soubor", "")
    if not obrazek.exists():
        print(f"  ! {popisek.name}: chybí obrázek {udaje.get('soubor')!r}")
        return None

    zaklad = f"z-{popisek.stem}"
    with Image.open(obrazek) as nactena:
        rovne = ImageOps.exif_transpose(nactena).convert("RGB")
    kresba = pruhledne(vybel_papir(rovne))

    VEN.mkdir(parents=True, exist_ok=True)
    varianty, puvodni = [], []
    for sirka in SIRKY:
        if sirka > kresba.size[0] and varianty:
            continue
        cil = min(sirka, kresba.size[0])
        zmensena = zmensi(kresba, cil)
        soubor = f"{zaklad}-{zmensena.size[0]}.png"
        zmensena.quantize(colors=96, method=Image.Quantize.FASTOCTREE).save(
            VEN / soubor, optimize=True)
        if not any(v["sirka"] == zmensena.size[0] for v in varianty):
            varianty.append({"soubor": soubor, "sirka": zmensena.size[0]})
        if cil >= 900:
            skutecna = zmensi(rovne, cil)
            jmeno = nazev_varianty(zaklad + "-sken", skutecna.size[0])
            skutecna.save(VEN / jmeno, quality=84, optimize=True)
            if not any(v["sirka"] == skutecna.size[0] for v in puvodni):
                puvodni.append({"soubor": jmeno, "sirka": skutecna.size[0]})

    skupina = udaje.get("skupina") or "studie"
    return {
        "zaklad": zaklad,
        "popis": udaje.get("popis") or NAZVY.get(skupina, "Skica"),
        "skupina": skupina,
        "sirka": kresba.size[0],
        "vyska": kresba.size[1],
        "barva": prumerna_barva(rovne),
        "varianty": varianty,
        "srcset": srcset(varianty),
        "sken": puvodni[-1] if puvodni else (varianty[-1] if varianty else None),
    }


def nactiNahrane() -> list[dict]:
    if not NAHRANE.exists():
        return []
    hotove = []
    for popisek in sorted(NAHRANE.glob("*.json")):
        zaznam = zpracuj_nahranou(popisek)
        if zaznam:
            hotove.append(zaznam)
    return hotove


def jen_nahrane() -> int:
    """Režim pro nasazení: podklady na serveru nejsou, jede se jen přes
    `zdroje/skici` a výsledek se slije s tím, co už v manifestu je."""
    manifest = VEN / "seznam.json"
    stary = json.loads(manifest.read_text(encoding="utf-8")) if manifest.exists() else []
    nove = nactiNahrane()
    podle = {z["zaklad"]: z for z in stary}
    for z in nove:
        podle[z["zaklad"]] = z
    seznam = list(podle.values())
    manifest.write_text(json.dumps(seznam, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"nahraných skic: {len(nove)}; v manifestu celkem {len(seznam)}")
    return 0


def main(argv=None) -> int:
    argv = list(argv) if argv is not None else sys.argv[1:]
    if "--jen-nahrane" in argv:
        return jen_nahrane()
    soubory = sorted(p for p in ZDROJ.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png"))
    if not soubory:
        print(f"v {ZDROJ} nic není")
        return 1
    if VEN.exists():
        # Mazat jen to, co vyrábí tenhle nástroj. Ve složce bydlí i plotny
        # z tools/ukazky.py — ty by plný běh jinak smetl s sebou.
        for stary in list(VEN.glob("*.jpg")) + list(VEN.glob("*.png")):
            if MOJE.match(stary.name):
                stary.unlink()
    seznam = [zpracuj(p, i + 1) for i, p in enumerate(soubory)]
    seznam += nactiNahrane()
    razitko = zpracuj_razitko()
    if razitko:
        print("razítko ->", razitko)
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
