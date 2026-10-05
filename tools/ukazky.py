"""Zástupné fotografie projektů — plotny do ukázky webu (C-013).

Architekt fotky realizací zatím nedodal; detail projektu dostane zástupný
snímek, který na první pohled vypadá jako vzorek, ne jako jeho práce.
Všechno je deterministické: náhoda jen z `random.Random(seed)`.
"""
from __future__ import annotations

import colorsys
import json
import random
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from tools.fotky import nazev_varianty, prumerna_barva, srcset

# Kam se obrázky zapisují — čte se až uvnitř funkcí (testy monkeypatchují).
# Cesta je od kořene projektu, ne od adresáře, ze kterého se nástroj pustí.
KOREN = Path(__file__).resolve().parents[1]
VEN = KOREN / "data" / "obrazky"

# Šířky variant, vzestupně.
SIRKY = (520, 1040, 1600)

# Barevné tóny papíru — světlé, lišící se odstíny.
_TONY = (
    (0.09, 0.15, 0.88),   # teplá béžová
    (0.55, 0.10, 0.89),   # světle modrá
    (0.33, 0.11, 0.88),   # světle zelená
    (0.83, 0.10, 0.89),   # světle růžová
    (0.15, 0.14, 0.90),   # světle oranžová
    (0.68, 0.20, 0.85),   # světle fialová
)

_TMAVY = (74, 66, 58)


def _ton(index: int, rng: random.Random) -> tuple[int, int, int]:
    """Světlý tón papíru; index drží odstíny od sebe, rng jen jemně rozkmitá."""
    hue, sat, light = _TONY[index % len(_TONY)]
    hue = (hue + rng.uniform(-0.01, 0.01)) % 1.0
    light = min(0.92, max(0.80, light + rng.uniform(-0.02, 0.02)))
    r, g, b = colorsys.hls_to_rgb(hue, light, sat)
    return (int(round(r * 255)), int(round(g * 255)), int(round(b * 255)))


# Výchozí písmo Pillow (Aileron) nemá háčky — „UKÁZKOVÁ" by vyšlo jako
# „UK□ZKOV□". Inter z repozitáře nepomůže, je to subset pro web, ze kterého
# Pillow glyfy nedostane. Bere se tedy první systémové písmo, které česky
# opravdu umí; když žádné není, spadne se na text bez diakritiky.
_KANDIDATI = (
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "C:/Windows/Fonts/arial.ttf",
)
_ZKOUSKA = "ŘůÁ"


def _ceske_pismo() -> str | None:
    """Cesta k prvnímu písmu, které má všechny české znaky ze `_ZKOUSKA`."""
    if _ceske_pismo._nalezeno is not Ellipsis:
        return _ceske_pismo._nalezeno
    from fontTools.ttLib import TTFont

    _ceske_pismo._nalezeno = None
    for cesta in _KANDIDATI:
        if not Path(cesta).exists():
            continue
        try:
            with TTFont(cesta, fontNumber=0, lazy=True) as font:
                mapa = font.getBestCmap()
            if all(ord(z) in mapa for z in _ZKOUSKA):
                _ceske_pismo._nalezeno = cesta
                break
        except Exception:
            continue
    return _ceske_pismo._nalezeno


_ceske_pismo._nalezeno = Ellipsis


def bez_diakritiky(text: str) -> str:
    rozlozene = unicodedata.normalize("NFD", text)
    return "".join(z for z in rozlozene if unicodedata.category(z) != "Mn")


def _pismo(velikost: int):
    """Písmo pro popis plotny. Vrací (font, uprav_text)."""
    cesta = _ceske_pismo()
    if cesta:
        try:
            return ImageFont.truetype(cesta, velikost), (lambda t: t)
        except Exception:
            pass
    try:
        return ImageFont.load_default(size=velikost), bez_diakritiky
    except TypeError:
        return ImageFont.load_default(), bez_diakritiky


def _na_stred(draw, text, sirka, y, font, barva):
    levy, horni, pravy, dolni = draw.textbbox((0, 0), text, font=font)
    draw.text(((sirka - (pravy - levy)) // 2 - levy, y), text, fill=barva, font=font)
    return dolni - horni


def _plotna(zaklad: str, sirka: int, vyska: int, ton: tuple[int, int, int]) -> Image.Image:
    """Světlý podklad, rám, rohové značky a popis, že jde o zástupný snímek.

    Kreslí se rovnou v cílové velikosti, aby popis byl čitelný i na malé
    variantě — text zmenšený spolu s obrázkem by se slil do šedé čárky.
    """
    img = Image.new("RGB", (sirka, vyska), ton)
    draw = ImageDraw.Draw(img)

    mezera = max(10, sirka // 46)
    tloustka = max(1, sirka // 520)
    draw.rectangle([mezera, mezera, sirka - mezera - 1, vyska - mezera - 1],
                   outline=_TMAVY, width=tloustka)

    # rohové značky jako na výkrese
    znacka = max(10, sirka // 18)
    okraj = max(5, mezera // 2)
    for x in (okraj, sirka - okraj - 1):
        for y in (okraj, vyska - okraj - 1):
            smerX = 1 if x < sirka / 2 else -1
            smerY = 1 if y < vyska / 2 else -1
            draw.line([(x, y), (x + smerX * znacka, y)], fill=_TMAVY, width=tloustka)
            draw.line([(x, y), (x, y + smerY * znacka)], fill=_TMAVY, width=tloustka)

    titul = "UKÁZKOVÁ FOTOGRAFIE"
    podtitul = f"zástupný snímek · {zaklad} · {sirka} × {vyska} px"
    pismoTitul, uprav = _pismo(max(11, round(sirka / 26)))
    pismoPodtitul, _ = _pismo(max(9, round(sirka / 62)))
    titul, podtitul = uprav(titul), uprav(podtitul)

    vyskaTitulu = _na_stred(draw, titul, sirka, round(vyska * 0.44), pismoTitul, _TMAVY)
    y = round(vyska * 0.44) + vyskaTitulu + max(8, vyska // 34)
    _na_stred(draw, podtitul, sirka, y, pismoPodtitul, _TMAVY)

    # linka pod titulem, ať plotna není jen text ve vzduchu
    sirkaLinky = round(sirka * 0.26)
    yl = round(vyska * 0.44) - max(10, vyska // 28)
    draw.line([((sirka - sirkaLinky) // 2, yl), ((sirka + sirkaLinky) // 2, yl)],
              fill=_TMAVY, width=tloustka)
    return img


def vyrob(pocet: int, *, seed: int = 1) -> list[dict]:
    """Vyrobí `pocet` zástupných ploten v poměru 3:2 a vrátí manifest."""
    if pocet <= 0:
        return []
    ven = VEN
    ven.mkdir(parents=True, exist_ok=True)
    rng = random.Random(seed)

    nejvetsi = max(SIRKY)
    nejvetsi_vyska = round(nejvetsi * 2 / 3)

    manifest = []
    for i in range(1, pocet + 1):
        zaklad = f"ukazka-{i:02d}"
        ton = _ton(i - 1, rng)
        velka = _plotna(zaklad, nejvetsi, nejvetsi_vyska, ton)

        varianty = []
        for sirka in SIRKY:
            vyska = round(sirka * 2 / 3)
            obrazek = velka if sirka == nejvetsi else _plotna(zaklad, sirka, vyska, ton)
            soubor = nazev_varianty(zaklad, sirka)
            obrazek.save(ven / soubor, "JPEG", quality=82, optimize=True)
            varianty.append({"soubor": soubor, "sirka": sirka})

        manifest.append(
            {
                "zaklad": zaklad,
                "popis": f"Ukázková fotografie — zástupný snímek projektu {zaklad}",
                "sirka": nejvetsi,
                "vyska": nejvetsi_vyska,
                "barva": prumerna_barva(velka),
                "varianty": varianty,
                "srcset": srcset(varianty),
            }
        )
    return manifest


def main(argv=None) -> int:
    # bez argumentu se bere příkazová řádka, ať `python -m tools.ukazky 10` funguje
    argv = list(argv) if argv is not None else sys.argv[1:]
    pocet = int(argv[0]) if argv else 4
    manifest = vyrob(pocet)
    ven = VEN
    ven.mkdir(parents=True, exist_ok=True)
    (ven / "ukazky.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
