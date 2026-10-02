"""Akceptační test C-011 — src/lib/kresleni.mjs (kreslení od ruky)."""
from __future__ import annotations

import math

import pytest

from tests.jsmod import run_js


@pytest.fixture()
def js():
    def call(body, **args):
        return run_js("kresleni.mjs", body, args=args)

    return call


def _ocekavana_posloupnost(seed, kolik):
    z = seed * 7919 + 13
    ven = []
    for _ in range(kolik):
        z = (z * 1103515245 + 12345) % 2147483648
        ven.append(z / 2147483648)
    return ven


def test_nahodnik_je_deterministicky(js):
    hodnoty = js("""
        const a = m.nahodnik(1), b = m.nahodnik(1);
        out([[a(), a(), a()], [b(), b(), b()]]);
    """)
    assert hodnoty[0] == hodnoty[1], "stejný seed musí dát stejnou posloupnost"
    assert hodnoty[0] == pytest.approx(_ocekavana_posloupnost(1, 3))
    assert hodnoty[0][0] == pytest.approx(0.9718677424825728)
    assert all(0 <= v < 1 for v in hodnoty[0])


def test_nahodnik_jine_seedy(js):
    a, b = js("out([m.nahodnik(1)(), m.nahodnik(2)()]);")
    assert a != b


def test_rozhozeni_bez_rozhozeni(js):
    body = js("""
        out(m.rozhozeni([[0, 0], [32, 0]], () => 0.5, { krok: 16 }));
    """)
    assert body == [[0, 0], [16, 0], [32, 0]], "při nule se body trefí přesně na čáru"


def test_rozhozeni_posune_kolmo(js):
    body = js("""
        out(m.rozhozeni([[0, 0], [32, 0]], () => 1, { krok: 16, rozhod: 2 }));
    """)
    assert body[0] == pytest.approx([0, 0.7], abs=1e-9)
    assert body[1] == pytest.approx([16, 2.0], abs=1e-9), "uprostřed se ruka rozjede nejvíc"
    assert body[2][0] == pytest.approx(32)
    assert body[2][1] == pytest.approx(0.7, abs=1e-6)


def test_rozhozeni_pocet_bodu(js):
    assert js("out(m.rozhozeni([[0, 0], [48, 0]], () => 0.5, { krok: 16 }).length);") == 4
    assert js("out(m.rozhozeni([[0, 0], [5, 0]], () => 0.5, { krok: 16 }).length);") == 2, \
        "krátký úsek se dělí aspoň jednou"
    assert js("""
        out(m.rozhozeni([[0, 0], [16, 0], [16, 16]], () => 0.5, { krok: 16 }).length);
    """) == 3, "navazující úsek nezdvojuje společný bod"


def test_rozhozeni_zavrit(js):
    body = js("""
        out(m.rozhozeni([[0, 0], [16, 0], [16, 16]], () => 0.5, { krok: 16, zavrit: true }));
    """)
    assert body[0] == [0, 0]
    assert body[-1] == pytest.approx([0, 0], abs=1e-9), "uzavřená čára končí tam, kde začala"
    assert len(body) == 5


def test_rozhozeni_kratky_vstup(js):
    assert js("out(m.rozhozeni([[1, 2]], () => 0.5));") == [[1, 2]]
    assert js("out(m.rozhozeni([], () => 0.5));") == []


def test_rozhozeni_bere_nahodu_po_jednom(js):
    pocet = js("""
        let n = 0;
        const body = m.rozhozeni([[0, 0], [48, 0]], () => { n += 1; return 0.5; }, { krok: 16 });
        out([n, body.length]);
    """)
    assert pocet[0] == pocet[1], "na každý bod právě jedno zavolání"


def test_cesta(js):
    assert js("out(m.cesta([[0, 0], [1.26, 2.34]], 1));") == "M 0.0 0.0 L 1.3 2.3"
    assert js("out(m.cesta([[1.234, 5.678]], 2));") == "M 1.23 5.68"
    assert js("out(m.cesta([]));") == ""


def test_delka(js):
    assert js("out(m.delka([[0, 0], [3, 4]]));") == 5
    assert js("out(m.delka([[0, 0]]));") == 0
    assert js("out(m.delka([]));") == 0
