"""Akceptační test C-006 — src/lib/administrace.mjs (stav demo administrace)."""
from __future__ import annotations

import pytest

from tests.jsmod import run_js

SITE = {
    "firma": {"nazev": "ateliér IDEJ", "email": "jirasko96@gmail.com"},
    "prace": [
        {"slug": "alfa", "nazev": "Alfa", "typ": "domy", "rok": 2024},
        {"slug": "beta", "nazev": "Beta", "typ": "komercni", "rok": 2023},
        {"slug": "gama", "nazev": "Gama", "typ": "studie", "rok": 2026},
    ],
}


@pytest.fixture()
def js():
    def call(body, **args):
        return run_js("administrace.mjs", body, args={"s": SITE, **args})

    return call


def test_vychozi_stav(js):
    assert js("out(m.vychoziStav(A.s));") == {
        "prace": SITE["prace"],
        "texty": {},
        "poptavky": [],
        "kontakt": SITE["firma"],
    }
    assert js("out(m.vychoziStav({}));") == {"prace": [], "texty": {}, "poptavky": [], "kontakt": {}}
    assert js("""
        const stav = m.vychoziStav(A.s);
        stav.prace.push({ slug: "x" });
        out(A.s.prace.length);
    """) == 3, "vychoziStav musí pole prací okopírovat"


def test_unikatni_slug(js):
    assert js('out(m.unikatniSlug(A.s.prace, "delta"));') == "delta"
    assert js('out(m.unikatniSlug(A.s.prace, "alfa"));') == "alfa-2"
    assert js('out(m.unikatniSlug([...A.s.prace, { slug: "alfa-2" }], "alfa"));') == "alfa-3"
    assert js('out(m.unikatniSlug([], "alfa"));') == "alfa"


def test_pridej_praci(js):
    assert js("""
        const s = m.vychoziStav(A.s);
        const n = m.pridejPraci(s, { nazev: "Dům nad sadem", typ: "domy", rok: 2026 });
        out([n.prace.map(x => x.slug), s.prace.length]);
    """) == [["dum-nad-sadem", "alfa", "beta", "gama"], 3]
    assert js("""
        const n = m.pridejPraci(m.vychoziStav(A.s), { nazev: "Alfa" });
        out(n.prace[0].slug);
    """) == "alfa-2"
    assert js("""
        const n = m.pridejPraci(m.vychoziStav(A.s), { slug: "vlastni", nazev: "Něco" });
        out(n.prace[0].slug);
    """) == "vlastni"


def test_uprav_praci(js):
    assert js("""
        const s = m.vychoziStav(A.s);
        const n = m.upravPraci(s, "beta", { rok: 2030, misto: "Beroun" });
        out([n.prace[1], s.prace[1].rok]);
    """) == [{"slug": "beta", "nazev": "Beta", "typ": "komercni", "rok": 2030, "misto": "Beroun"}, 2023]
    assert js("""
        const n = m.upravPraci(m.vychoziStav(A.s), "nic", { rok: 1 });
        out(n.prace.map(x => x.rok));
    """) == [2024, 2023, 2026]


def test_smaz_a_presun(js):
    assert js("""
        out(m.smazPraci(m.vychoziStav(A.s), "beta").prace.map(x => x.slug));
    """) == ["alfa", "gama"]
    assert js("""
        out(m.presun(m.vychoziStav(A.s), "beta", -1).prace.map(x => x.slug));
    """) == ["beta", "alfa", "gama"]
    assert js("""
        out(m.presun(m.vychoziStav(A.s), "beta", 1).prace.map(x => x.slug));
    """) == ["alfa", "gama", "beta"]
    assert js("""
        out(m.presun(m.vychoziStav(A.s), "alfa", -1).prace.map(x => x.slug));
    """) == ["alfa", "beta", "gama"], "na kraji se nic nemění"
    assert js("""
        out(m.presun(m.vychoziStav(A.s), "nic", 1).prace.map(x => x.slug));
    """) == ["alfa", "beta", "gama"]


def test_texty(js):
    assert js("""
        const n = m.nastavText(m.vychoziStav(A.s), "uvod.nadpis", "Nový nadpis", "Původní");
        out(n.texty);
    """) == {"uvod.nadpis": {"hodnota": "Nový nadpis", "_zaklad": "Původní"}}
    assert js("""
        let n = m.nastavText(m.vychoziStav(A.s), "uvod.nadpis", "Nový", "Původní");
        n = m.nastavText(n, "uvod.nadpis", "Ještě jiný", "Jiný základ");
        out(n.texty["uvod.nadpis"]);
    """) == {"hodnota": "Ještě jiný", "_zaklad": "Původní"}, "základ se drží první"
    assert js("""
        let n = m.nastavText(m.vychoziStav(A.s), "uvod.nadpis", "Nový", "Původní");
        n = m.nastavText(n, "uvod.nadpis", "  Původní  ", "Původní");
        out(n.texty);
    """) == {}, "návrat k původnímu textu klíč odebere"
    assert js("""
        let n = m.nastavText(m.vychoziStav(A.s), "a", "A2", "A1");
        n = m.nastavText(n, "b", "B2", "B1");
        out(m.textyKPrepisu(n));
    """) == {"a": "A2", "b": "B2"}
    assert js("out(m.textyKPrepisu(m.vychoziStav(A.s)));") == {}


def test_poptavky(js):
    assert js("""
        let n = m.prijmiPoptavku(m.vychoziStav(A.s), { jmeno: "Jan" });
        n = m.prijmiPoptavku(n, { jmeno: "Eva" });
        out(n.poptavky.map(x => [x.id, x.jmeno, x.stav]));
    """) == [["P-002", "Eva", "nova"], ["P-001", "Jan", "nova"]]
    assert js("""
        let n = m.prijmiPoptavku(m.vychoziStav(A.s), { id: "P-007", jmeno: "Jan" });
        n = m.prijmiPoptavku(n, { jmeno: "Eva" });
        out(n.poptavky.map(x => x.id));
    """) == ["P-008", "P-007"]
    assert js("""
        const n = m.prijmiPoptavku(m.vychoziStav(A.s), { jmeno: "Jan" });
        out(m.zmenStavPoptavky(n, "P-001", "vyrizena").poptavky[0].stav);
    """) == "vyrizena"
    assert js("""
        const n = m.prijmiPoptavku(m.vychoziStav(A.s), { jmeno: "Jan" });
        out(m.zmenStavPoptavky(n, "P-001", "nesmysl").poptavky[0].stav);
    """) == "nova"


def test_export_import(js):
    assert js("""
        const n = m.nastavText(m.vychoziStav(A.s), "a", "A2", "A1");
        const text = m.exportuj(n);
        const zpet = m.importuj(text);
        out([zpet.chyba, JSON.stringify(zpet.stav) === JSON.stringify(n)]);
    """) == [None, True]
    assert js('out(m.importuj("tohle není json"));') == \
        {"stav": None, "chyba": "Tohle nevypadá jako záloha administrace."}
    assert js('out(m.importuj(JSON.stringify({ neco: 1 })).chyba);') == \
        "Tohle nevypadá jako záloha administrace."
    assert js('out(m.importuj(JSON.stringify({ prace: [] })).stav);') == \
        {"prace": [], "texty": {}, "poptavky": [], "kontakt": {}}
