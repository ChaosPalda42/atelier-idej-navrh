# -*- coding: utf-8 -*-
"""Z podkladu `podklady/logo/Logo.pdf` vytáhne značku jako čisté vektory.

V PDF od architekta jsou skutečné cesty, ne obrázek: kruh je tažený třikrát
(sytá oranžová silnější, světlejší oranžová tenčí a černý tenký přejezd),
logotyp „ateliér IDEJ" je sazba v Ebrimě a svislý nápis vpravo je „IDEJ"
v aurebeshu. Všechno se tu převede do souřadnic s osou y dolů, rozdělí na
skupiny (kruh / logotyp / aurebesh) a uloží do šablony.

Spuštění:  uv run python -m tools.znacka
Výstup:    src/templates/znacka-cesty.mjs
"""
from __future__ import annotations

import io
import json
import re
from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from pypdf import PdfReader

KOREN = Path(__file__).resolve().parents[1]
PDF = KOREN / "podklady" / "logo" / "Logo.pdf"
VEN = KOREN / "src" / "templates" / "znacka-cesty.mjs"

NENI_ZNACKA = (0.51041, 0.28355)   # rám artboardu a rohové ořezové značky
CISLO = re.compile(r"-?\d+\.?\d*")


# ------------------------------------------------------------ čtení PDF
def _nasob(m1, m2):
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return (a1 * a2 + b1 * c2, a1 * b2 + b1 * d2,
            c1 * a2 + d1 * c2, c1 * b2 + d1 * d2,
            e1 * a2 + f1 * c2 + e2, e1 * b2 + f1 * d2 + f2)


def _barva(a, b, c):
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(float(x) * 255))) for x in (a, b, c))


def nacti_pisma(zdroje):
    pisma = {}
    for jmeno, odkaz in zdroje["/Font"].get_object().items():
        f = odkaz.get_object()
        potomek = f["/DescendantFonts"].get_object()[0].get_object()
        data = potomek["/FontDescriptor"].get_object()["/FontFile2"].get_object().get_data()
        tt = TTFont(io.BytesIO(data))
        pisma[jmeno] = {"tt": tt, "upem": tt["head"].unitsPerEm,
                        "glyf": tt.getGlyphSet(), "poradi": tt.getGlyphOrder(),
                        "nazev": str(f.get("/BaseFont"))}
    return pisma


def _glyf(pismo, gid, velikost, matice):
    jmeno = pismo["poradi"][gid] if gid < len(pismo["poradi"]) else None
    if jmeno is None:
        return "", 0.0
    mer = velikost / pismo["upem"]
    pen = SVGPathPen(pismo["glyf"], ntos=lambda v: f"{v:.3f}")
    pismo["glyf"][jmeno].draw(TransformPen(pen, Transform(*matice).transform(Transform(mer, 0, 0, mer, 0, 0))))
    sirka = pismo["tt"]["hmtx"].metrics.get(jmeno, (0, 0))[0] / pismo["upem"] * velikost
    return pen.getCommands(), sirka


def prectiPdf(cesta: Path):
    stranka = PdfReader(str(cesta)).pages[0]
    obsah = stranka.get_contents().get_data().decode("latin-1")
    pisma = nacti_pisma(stranka["/Resources"])
    tokeny = re.findall(r"<[0-9A-Fa-f]*>|\S+", obsah)

    tahy, texty = [], []
    barva_tahu = barva_vypln = "#000000"
    sirka = 1.0
    cesta_kusy = []
    text_m = radek_m = (1, 0, 0, 1, 0, 0)
    pismo_akt, velikost_akt = None, 1.0

    for i, t in enumerate(tokeny):
        if t == "RG" and i >= 3:
            barva_tahu = _barva(tokeny[i - 3], tokeny[i - 2], tokeny[i - 1])
        elif t == "rg" and i >= 3:
            barva_vypln = _barva(tokeny[i - 3], tokeny[i - 2], tokeny[i - 1])
        elif t == "w" and i >= 1:
            sirka = float(tokeny[i - 1])
        elif t == "m" and i >= 2:
            cesta_kusy.append(f"M {float(tokeny[i-2]):.3f} {float(tokeny[i-1]):.3f}")
        elif t == "l" and i >= 2:
            cesta_kusy.append(f"L {float(tokeny[i-2]):.3f} {float(tokeny[i-1]):.3f}")
        elif t == "c" and i >= 6:
            cesta_kusy.append("C " + " ".join(f"{float(tokeny[i-6+k]):.3f}" for k in range(6)))
        elif t == "h":
            cesta_kusy.append("Z")
        elif t in ("S", "s"):
            if cesta_kusy:
                tahy.append({"d": " ".join(cesta_kusy), "barva": barva_tahu, "sirka": sirka})
            cesta_kusy = []
        elif t in ("f", "F", "f*", "n", "b", "B"):
            cesta_kusy = []
        elif t == "BT":
            text_m = radek_m = (1, 0, 0, 1, 0, 0)
        elif t == "Tf" and i >= 2:
            pismo_akt, velikost_akt = tokeny[i - 2], float(tokeny[i - 1])
        elif t == "Tm" and i >= 6:
            text_m = radek_m = tuple(float(tokeny[i - 6 + k]) for k in range(6))
        elif t == "Td" and i >= 2:
            radek_m = _nasob((1, 0, 0, 1, float(tokeny[i - 2]), float(tokeny[i - 1])), radek_m)
            text_m = radek_m
        elif t.startswith("<") and i + 1 < len(tokeny) and tokeny[i + 1] == "Tj":
            pismo = pisma.get(pismo_akt)
            if not pismo:
                continue
            hexa, posun, kusy = t[1:-1], 0.0, []
            for k in range(0, len(hexa), 4):
                d, sirka_glyfu = _glyf(pismo, int(hexa[k:k + 4], 16), velikost_akt,
                                       _nasob((1, 0, 0, 1, posun, 0), text_m))
                if d:
                    kusy.append(d)
                posun += sirka_glyfu
            if kusy:
                texty.append({"d": " ".join(kusy), "barva": barva_vypln, "pismo": pismo["nazev"]})
    return tahy, texty


# ------------------------------------------------------- úpravy souřadnic
def normalizuj(d: str) -> str:
    """Rozbalí zkratky H a V na L, aby v cestě byly jen souřadnicové dvojice.

    fontTools umí psát `H x` a `V y`; kdyby zůstaly, otočení osy y by počítalo
    znaménka obráceně od druhého takového příkazu dál.
    """
    kusy = re.findall(r"[A-Za-z]|-?\d+\.?\d*", d)
    ven, i, x, y = [], 0, 0.0, 0.0
    prikaz = "M"
    while i < len(kusy):
        if re.match(r"[A-Za-z]", kusy[i]):
            prikaz = kusy[i]
            i += 1
            if prikaz in ("Z", "z"):
                ven.append("Z")
            continue
        if prikaz in ("M", "L"):
            x, y = float(kusy[i]), float(kusy[i + 1]); i += 2
            ven.append(f"{prikaz} {x:.3f} {y:.3f}")
            if prikaz == "M":
                prikaz = "L"
        elif prikaz == "H":
            x = float(kusy[i]); i += 1
            ven.append(f"L {x:.3f} {y:.3f}")
        elif prikaz == "V":
            y = float(kusy[i]); i += 1
            ven.append(f"L {x:.3f} {y:.3f}")
        elif prikaz in ("C", "Q"):
            pocet = 6 if prikaz == "C" else 4
            hodnoty = [float(v) for v in kusy[i:i + pocet]]; i += pocet
            x, y = hodnoty[-2], hodnoty[-1]
            ven.append(prikaz + " " + " ".join(f"{v:.3f}" for v in hodnoty))
        else:
            raise ValueError(f"neznámý příkaz v cestě: {prikaz}")
    return " ".join(ven)


def otoc_y(d: str) -> str:
    """PDF má osu y nahoru, SVG dolů — otočí se znaménko každé druhé hodnoty."""
    cisla = CISLO.findall(d)
    i = [0]

    def nahrad(_):
        hodnota = float(cisla[i[0]])
        if i[0] % 2 == 1:
            hodnota = -hodnota
        i[0] += 1
        return f"{hodnota:.3f}"

    return CISLO.sub(nahrad, d)


def ramecek(cesty):
    xs, ys = [], []
    for d in cesty:
        cisla = [float(x) for x in CISLO.findall(d)]
        xs += cisla[0::2]
        ys += cisla[1::2]
    return min(xs), min(ys), max(xs), max(ys)


def posun(d: str, dx: float, dy: float) -> str:
    cisla = [float(x) for x in CISLO.findall(d)]
    i = [0]

    def nahrad(_):
        hodnota = cisla[i[0]] + (dx if i[0] % 2 == 0 else dy)
        i[0] += 1
        return f"{hodnota:.3f}"

    return CISLO.sub(nahrad, d)


def skupina(cesty, dx, dy):
    """Posune cesty o daný vektor a vrátí je i s vlastním rámečkem."""
    ven = [dict(c, d=posun(c["d"], dx, dy)) for c in cesty]
    x0, y0, x1, y1 = ramecek([c["d"] for c in ven])
    return {"cesty": ven, "box": [round(v, 2) for v in (x0, y0, x1 - x0, y1 - y0)]}


def main():
    tahy, texty = prectiPdf(PDF)
    tahy = [dict(t, d=otoc_y(t["d"])) for t in tahy
            if all(abs(t["sirka"] - w) > 1e-6 for w in NENI_ZNACKA)]
    texty = [dict(t, d=otoc_y(normalizuj(t["d"]))) for t in texty]

    logotyp = [t for t in texty if "Ebrima" in t["pismo"]]
    aurebesh = [t for t in texty if "Aurebesh" in t["pismo"]]

    # všechno zůstává v jedné soustavě, jen se posune do kladných čísel
    vse = tahy + logotyp + aurebesh
    x0, y0, _, _ = ramecek([c["d"] for c in vse])
    dx, dy = -x0 + 2, -y0 + 2

    k = skupina(tahy, dx, dy)
    l = skupina(logotyp, dx, dy)
    a = skupina(aurebesh, dx, dy)

    data = {
        "kruh": {"box": k["box"],
                 "tahy": [{"d": c["d"], "barva": c["barva"], "sirka": round(c["sirka"], 3)}
                          for c in k["cesty"]]},
        "logotyp": {"box": l["box"], "d": " ".join(c["d"] for c in l["cesty"]),
                    "barva": l["cesty"][0]["barva"]},
        "aurebesh": {"box": a["box"], "d": " ".join(c["d"] for c in a["cesty"]),
                     "barva": a["cesty"][0]["barva"]},
    }
    VEN.write_text(
        "/* Vytaženo z podklady/logo/Logo.pdf nástrojem tools/znacka.py — needituj ručně. */\n"
        "export const ZNACKA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8")
    print("kruh", data["kruh"]["box"], f'({len(data["kruh"]["tahy"])} tahů)',
          "| logotyp", data["logotyp"]["box"], data["logotyp"]["barva"],
          "| aurebesh", data["aurebesh"]["box"])


if __name__ == "__main__":
    main()
