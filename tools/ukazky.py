"""Zástupné fotografie projektů — plotny do ukázky webu (C-013).

Architekt fotky realizací zatím nedodal; detail projektu dostane zástupný
snímek, který na první pohled vypadá jako vzorek, ne jako jeho práce.
Všechno je deterministické: náhoda jen z `random.Random(seed)`.
"""
from __future__ import annotations

import colorsys
import json
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from tools.fotky import nazev_varianty, prumerna_barva, srcset

# Kam se obrázky zapisují — čte se až uvnitř funkcí (testy monkeypatchují).
VEN = Path("out/ukazky")

# Šířky variant, vzestupně.
SIRKY = (520, 1040, 1600)

# Barevné tóny papíru — světlé, lišící se odstíny.
_TONY = (
    (0.09, 0.30, 0.86),   # teplá béžová
    (0.55, 0.22, 0.87),   # světle modrá
    (0.33, 0.25, 0.85),   # světle zelená
    (0.83, 0.28, 0.86),   # světle růžová
    (0.15, 0.24, 0.88),   # světle oranžová
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


def _plotna(zaklad: str, sirka: int, vyska: int, ton: tuple[int, int, int]) -> Image.Image:
    """Světlý podklad, tenký rám a čitelný popis, že jde o zástupnou fotografii."""
    img = Image.new("RGB", (sirka, vyska), ton)
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()

    # Tenký rám — dvojitý, aby to vypadalo jako rámovaný vzorek.
    mezera = max(12, sirka // 80)
    tloustka = max(2, sirka // 400)
    draw.rectangle(
        [mezera, mezera, sirka - mezera - 1, vyska - mezera - 1],
        outline=_TMAVY,
        width=tloustka,
    )
    vnit = mezera + tloustka * 3
    draw.rectangle(
        [vnit, vnit, sirka - vnit - 1, vyska - vnit - 1],
        outline=_TMAVY,
        width=max(1, tloustka // 2),
    )

    # Popis uprostřed.
    titul = f"UKÁZKOVÁ FOTOGRAFIE — {zaklad}"
    rozmery = f"zástupný snímek {sirka} × {vyska} px"
    try:
        t1 = draw.textbbox((0, 0), titul)
        t2 = draw.textbbox((0, 0), rozmery)
    except AttributeError:  # starší Pillow
        t1 = (0, 0, *draw.textsize(titul))
        t2 = (0, 0, *draw.textsize(rozmery))
    y1 = vyska // 2 - (t1[3] - t1[1])
    y2 = y1 + (t1[3] - t1[1]) + max(6, vyska // 60)
    draw.text(((sirka - (t1[2] - t1[0])) // 2, y1), titul, fill=_TMAVY, font=font)
    draw.text(((sirka - (t2[2] - t2[0])) // 2, y2), rozmery, fill=_TMAVY, font=font)
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
            obrazek = velka if sirka == nejvetsi else velka.resize((sirka, vyska))
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
    argv = list(argv) if argv else []
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
