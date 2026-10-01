"""Akceptační test C-008 — tools/skica.py (fotka -> linková skica)."""
from __future__ import annotations

from PIL import Image

from tools import skica as S


def _s_obdelnikem() -> Image.Image:
    img = Image.new("RGB", (200, 200), (255, 255, 255))
    for x in range(60, 140):
        for y in range(60, 140):
            img.putpixel((x, y), (0, 0, 0))
    return img


def test_sede():
    out = S.sede(Image.new("RGB", (10, 10), (255, 0, 0)))
    assert out.mode == "L" and out.size == (10, 10)


def test_rozdil_rozmazani_na_jednolitem():
    out = S.rozdil_rozmazani(S.sede(Image.new("RGB", (40, 40), (120, 120, 120))), 1.6)
    assert out.mode == "L"
    assert max(out.getdata()) == 0, "bez hran není co odečítat"


def test_skica_jednolita_je_bila():
    out = S.skica(Image.new("RGB", (60, 60), (120, 120, 120)))
    assert out.mode == "L" and out.size == (60, 60)
    assert min(out.getdata()) == 255, "jednolitá plocha -> čistě bílá skica"
    assert S.hustota(out) == 0.0


def test_skica_kresli_hrany():
    out = S.skica(_s_obdelnikem())
    assert out.getpixel((5, 5)) == 255, "roh daleko od hrany zůstane bílý"
    assert out.getpixel((100, 100)) == 255, "plocha uvnitř obdélníku není hrana"
    u_hrany = [out.getpixel((x, 100)) for x in range(55, 66)]
    assert min(u_hrany) < 128, f"podél hrany má být tmavý pixel, bylo {u_hrany}"


def test_hustota():
    out = S.skica(_s_obdelnikem())
    h = S.hustota(out)
    assert 0.0 < h < 1.0
    assert h == round(h, 4)
    assert S.hustota(S.skica(_s_obdelnikem(), prah=60)) <= S.hustota(S.skica(_s_obdelnikem(), prah=5))


def test_uloz_skicu(tmp_path):
    zdroj = tmp_path / "foto.png"
    _s_obdelnikem().save(zdroj)
    vystup = tmp_path / "out" / "skici"

    v = S.uloz_skicu(str(zdroj), str(vystup))

    assert v["sirka"] == 200 and v["vyska"] == 200
    assert 0.0 < v["hustota"] < 1.0
    soubor = vystup / v["soubor"]
    assert soubor.exists()
    with Image.open(soubor) as ulozena:
        assert ulozena.mode == "L" and ulozena.size == (200, 200)


def test_uloz_skicu_jmeno(tmp_path):
    zdroj = tmp_path / "dum.jpg"
    _s_obdelnikem().save(zdroj)
    assert S.uloz_skicu(str(zdroj), str(tmp_path / "out"))["soubor"] == "dum.png"
