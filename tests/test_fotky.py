"""Akceptační test C-007 — tools/fotky.py (příprava fotek)."""
from __future__ import annotations

import pytest
from PIL import Image

from tools import fotky


def test_konstanty():
    assert fotky.POMERY == {"siroky": (3, 2), "navysku": (2, 3), "ctverec": (1, 1)}
    assert fotky.SIRKY == (480, 960, 1600)


def test_orez_na_pomer():
    img = Image.new("RGB", (1200, 600), (255, 255, 255))
    assert fotky.orez_na_pomer(img, "siroky").size == (900, 600)
    assert fotky.orez_na_pomer(img, "ctverec").size == (600, 600)
    assert fotky.orez_na_pomer(img, "navysku").size == (400, 600)
    vysoky = Image.new("RGB", (600, 1200))
    assert fotky.orez_na_pomer(vysoky, "siroky").size == (600, 400)
    with pytest.raises(ValueError):
        fotky.orez_na_pomer(img, "kulaty")


def test_orez_je_stredovy():
    img = Image.new("RGB", (1200, 600), (255, 255, 255))
    for x in range(100):
        for y in range(600):
            img.putpixel((x, y), (255, 0, 0))
    orez = fotky.orez_na_pomer(img, "siroky")  # bere se x od 150 do 1050
    assert orez.getpixel((0, 0)) == (255, 255, 255), "červený levý okraj se měl oříznout"


def test_zmensi():
    img = Image.new("RGB", (1200, 600))
    assert fotky.zmensi(img, 600).size == (600, 300)
    assert fotky.zmensi(img, 2000).size == (1200, 600), "nikdy nezvětšovat"
    assert fotky.zmensi(img, 1200).size == (1200, 600)


def test_prumerna_barva():
    assert fotky.prumerna_barva(Image.new("RGB", (10, 10), (255, 0, 0))) == "#ff0000"
    assert fotky.prumerna_barva(Image.new("RGB", (4, 4), (18, 52, 86))) == "#123456"


def test_nazev_a_srcset():
    assert fotky.nazev_varianty("dum-nad-sadem", 480) == "dum-nad-sadem-480.jpg"
    assert fotky.srcset([{"soubor": "a-480.jpg", "sirka": 480},
                         {"soubor": "a-960.jpg", "sirka": 960}]) == "a-480.jpg 480w, a-960.jpg 960w"
    assert fotky.srcset([]) == ""


def test_zpracuj(tmp_path):
    zdroj = tmp_path / "foto.png"
    Image.new("RGB", (2000, 1000), (18, 52, 86)).save(zdroj)
    vystup = tmp_path / "out" / "fotky"

    v = fotky.zpracuj(str(zdroj), str(vystup), "dum", "siroky")

    assert v["zaklad"] == "dum" and v["pomer"] == "siroky"
    assert (v["sirka"], v["vyska"]) == (1500, 1000)
    assert v["barva"] == "#123456"
    assert [x["sirka"] for x in v["varianty"]] == [480, 960], "1600 je širší než ořez"
    assert [x["soubor"] for x in v["varianty"]] == ["dum-480.jpg", "dum-960.jpg"]
    assert v["srcset"] == "dum-480.jpg 480w, dum-960.jpg 960w"
    for varianta in v["varianty"]:
        soubor = vystup / varianta["soubor"]
        assert soubor.exists(), f"chybí {soubor}"
        with Image.open(soubor) as ulozeny:
            assert ulozeny.size[0] == varianta["sirka"]


def test_zpracuj_maly_obrazek(tmp_path):
    zdroj = tmp_path / "male.png"
    Image.new("RGB", (300, 300), (255, 255, 255)).save(zdroj)

    v = fotky.zpracuj(str(zdroj), str(tmp_path / "out"), "male", "ctverec")

    assert [x["sirka"] for x in v["varianty"]] == [300], "menší než nejmenší šířka -> vlastní šířka"
    assert (tmp_path / "out" / "male-300.jpg").exists()
