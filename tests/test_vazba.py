"""Akceptační test C-012 — src/lib/vazba.mjs (rozmístění kroužků vazby)."""
from __future__ import annotations

import pytest

from tests.jsmod import run_js


@pytest.fixture()
def js():
    def call(body, **args):
        return run_js("vazba.mjs", body, args=args)

    return call


def test_prazdny_list(js):
    """Na list užší než dva okraje se kroužek nevejde."""
    assert js("out(m.krouzky(0));") == []
    assert js("out(m.krouzky(-10));") == []
    assert js("out(m.krouzky(59, { okraj: 30 }));") == []
    assert js('out(m.krouzky("sto"));') == []


def test_jeden_krouzek_doprostred(js):
    """Přesně na dva okraje vyjde jediný kroužek, a ten patří doprostřed."""
    k = js("out(m.krouzky(60, { okraj: 30 }));")
    assert len(k) == 1
    assert k[0]["x"] == pytest.approx(30.0)


def test_pocet_podle_rozestupu(js):
    """Mezera mezi sousedy nesmí přerůst zadaný rozestup."""
    for sirka, rozestup, okraj in ((1180, 56, 30), (600, 56, 30), (900, 40, 24), (321, 56, 30)):
        k = js("out(m.krouzky(A.s, { rozestup: A.r, okraj: A.o }));", s=sirka, r=rozestup, o=okraj)
        assert len(k) >= 2
        mezery = [k[i + 1]["x"] - k[i]["x"] for i in range(len(k) - 1)]
        assert max(mezery) <= rozestup + 1e-9
        # a zároveň se nemá drobit víc, než je nutné
        assert min(mezery) > rozestup / 2


def test_rada_vyplni_sirku(js):
    """První a poslední kroužek sedí přesně na okraji, řada je vzestupná."""
    k = js("out(m.krouzky(1180, { rozestup: 56, okraj: 30 }));")
    assert k[0]["x"] == pytest.approx(30.0)
    assert k[-1]["x"] == pytest.approx(1150.0)
    assert all(k[i + 1]["x"] > k[i]["x"] for i in range(len(k) - 1))
    mezery = [k[i + 1]["x"] - k[i]["x"] for i in range(len(k) - 1)]
    assert max(mezery) - min(mezery) < 1e-9        # rozestup je po celé řadě stejný


def test_rozsahy_rozhozeni(js):
    """Náklon, lesk i stín se smí lišit jen v mezích — vazba není rozsypaná."""
    k = js("out(m.krouzky(1180, { naklonMax: 1.6 }));")
    assert all(-1.6 <= x["naklon"] <= 1.6 for x in k)
    assert all(0.3 <= x["lesk"] <= 0.7 for x in k)
    assert all(0.8 <= x["stin"] <= 1.2 for x in k)
    k2 = js("out(m.krouzky(1180, { naklonMax: 0 }));")
    assert all(x["naklon"] == 0 for x in k2)


def test_rozhozeni_neni_konstantni(js):
    """Kroužky se mají lišit mezi sebou — jinak je to tapeta, ne drát."""
    k = js("out(m.krouzky(1180));")
    assert len({round(x["naklon"], 6) for x in k}) > 1
    assert len({round(x["lesk"], 6) for x in k}) > 1


def test_determinismus(js):
    """Stejné zadání musí dát stejnou vazbu — sestavení webu je opakovatelné."""
    a = js("out(m.krouzky(1180, { seed: 7 }));")
    b = js("out(m.krouzky(1180, { seed: 7 }));")
    assert a == b
    c = js("out(m.krouzky(1180, { seed: 8 }));")
    assert [x["x"] for x in c] == [x["x"] for x in a]      # poloha na seedu nezávisí
    assert [x["naklon"] for x in c] != [x["naklon"] for x in a]


def test_vychozi_hodnoty(js):
    """Volání bez nastavení musí projít a dát použitelnou řadu."""
    k = js("out(m.krouzky(1180));")
    assert len(k) >= 10
    assert set(k[0]) == {"x", "naklon", "lesk", "stin"}
