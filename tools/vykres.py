# -*- coding: utf-8 -*-
"""Z výkresu udělá podklad pro kresbu na webu.

Revit se na Macu neotevře, ale jeho **exporty** ano:
  * PDF  — cokoliv, co jde z Revitu vytisknout do PDF (půdorys, řez, pohled)
  * DXF  — Revit → Export → CAD Formats → DXF

Z obojího se vytáhnou čáry, zjednoduší se, vmestnají do rámečku a uloží jako
`data/kresby/<nazev>.json`. Web je pak kreslí stejnou rukou jako všechno ostatní
(`src/lib/kresleni.mjs`), takže skutečná stavba vypadá jako skica v bloku.

Použití:
    uv run python -m tools.vykres podklady/vykresy/pudorys.pdf dum-pudorys
    uv run python -m tools.vykres podklady/vykresy/rez.dxf dum-rez --sirka 760 --vyska 300
    uv run python -m tools.vykres ... --slabe "OSNOVA,KOTY" --max-car 180
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

from tools import geometrie as G

KOREN = Path(__file__).resolve().parents[1]
VEN = KOREN / "data" / "kresby"

CISLO = re.compile(r"-?\d+\.?\d*")


# ----------------------------------------------------------------- PDF
def _nasob(m1, m2):
    a1, b1, c1, d1, e1, f1 = m1
    a2, b2, c2, d2, e2, f2 = m2
    return (a1 * a2 + b1 * c2, a1 * b2 + b1 * d2,
            c1 * a2 + d1 * c2, c1 * b2 + d1 * d2,
            e1 * a2 + f1 * c2 + e2, e1 * b2 + f1 * d2 + f2)


def _bod(m, x, y):
    a, b, c, d, e, f = m
    return (a * x + c * y + e, b * x + d * y + f)


def _bezier(p0, p1, p2, p3, dilu=8):
    ven = []
    for i in range(1, dilu + 1):
        t = i / dilu
        u = 1 - t
        ven.append((
            u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
            u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
        ))
    return ven


def z_pdf(cesta: Path, stranka: int = 0, tenka: float = 0.6):
    """Vrátí (silné čáry, slabé čáry) v souřadnicích PDF (y nahoru)."""
    from pypdf import PdfReader

    strana = PdfReader(str(cesta)).pages[stranka]
    obsah = strana.get_contents().get_data().decode("latin-1")
    tokeny = re.findall(r"<[0-9A-Fa-f]*>|\S+", obsah)

    silne, slabe = [], []
    ctm = (1, 0, 0, 1, 0, 0)
    zasobnik = []
    sirka_cary = 1.0
    cesta_body: list[list[tuple[float, float]]] = []

    def c(i):
        return float(tokeny[i])

    for i, t in enumerate(tokeny):
        try:
            if t == "q":
                zasobnik.append((ctm, sirka_cary))
            elif t == "Q" and zasobnik:
                ctm, sirka_cary = zasobnik.pop()
            elif t == "cm" and i >= 6:
                ctm = _nasob(tuple(c(i - 6 + k) for k in range(6)), ctm)
            elif t == "w" and i >= 1:
                sirka_cary = c(i - 1)
            elif t == "m" and i >= 2:
                cesta_body.append([_bod(ctm, c(i - 2), c(i - 1))])
            elif t == "l" and i >= 2 and cesta_body:
                cesta_body[-1].append(_bod(ctm, c(i - 2), c(i - 1)))
            elif t == "c" and i >= 6 and cesta_body:
                p0 = cesta_body[-1][-1]
                p1 = _bod(ctm, c(i - 6), c(i - 5))
                p2 = _bod(ctm, c(i - 4), c(i - 3))
                p3 = _bod(ctm, c(i - 2), c(i - 1))
                cesta_body[-1].extend(_bezier(p0, p1, p2, p3))
            elif t in ("v", "y") and i >= 4 and cesta_body:
                p0 = cesta_body[-1][-1]
                a = _bod(ctm, c(i - 4), c(i - 3))
                b = _bod(ctm, c(i - 2), c(i - 1))
                cesta_body[-1].extend(_bezier(p0, p0 if t == "v" else a, a if t == "v" else b, b))
            elif t == "re" and i >= 4:
                x, y, w, h = c(i - 4), c(i - 3), c(i - 2), c(i - 1)
                rohy = [(x, y), (x + w, y), (x + w, y + h), (x, y + h), (x, y)]
                cesta_body.append([_bod(ctm, *r) for r in rohy])
            elif t == "h" and cesta_body and len(cesta_body[-1]) > 2:
                cesta_body[-1].append(cesta_body[-1][0])
            elif t in ("S", "s", "B", "B*", "b", "b*"):
                mer = math.hypot(ctm[0], ctm[1]) or 1.0
                kam = silne if sirka_cary * mer >= tenka else slabe
                kam.extend([c for c in cesta_body if len(c) > 1])
                cesta_body = []
            elif t in ("f", "F", "f*", "n", "W", "W*"):
                if t in ("f", "F", "f*", "n"):
                    cesta_body = []
        except (ValueError, IndexError):
            continue
    return silne, slabe


# ----------------------------------------------------------------- DXF
def z_dxf(cesta: Path, slabe_vrstvy: set[str] | None = None, presnost: float = 0.4):
    """Vrátí (silné čáry, slabé čáry) ze všech kreslicích entit v modelu."""
    import ezdxf
    from ezdxf import path as ezpath
    from ezdxf.disassemble import recursive_decompose

    doc = ezdxf.readfile(str(cesta))
    slabe_vrstvy = {v.upper() for v in (slabe_vrstvy or set())}
    silne, slabe = [], []

    for entita in recursive_decompose(doc.modelspace()):
        try:
            cesty = ezpath.make_path(entita)
        except Exception:
            continue
        vrstva = str(getattr(entita.dxf, "layer", "")).upper()
        tenka = vrstva in slabe_vrstvy or getattr(entita.dxf, "lineweight", 0) in (5, 9, 13)
        for kus in (cesty.sub_paths() or [cesty]):
            body = [(round(v.x, 4), round(v.y, 4)) for v in kus.flattening(distance=presnost)]
            if len(body) > 1:
                (slabe if tenka else silne).append(body)
    return silne, slabe


# ------------------------------------------------------------- zpracování
def vycisti(cary, *, tolerance=0.6, nejkratsi=2.0, mezera=0.4, max_car=0):
    """Z hrubé změti čar udělá to, co se dá nakreslit rukou (bez měřítka)."""
    cary = [[(float(x), float(y)) for x, y in c] for c in cary if len(c) > 1]
    if not cary:
        return []
    cary = G.spoj(cary, mezera)
    cary = [G.zjednodus(c, tolerance) for c in cary]
    cary = G.zahod_kratke(cary, nejkratsi)
    if max_car and len(cary) > max_car:
        cary = sorted(cary, key=G.delka, reverse=True)[:max_car]
    return cary


def uloz(nazev: str, silne, slabe, sirka: int, vyska: int, popis: str = "") -> Path:
    VEN.mkdir(parents=True, exist_ok=True)
    soubor = VEN / f"{nazev}.json"
    soubor.write_text(json.dumps({
        "popis": popis or nazev,
        "sirka": sirka,
        "vyska": vyska,
        "silne": silne,
        "slabe": slabe,
    }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return soubor


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="Výkres (PDF/DXF) -> podklad pro kresbu na webu")
    p.add_argument("soubor")
    p.add_argument("nazev", help="jméno výstupu v data/kresby/")
    p.add_argument("--sirka", type=int, default=460)
    p.add_argument("--vyska", type=int, default=300)
    p.add_argument("--stranka", type=int, default=0, help="jen u PDF")
    p.add_argument("--slabe", default="", help="čárkami oddělené vrstvy, které jsou jen pomocné (DXF)")
    p.add_argument("--tolerance", type=float, default=0.6, help="jak moc se smí čára zjednodušit")
    p.add_argument("--nejkratsi", type=float, default=2.0, help="kratší čáry se zahodí")
    p.add_argument("--max-car", type=int, default=0, help="nechat jen N nejdelších čar")
    p.add_argument("--popis", default="")
    a = p.parse_args(argv)

    zdroj = Path(a.soubor)
    if not zdroj.exists():
        print(f"soubor neexistuje: {zdroj}", file=sys.stderr)
        return 2

    if zdroj.suffix.lower() == ".pdf":
        silne, slabe = z_pdf(zdroj, a.stranka)
    elif zdroj.suffix.lower() in (".dxf", ".dwg"):
        if zdroj.suffix.lower() == ".dwg":
            print("DWG neumím přečíst — v Revitu exportujte DXF.", file=sys.stderr)
            return 2
        silne, slabe = z_dxf(zdroj, {v.strip() for v in a.slabe.split(",") if v.strip()})
    else:
        print(f"neznámý formát: {zdroj.suffix}", file=sys.stderr)
        return 2

    # uklidí se každá skupina zvlášť, ale do rámečku se vmestnají SPOLEČNĚ,
    # jinak by se slabé čáry rozešly se silnými
    silne = vycisti(silne, tolerance=a.tolerance, nejkratsi=a.nejkratsi, max_car=a.max_car)
    slabe = vycisti(slabe, tolerance=a.tolerance, nejkratsi=a.nejkratsi,
                    max_car=a.max_car // 2 if a.max_car else 0)
    vse = G.vmestnej(silne + slabe, a.sirka, a.vyska, okraj=6.0, obratit_y=True)
    hotove_silne, hotove_slabe = vse[:len(silne)], vse[len(silne):]

    soubor = uloz(a.nazev, hotove_silne, hotove_slabe, a.sirka, a.vyska, a.popis)
    body = sum(len(c) for c in hotove_silne + hotove_slabe)
    print(f"{soubor.relative_to(KOREN)}: {len(hotove_silne)} silných + "
          f"{len(hotove_slabe)} slabých čar, {body} bodů")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
