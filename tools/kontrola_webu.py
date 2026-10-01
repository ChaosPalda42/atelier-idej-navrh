"""Kontrola sestaveného webu (C-009).

Jen standardní knihovna; modul jde importovat bez vedlejších účinků.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

_ZNACKA = re.compile(r"<([a-zA-Z][a-zA-Z0-9-]*)((?:[^>\"']|\"[^\"]*\"|'[^']*')*)>", re.I)
_HREF = re.compile(r"""href\s*=\s*(?:"([^"]*)"|'([^']*)')""", re.I)
_SRC = re.compile(r"""src\s*=\s*(?:"([^"]*)"|'([^']*)')""", re.I)
_ALT = re.compile(r"""alt\s*=\s*(?:"([^"]*)"|'([^']*)')""", re.I)
_TITLE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)

_EXTERNI_PREFIXY = ("http://", "https://", "mailto:", "tel:", "//", "data:")


def _atribut(tag: str, regex: re.Pattern) -> str | None:
    m = regex.search(tag)
    if not m:
        return None
    return m.group(1) if m.group(1) is not None else m.group(2)


def odkazy(text: str) -> list[str]:
    """Hodnoty href ze všech <a …> v pořadí výskytu."""
    vysledek: list[str] = []
    for m in re.finditer(r"<a\b[^>]*>", text, re.I):
        hodnota = _atribut(m.group(0), _HREF)
        if hodnota is not None:
            vysledek.append(hodnota)
    return vysledek


def obrazky(text: str) -> list[tuple[str, str | None]]:
    """Pro každý <img …>: (src, alt); alt je None, když atribut není."""
    vysledek: list[tuple[str, str | None]] = []
    for m in re.finditer(r"<img\b[^>]*>", text, re.I):
        tag = m.group(0)
        src = _atribut(tag, _SRC)
        alt = _atribut(tag, _ALT)
        vysledek.append((src or "", alt))
    return vysledek


def identifikatory(text: str) -> list[str]:
    """Hodnoty atributu id ze všech značek, v pořadí výskytu."""
    vysledek: list[str] = []
    for m in _ZNACKA.finditer(text):
        hodnota = _atribut(m.group(2), re.compile(r"""id\s*=\s*(?:"([^"]*)"|'([^']*)')""", re.I))
        if hodnota is not None:
            vysledek.append(hodnota)
    return vysledek


def je_externi(odkaz: str) -> bool:
    """True pro http://, https://, mailto:, tel:, // a data:."""
    return odkaz.startswith(_EXTERNI_PREFIXY)


def cil(odkaz: str, soubor: str) -> str:
    """Cesta od kořene webu pro odkaz na stránce `soubor`."""
    odkaz = odkaz.split("#", 1)[0].split("?", 1)[0]
    if not odkaz:
        return ""
    if odkaz.startswith("/"):
        casti = odkaz[1:].split("/")
    else:
        adresar = soubor.rsplit("/", 1)[0] if "/" in soubor else ""
        zaklady = adresar.split("/") if adresar else []
        casti = zaklady + odkaz.split("/")
    vysledek: list[str] = []
    for cast in casti:
        if cast in ("", "."):
            continue
        if cast == "..":
            if vysledek:
                vysledek.pop()
        else:
            vysledek.append(cast)
    return "/".join(vysledek)


def nalezy_stranky(text: str, soubor: str, existuje) -> list[dict]:
    """Nálezy pro jednu stránku; existuje(cesta od kořene) -> bool."""
    nalezy: list[dict] = []

    titulek = _TITLE.search(text)
    if not titulek or not titulek.group(1).strip():
        nalezy.append({"soubor": soubor, "typ": "chybi-titulek", "detail": ""})

    for odkaz in odkazy(text):
        if not odkaz or odkaz.startswith("#") or je_externi(odkaz):
            continue
        if not existuje(cil(odkaz, soubor)):
            nalezy.append({"soubor": soubor, "typ": "chybi-cil", "detail": odkaz})

    for src, _alt in obrazky(text):
        if src and not je_externi(src) and not existuje(cil(src, soubor)):
            nalezy.append({"soubor": soubor, "typ": "chybi-obrazek", "detail": src})

    for src, alt in obrazky(text):
        if alt is None or not alt.strip():
            nalezy.append({"soubor": soubor, "typ": "chybi-alt", "detail": src})

    videne: set[str] = set()
    for ident in identifikatory(text):
        if ident in videne:
            nalezy.append({"soubor": soubor, "typ": "duplicitni-id", "detail": ident})
        else:
            videne.add(ident)

    return nalezy


def zkontroluj(koren) -> list[dict]:
    """Projde všechny *.html pod `koren` (rekurzivně, seřazeně) a složí nálezy."""
    koren = Path(koren)
    nalezy: list[dict] = []
    for cesta in sorted(koren.rglob("*.html")):
        relativni = cesta.relative_to(koren).as_posix()
        existuje = lambda c: (koren / c).exists()
        nalezy.extend(nalezy_stranky(cesta.read_text(encoding="utf-8"), relativni, existuje))
    return nalezy


def main(argv=None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    koren = argv[0] if argv else "out"
    nalezy = zkontroluj(koren)
    if nalezy:
        for n in nalezy:
            print(f"{n['soubor']}: {n['typ']} {n['detail']}")
        return 1
    print("Web je v pořádku.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
