"""Akceptační test C-003 — src/lib/prace.mjs (práce ateliéru)."""
from __future__ import annotations

import pytest

from tests.jsmod import run_js

PRACE = [
    {"slug": "beta", "nazev": "Beta", "typ": "domy", "rok": 2024},
    {"slug": "alfa", "nazev": "Alfa", "typ": "komercni", "rok": 2024},
    {"slug": "gama", "nazev": "Gama", "typ": "domy", "rok": 2026},
    {"slug": "delta", "nazev": "Delta", "typ": "studie", "rok": 2023},
]


@pytest.fixture()
def js():
    def call(body, **args):
        return run_js("prace.mjs", body, args={"p": PRACE, **args})

    return call


def test_slug(js):
    assert js('out(m.slug("Dům nad sadem"));') == "dum-nad-sadem"
    assert js('out(m.slug("Pekárna v podloubí"));') == "pekarna-v-podloubi"
    assert js('out(m.slug("  Hala & kanceláře  "));') == "hala-kancelare"
    assert js('out(m.slug("Praha 5 — Smíchov"));') == "praha-5-smichov"
    assert js('out(m.slug("Řezáč ŽLUŤOUČKÝ"));') == "rezac-zlutoucky"
    assert js("out(m.slug(123));") == ""
    assert js('out(m.slug(""));') == ""


def test_serad(js):
    assert js("out(m.serad(A.p).map(x => x.slug));") == ["gama", "alfa", "beta", "delta"]
    assert js("""
        const kopie = JSON.stringify(A.p);
        m.serad(A.p);
        out(JSON.stringify(A.p) === kopie);
    """) is True


def test_filtr(js):
    assert js('out(m.filtr(A.p, "domy").map(x => x.slug));') == ["beta", "gama"]
    assert js('out(m.filtr(A.p, "vse").map(x => x.slug));') == ["beta", "alfa", "gama", "delta"]
    assert js('out(m.filtr(A.p, "").length);') == 4
    assert js('out(m.filtr(A.p, "neexistuje"));') == []


def test_podle_slugu(js):
    assert js('out(m.podleSlugu(A.p, "gama").nazev);') == "Gama"
    assert js('out(m.podleSlugu(A.p, "nic"));') is None


def test_sousedi(js):
    assert js('out(m.sousedi(A.p, "alfa"));') == {
        "predchozi": PRACE[0],
        "dalsi": PRACE[2],
    }
    assert js('out(m.sousedi(A.p, "beta").predchozi.slug);') == "delta", "dokola na konec"
    assert js('out(m.sousedi(A.p, "delta").dalsi.slug);') == "beta", "dokola na začátek"
    assert js('out(m.sousedi(A.p, "nic"));') == {"predchozi": None, "dalsi": None}
    assert js('out(m.sousedi([A.p[0]], "beta"));') == {"predchozi": None, "dalsi": None}


def test_pocty(js):
    assert js("out(m.pocty(A.p));") == {"vse": 4, "domy": 2, "komercni": 1, "studie": 1}
    assert js("out(m.pocty([]));") == {"vse": 0}
