"""Akceptační test C-009 — tools/kontrola_webu.py (kontrola sestaveného webu)."""
from __future__ import annotations

from tools import kontrola_webu as K

STRANKA = """<!doctype html>
<html lang="cs"><head><title>Ateliér Idej</title></head>
<body>
  <a href="index.html">Domů</a>
  <a href='../prace/dum.html'>Dům</a>
  <a href="https://example.com">Ven</a>
  <a href="mailto:a@b.cz">Mail</a>
  <a href="#kontakt">Kotva</a>
  <img src="foto.jpg" alt="Dům nad sadem">
  <img
     src="chybi.jpg"
     alt="  ">
  <div id="prvni"></div><div id="prvni"></div>
</body></html>"""


def test_odkazy():
    assert K.odkazy('<a href="a.html">x</a> <a href=\'b.html\'>y</a>') == ["a.html", "b.html"]
    assert K.odkazy("<p>nic</p>") == []
    assert K.odkazy(STRANKA) == ["index.html", "../prace/dum.html", "https://example.com",
                                 "mailto:a@b.cz", "#kontakt"]


def test_obrazky():
    assert K.obrazky('<img src="a.jpg" alt="Popis"><img src="b.jpg">') == \
        [("a.jpg", "Popis"), ("b.jpg", None)]
    assert K.obrazky('<img alt="A" src="c.jpg" class="x">') == [("c.jpg", "A")]
    assert len(K.obrazky(STRANKA)) == 2


def test_identifikatory():
    assert K.identifikatory('<div id="a"></div><p id="b">x</p><span>y</span>') == ["a", "b"]
    assert K.identifikatory(STRANKA) == ["prvni", "prvni"]


def test_je_externi():
    for odkaz in ("https://a.cz", "http://a.cz", "//a.cz", "mailto:a@b.cz", "tel:+420", "data:x"):
        assert K.je_externi(odkaz) is True, odkaz
    for odkaz in ("index.html", "../a/b.html", "/styl.css", "#kotva"):
        assert K.je_externi(odkaz) is False, odkaz


def test_cil():
    assert K.cil("../index.html", "prace/dum.html") == "index.html"
    assert K.cil("foto.jpg", "prace/dum.html") == "prace/foto.jpg"
    assert K.cil("/a/b.css", "prace/dum.html") == "a/b.css"
    assert K.cil("x.html#kde", "index.html") == "x.html"
    assert K.cil("x.html?v=2", "index.html") == "x.html"


def test_nalezy_stranky():
    existuje = {"prace/index.html", "prace/foto.jpg"}.__contains__
    nalezy = K.nalezy_stranky(STRANKA, "prace/stranka.html", existuje)
    assert [(n["typ"], n["detail"]) for n in nalezy] == [
        ("chybi-cil", "../prace/dum.html"),
        ("chybi-obrazek", "chybi.jpg"),
        ("chybi-alt", "chybi.jpg"),
        ("duplicitni-id", "prvni"),
    ]
    assert all(n["soubor"] == "prace/stranka.html" for n in nalezy)


def test_chybi_titulek():
    nalezy = K.nalezy_stranky("<html><head></head><body></body></html>", "a.html", lambda c: True)
    assert nalezy == [{"soubor": "a.html", "typ": "chybi-titulek", "detail": ""}]
    assert K.nalezy_stranky("<title>  </title>", "a.html", lambda c: True)[0]["typ"] == "chybi-titulek"


def test_bez_alt_atributu():
    nalezy = K.nalezy_stranky('<title>A</title><img src="a.jpg">', "i.html", lambda c: True)
    assert [n["typ"] for n in nalezy] == ["chybi-alt"]


def test_zkontroluj_cely_web(tmp_path):
    (tmp_path / "prace").mkdir()
    (tmp_path / "index.html").write_text(
        '<title>Domů</title><a href="prace/dum.html">Dům</a><img src="a.jpg" alt="A">',
        encoding="utf-8")
    (tmp_path / "prace" / "dum.html").write_text(
        '<title>Dům</title><a href="../index.html">Zpět</a>', encoding="utf-8")
    (tmp_path / "a.jpg").write_bytes(b"x")

    assert K.zkontroluj(str(tmp_path)) == []

    (tmp_path / "prace" / "spatna.html").write_text(
        '<title>Š</title><a href="nikam.html">Nikam</a>', encoding="utf-8")
    nalezy = K.zkontroluj(str(tmp_path))
    assert [(n["soubor"], n["typ"]) for n in nalezy] == [("prace/spatna.html", "chybi-cil")]


def test_main(tmp_path, capsys):
    (tmp_path / "index.html").write_text("<title>A</title>", encoding="utf-8")
    assert K.main([str(tmp_path)]) == 0
    assert "Web je v pořádku." in capsys.readouterr().out

    (tmp_path / "zla.html").write_text('<title>B</title><img src="x.jpg">', encoding="utf-8")
    assert K.main([str(tmp_path)]) == 1
    vypis = capsys.readouterr().out
    assert "zla.html" in vypis and "chybi-alt" in vypis
