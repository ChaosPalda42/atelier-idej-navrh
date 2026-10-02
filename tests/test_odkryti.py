"""Akceptační test C-002 — src/lib/odkryti.mjs (co je ve výřezu)."""
from __future__ import annotations

import pytest

from tests.jsmod import run_js

RAMEC = {"vrchol": 1000, "vyska": 800}
PRVKY = [
    {"id": "a", "vrchol": 0, "vyska": 1000},
    {"id": "b", "vrchol": 1000, "vyska": 400},
    {"id": "c", "vrchol": 1700, "vyska": 400},
    {"id": "d", "vrchol": 1750, "vyska": 100},
    {"id": "e", "vrchol": 3000, "vyska": 100},
]


@pytest.fixture()
def js():
    def call(body, **args):
        return run_js("odkryti.mjs", body, args={"r": RAMEC, "p": PRVKY, **args})

    return call


def test_prunik(js):
    assert js('out(m.prunik({vrchol: 0, vyska: 10}, {vrchol: 5, vyska: 10}));') == 5
    assert js('out(m.prunik({vrchol: 0, vyska: 10}, {vrchol: 20, vyska: 10}));') == 0
    assert js('out(m.prunik({vrchol: 0, vyska: 10}, {vrchol: 10, vyska: 10}));') == 0
    assert js('out(m.prunik({vrchol: 0, vyska: 100}, {vrchol: 10, vyska: 10}));') == 10
    assert js('out(m.prunik({vrchol: 0, vyska: -5}, {vrchol: 0, vyska: 10}));') == 0


def test_viditelnost(js):
    assert js("out(m.viditelnost(A.r, A.p[1]));") == 1
    assert js("out(m.viditelnost(A.r, A.p[2]));") == 0.25
    assert js("out(m.viditelnost(A.r, A.p[3]));") == 0.5
    assert js("out(m.viditelnost(A.r, A.p[4]));") == 0
    assert js('out(m.viditelnost(A.r, {vrchol: 1000, vyska: 0}));') == 0


def test_minulo(js):
    assert js("out(m.minulo(A.r, A.p[0]));") is True
    assert js('out(m.minulo(A.r, {vrchol: 0, vyska: 1001}));') is False
    assert js("out(m.minulo(A.r, A.p[1]));") is False


def test_podil_vyrezu(js):
    assert js("out(m.podilVyrezu(A.r, A.p[1]));") == 0.5      # 400 z 800
    assert js("out(m.podilVyrezu(A.r, A.p[2]));") == 0.125    # 100 z 800
    assert js("out(m.podilVyrezu(A.r, A.p[4]));") == 0
    assert js('out(m.podilVyrezu({vrchol: 0, vyska: 0}, A.p[1]));') == 0
    assert js('out(m.podilVyrezu(A.r, {vrchol: 0, vyska: 6000}));') == 1


def test_k_spusteni_vysoky_prvek(js):
    """Prvek vyšší než pár obrazovek vyplní výřez, ale sám je vidět jen z malé části."""
    vysoky = {"id": "dlouha", "vrchol": 1000, "vyska": 6000}
    assert js("out(m.viditelnost(A.r, A.v));", v=vysoky) == 0.1333
    assert js("out(m.kSpusteni([A.v], A.r, [], 0.18));", v=vysoky) == ["dlouha"], \
        "vysoká sekce se musí spustit, i když je vidět jen její osmina"
    nad = {"id": "nad", "vrchol": 2000, "vyska": 6000}
    assert js("out(m.kSpusteni([A.n], A.r, [], 0.18));", n=nad) == [], \
        "co je celé pod výřezem, se nespouští"


def test_k_spusteni(js):
    assert js("out(m.kSpusteni(A.p, A.r, []));") == ["b", "d"]
    assert js('out(m.kSpusteni(A.p, A.r, ["b"]));') == ["d"]
    assert js('out(m.kSpusteni(A.p, A.r, new Set(["b", "d"])));') == []
    assert js("out(m.kSpusteni(A.p, A.r, [], 0.2));") == ["b", "c", "d"]
    assert js("out(m.kSpusteni([], A.r, []));") == []


def test_dopsat(js):
    assert js("out(m.dopsat(A.p, A.r, []));") == ["a"]
    assert js('out(m.dopsat(A.p, A.r, ["a"]));') == []
    assert js('out(m.dopsat(A.p, {vrchol: 5000, vyska: 800}, []));') == ["a", "b", "c", "d", "e"]


def test_postup(js):
    assert js('out(m.postup({vrchol: 0, vyska: 800}, 2800));') == 0
    assert js('out(m.postup({vrchol: 1000, vyska: 800}, 2800));') == 0.5
    assert js('out(m.postup({vrchol: 5000, vyska: 800}, 2800));') == 1
    assert js('out(m.postup({vrchol: 0, vyska: 800}, 500));') == 1


def test_vstupy_se_nemeni(js):
    assert js("""
        const kopie = JSON.stringify(A.p);
        m.kSpusteni(A.p, A.r, []);
        m.dopsat(A.p, A.r, []);
        out(JSON.stringify(A.p) === kopie);
    """) is True
