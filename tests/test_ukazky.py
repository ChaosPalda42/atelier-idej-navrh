"""Akceptační test C-013 — tools/ukazky.py (zástupné fotografie projektů)."""
from __future__ import annotations

import json

import pytest
from PIL import Image

from tools import ukazky


@pytest.fixture()
def ven(tmp_path, monkeypatch):
    cil = tmp_path / "obrazky"
    monkeypatch.setattr(ukazky, "VEN", cil)
    return cil


def test_vyrobi_zadany_pocet(ven):
    seznam = ukazky.vyrob(3)
    assert len(seznam) == 3
    assert [s["zaklad"] for s in seznam] == ["ukazka-01", "ukazka-02", "ukazka-03"]


def test_tvar_zaznamu(ven):
    zaznam = ukazky.vyrob(1)[0]
    assert set(zaznam) >= {"zaklad", "popis", "sirka", "vyska", "barva", "varianty", "srcset"}
    assert zaznam["sirka"] / zaznam["vyska"] == pytest.approx(3 / 2, abs=0.01)
    assert zaznam["barva"].startswith("#") and len(zaznam["barva"]) == 7
    assert "ukázk" in zaznam["popis"].lower()


def test_varianty_sedi_na_soubory(ven):
    for zaznam in ukazky.vyrob(2):
        assert [v["sirka"] for v in zaznam["varianty"]] == sorted(v["sirka"] for v in zaznam["varianty"])
        for varianta in zaznam["varianty"]:
            cesta = ven / varianta["soubor"]
            assert cesta.exists(), f"chybí {varianta['soubor']}"
            with Image.open(cesta) as im:
                assert im.width == varianta["sirka"]
                assert im.height == round(varianta["sirka"] * 2 / 3)
            assert f"{varianta['soubor']} {varianta['sirka']}w" in zaznam["srcset"]


def test_obrazek_neni_prazdny(ven):
    """Na plotně musí být rám i popis — jinak nikdo nepozná, že je zástupná."""
    zaznam = ukazky.vyrob(1)[0]
    cesta = ven / zaznam["varianty"][-1]["soubor"]
    with Image.open(cesta) as im:
        sede = im.convert("L")
    histogram = sede.histogram()
    tmave = sum(histogram[:110])
    assert tmave > 200, "plotna vypadá prázdná"
    assert sum(histogram[110:]) > tmave, "plotna má být světlá, ne tmavá"


def test_determinismus(ven, tmp_path, monkeypatch):
    prvni = (ven / ukazky.vyrob(2)[1]["varianty"][0]["soubor"]).read_bytes()
    druhy_cil = tmp_path / "podruhe"
    monkeypatch.setattr(ukazky, "VEN", druhy_cil)
    druhy = (druhy_cil / ukazky.vyrob(2)[1]["varianty"][0]["soubor"]).read_bytes()
    assert prvni == druhy


def test_plotny_se_lisi(ven):
    """Čtyři stejné šedé obdélníky vypadají jako chyba, ne jako ukázka."""
    seznam = ukazky.vyrob(4)
    barvy = {s["barva"] for s in seznam}
    assert len(barvy) > 1


def test_nula_je_prazdny_seznam(ven):
    assert ukazky.vyrob(0) == []


def test_main_zapise_manifest(ven, capsys):
    assert ukazky.main(["2"]) == 0
    manifest = json.loads((ven / "ukazky.json").read_text(encoding="utf-8"))
    assert len(manifest) == 2
