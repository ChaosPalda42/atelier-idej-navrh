"""Akceptační test C-001 — src/lib/pisar.mjs (plánovač psaní)."""
from __future__ import annotations

import pytest

from tests.jsmod import run_js

POLOZKY = [
    {"id": "h", "typ": "nadpis", "text": "Ateliér"},
    {"id": "p1", "typ": "odstavec", "text": "Ahoj."},
    {"id": "n1", "typ": "poznamka", "text": "Ahoj"},
    {"id": "k", "typ": "kresba", "trvani": 1000},
    {"typ": "odstavec", "text": "bez id"},
]
JEDNODUCHY = [
    {"id": "a", "typ": "kresba", "trvani": 1000},
    {"id": "b", "typ": "kresba", "trvani": 500},
]


@pytest.fixture()
def js():
    def call(body, **args):
        return run_js("pisar.mjs", body, args={"p": POLOZKY, "j": JEDNODUCHY, **args})

    return call


def test_tempo(js):
    assert js("out(m.TEMPO);") == {
        "znakyZaSekundu": 42,
        "pauzaVeta": 180,
        "pauzaPoPolozce": 160,
        "minTrvani": 120,
        "maxTrvani": 4000,
    }


def test_vety(js):
    assert js('out(m.vety("A. B! C? D"));') == 3
    assert js('out(m.vety("Konec…"));') == 1
    assert js('out(m.vety("Co?!"));') == 1
    assert js('out(m.vety("3.5 je číslo"));') == 0
    assert js('out(m.vety(""));') == 0
    assert js("out(m.vety(null));") == 0


def test_trvani_textu(js):
    assert js('out(m.trvaniTextu(""));') == 0
    assert js('out(m.trvaniTextu("   "));') == 0
    assert js("out(m.trvaniTextu(42));") == 0
    # 4 znaky = 95 ms, pod minTrvani -> 120
    assert js('out(m.trvaniTextu("Ahoj"));') == 120
    # 5 znaků = 119,05 ms + jedna věta 180 ms = 299
    assert js('out(m.trvaniTextu("Ahoj."));') == 299
    # dlouhý text se ořízne na maxTrvani
    assert js('out(m.trvaniTextu("x".repeat(1000)));') == 4000


def test_plan_poradi_a_casy(js):
    plan = js("out(m.plan(A.p));")
    assert [x["id"] for x in plan] == ["h", "p1", "n1", "k"], "položka bez id se zahazuje"
    assert plan[0] == {"id": "h", "typ": "nadpis", "start": 0, "trvani": 167, "konec": 167}
    assert plan[1] == {"id": "p1", "typ": "odstavec", "start": 327, "trvani": 299, "konec": 626}
    assert plan[2] == {"id": "n1", "typ": "poznamka", "start": 327, "trvani": 120, "konec": 447}, \
        "poznámka se píše souběžně s předchozí položkou"
    assert plan[3] == {"id": "k", "typ": "kresba", "start": 786, "trvani": 1000, "konec": 1786}, \
        "poznámka nesmí posunout kurzor časové osy"


def test_plan_prazdny_a_celkem(js):
    assert js("out(m.plan([]));") == []
    assert js("out(m.celkem([]));") == 0
    assert js("out(m.celkem(m.plan(A.p)));") == 1786


def test_stav(js):
    s = js("out(m.stav(m.plan(A.p), 400));")
    assert s["hotove"] == ["h"]
    assert s["probihajici"] == [{"id": "p1", "podil": 0.2441}, {"id": "n1", "podil": 0.6083}]
    assert s["cekajici"] == ["k"]

    s0 = js("out(m.stav(m.plan(A.p), 0));")
    assert s0["hotove"] == []
    assert s0["probihajici"] == [{"id": "h", "podil": 0}]
    assert s0["cekajici"] == ["p1", "n1", "k"]

    konec = js("out(m.stav(m.plan(A.p), 99999));")
    assert konec["hotove"] == ["h", "p1", "n1", "k"]
    assert konec["probihajici"] == [] and konec["cekajici"] == []


def test_stav_nulove_trvani(js):
    s = js('out(m.stav(m.plan([{ id: "x", typ: "foto", trvani: 0 }]), 0));')
    assert s["hotove"] == ["x"], "položka s nulovým trváním je hotová hned"


def test_zrychli(js):
    p = js("out(m.plan(A.j));")
    assert p == [
        {"id": "a", "typ": "kresba", "start": 0, "trvani": 1000, "konec": 1000},
        {"id": "b", "typ": "kresba", "start": 1160, "trvani": 500, "konec": 1660},
    ]
    assert js("out(m.zrychli(m.plan(A.j), 0.5));") == [
        {"id": "a", "typ": "kresba", "start": 0, "trvani": 500, "konec": 500},
        {"id": "b", "typ": "kresba", "start": 580, "trvani": 250, "konec": 830},
    ]
    assert js("out(m.zrychli(m.plan(A.j), 0));") == [
        {"id": "a", "typ": "kresba", "start": 0, "trvani": 0, "konec": 0},
        {"id": "b", "typ": "kresba", "start": 0, "trvani": 0, "konec": 0},
    ]
    assert js("""
        const p = m.plan(A.j);
        m.zrychli(p, 0.5);
        out(p);
    """) == [
        {"id": "a", "typ": "kresba", "start": 0, "trvani": 1000, "konec": 1000},
        {"id": "b", "typ": "kresba", "start": 1160, "trvani": 500, "konec": 1660},
    ], "zrychli nesmí sáhnout na původní plán"
