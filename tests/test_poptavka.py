"""Akceptační test C-005 — src/lib/poptavka.mjs (větvený formulář)."""
from __future__ import annotations

import pytest

from tests.jsmod import run_js

KROKY = [
    {"id": "co", "otazka": "Co řešíte?", "typ": "volba", "povinny": True,
     "moznosti": [{"id": "pozemek", "popis": "Mám pozemek"},
                  {"id": "dum", "popis": "Mám dům nebo byt"},
                  {"id": "napad", "popis": "Zatím jen nápad"}]},
    {"id": "pozemek_kde", "otazka": "Kde je pozemek?", "typ": "text", "povinny": True,
     "podminka": {"pole": "co", "je": ["pozemek"]}},
    {"id": "dum_stav", "otazka": "V jakém je stavu?", "typ": "volba",
     "podminka": {"pole": "co", "je": ["dum"]},
     "moznosti": [{"id": "dobry", "popis": "Dobrý"}, {"id": "spatny", "popis": "Na spadnutí"}]},
    {"id": "podklady", "otazka": "Máte podklady?", "typ": "soubory"},
    {"id": "zprava", "otazka": "Co je důležité?", "typ": "text", "povinny": True},
]


@pytest.fixture()
def js():
    def call(body, **args):
        return run_js("poptavka.mjs", body, args={"k": KROKY, **args})

    return call


def test_splnuje(js):
    assert js("out(m.splnuje(undefined, {}));") is True
    assert js("out(m.splnuje(null, { co: 'dum' }));") is True
    assert js("out(m.splnuje({ pole: 'co', je: ['dum'] }, { co: 'dum' }));") is True
    assert js("out(m.splnuje({ pole: 'co', je: ['dum'] }, { co: 'pozemek' }));") is False
    assert js("out(m.splnuje({ pole: 'co', je: ['dum'] }, {}));") is False


def test_viditelne_kroky(js):
    assert js("out(m.viditelneKroky(A.k, {}).map(x => x.id));") == ["co", "podklady", "zprava"]
    assert js("out(m.viditelneKroky(A.k, { co: 'pozemek' }).map(x => x.id));") == \
        ["co", "pozemek_kde", "podklady", "zprava"]
    assert js("out(m.viditelneKroky(A.k, { co: 'dum' }).map(x => x.id));") == \
        ["co", "dum_stav", "podklady", "zprava"]
    assert js("out(m.viditelneKroky([], {}));") == []


def test_dalsi_predchozi(js):
    assert js("out(m.dalsi(A.k, { co: 'pozemek' }, 'co'));") == "pozemek_kde"
    assert js("out(m.dalsi(A.k, {}, 'co'));") == "podklady"
    assert js("out(m.dalsi(A.k, {}, 'zprava'));") is None
    assert js("out(m.dalsi(A.k, {}, 'pozemek_kde'));") == "co", "neviditelný krok -> začni od prvního"
    assert js("out(m.dalsi([], {}, 'co'));") is None
    assert js("out(m.predchozi(A.k, {}, 'podklady'));") == "co"
    assert js("out(m.predchozi(A.k, {}, 'co'));") is None
    assert js("out(m.predchozi(A.k, { co: 'dum' }, 'podklady'));") == "dum_stav"


def test_chybejici_a_hotovo(js):
    assert js("out(m.chybejici(A.k, {}));") == ["co", "zprava"]
    assert js("out(m.chybejici(A.k, { co: 'pozemek', pozemek_kde: '   ', zprava: 'x' }));") == \
        ["pozemek_kde"]
    assert js("out(m.chybejici(A.k, { co: 'napad', zprava: 'x' }));") == []
    assert js("out(m.hotovo(A.k, { co: 'napad', zprava: 'x' }));") is True
    assert js("out(m.hotovo(A.k, { co: 'napad' }));") is False
    assert js("out(m.hotovo(A.k, { co: 'pozemek', zprava: 'x' }));") is False


def test_shrnuti(js):
    assert js("out(m.shrnuti(A.k, { co: 'dum', dum_stav: 'spatny', podklady: ['a', 'b'], zprava: 'text' }));") == [
        {"id": "co", "otazka": "Co řešíte?", "odpoved": "Mám dům nebo byt"},
        {"id": "dum_stav", "otazka": "V jakém je stavu?", "odpoved": "Na spadnutí"},
        {"id": "podklady", "otazka": "Máte podklady?", "odpoved": 2},
        {"id": "zprava", "otazka": "Co je důležité?", "odpoved": "text"},
    ]
    assert js("out(m.shrnuti(A.k, { co: 'napad' }).length);") == 1
    assert js("out(m.shrnuti(A.k, { co: 'napad', zprava: '  ', podklady: [] }).length);") == 1
    assert js("out(m.shrnuti(A.k, { co: 'nesmysl' })[0].odpoved);") == "nesmysl"
    assert js("out(m.shrnuti(A.k, {}));") == []


def test_postup(js):
    assert js("out(m.postup(A.k, {}, 'podklady'));") == {"index": 2, "celkem": 3}
    assert js("out(m.postup(A.k, { co: 'pozemek' }, 'zprava'));") == {"index": 4, "celkem": 4}
    assert js("out(m.postup(A.k, {}, 'nic'));") == {"index": 0, "celkem": 3}


def test_vstupy_se_nemeni(js):
    assert js("""
        const kopie = JSON.stringify(A.k);
        m.viditelneKroky(A.k, { co: 'dum' });
        m.shrnuti(A.k, { co: 'dum' });
        out(JSON.stringify(A.k) === kopie);
    """) is True
