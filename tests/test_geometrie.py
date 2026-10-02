"""Akceptační test C-010 — tools/geometrie.py (geometrie pro převod výkresů)."""
from __future__ import annotations

import math

from tools import geometrie as G


def test_delka():
    assert G.delka([(0, 0), (3, 4)]) == 5.0
    assert G.delka([(0, 0), (3, 4), (3, 0)]) == 9.0
    assert G.delka([(0, 0)]) == 0.0
    assert G.delka([]) == 0.0


def test_ramecek():
    assert G.ramecek([[(0, 0), (3, 4)], [(-1, 2)]]) == (-1.0, 0.0, 3.0, 4.0)
    assert G.ramecek([]) == (0.0, 0.0, 0.0, 0.0)
    assert G.ramecek([[]]) == (0.0, 0.0, 0.0, 0.0)


def test_zjednodus():
    cara = [(0, 0), (1, 0.05), (2, 0), (3, 0)]
    assert G.zjednodus(cara, 0.1) == [(0, 0), (3, 0)]
    assert len(G.zjednodus(cara, 0.01)) == 4, "malá tolerance nemá co zahodit"
    assert G.zjednodus(cara, 0) == cara
    assert G.zjednodus([(0, 0), (1, 1)], 5) == [(0, 0), (1, 1)]
    assert G.zjednodus([], 1) == []
    puvodni = [(0, 0), (1, 0.05), (2, 0), (3, 0)]
    G.zjednodus(puvodni, 0.1)
    assert puvodni == cara, "vstup se nesmí měnit"


def test_zjednodus_zachova_tvar():
    # pravý úhel se zjednodušit nedá
    roh = [(0, 0), (10, 0), (10, 10)]
    assert G.zjednodus(roh, 1.0) == roh


def test_zahod_kratke():
    cary = [[(0, 0), (1, 0)], [(0, 0), (10, 0)], [(5, 5)]]
    assert G.zahod_kratke(cary, 5) == [[(0, 0), (10, 0)]]
    assert G.zahod_kratke(cary, 0.5) == [[(0, 0), (1, 0)], [(0, 0), (10, 0)]]
    assert G.zahod_kratke([], 1) == []


def test_spoj():
    cary = [[(0, 0), (10, 0)], [(20, 0), (30, 0)], [(10, 0), (20, 0)]]
    assert G.spoj(cary, 0.5) == [[(0, 0), (10, 0), (20, 0), (30, 0)]]

    otocene = [[(0, 0), (10, 0)], [(20, 0), (10, 0)]]
    assert G.spoj(otocene, 0.5) == [[(0, 0), (10, 0), (20, 0)]]

    nespojene = [[(0, 0), (10, 0)], [(50, 50), (60, 50)]]
    assert G.spoj(nespojene, 0.5) == nespojene
    assert G.spoj([], 1) == []


def test_vmestnej():
    ctverec = [[(0, 0), (10, 0), (10, 10), (0, 10)]]
    assert G.vmestnej(ctverec, 100, 50, okraj=5, obratit_y=False) == \
        [[(30.0, 5.0), (70.0, 5.0), (70.0, 45.0), (30.0, 45.0)]]
    assert G.vmestnej(ctverec, 100, 50, okraj=5, obratit_y=True) == \
        [[(30.0, 45.0), (70.0, 45.0), (70.0, 5.0), (30.0, 5.0)]]


def test_vmestnej_degenerovane():
    assert G.vmestnej([], 100, 50) == []
    assert G.vmestnej([[(5, 5)]], 100, 50, okraj=5) == [[(50.0, 25.0)]]
    vodorovna = G.vmestnej([[(0, 0), (10, 0)]], 100, 50, okraj=5)
    assert vodorovna == [[(5.0, 25.0), (95.0, 25.0)]]


def test_vmestnej_zachova_pomer():
    obdelnik = [[(0, 0), (20, 0), (20, 5), (0, 5)]]
    ven = G.vmestnej(obdelnik, 200, 200, okraj=0, obratit_y=False)[0]
    sirka = max(b[0] for b in ven) - min(b[0] for b in ven)
    vyska = max(b[1] for b in ven) - min(b[1] for b in ven)
    assert math.isclose(sirka / vyska, 4.0, rel_tol=1e-6)
    assert math.isclose(sirka, 200.0, rel_tol=1e-6)
