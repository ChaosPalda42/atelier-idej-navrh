"""Akceptační test C-004 — src/lib/validace.mjs (validace poptávky)."""
from __future__ import annotations

import pytest

from tests.jsmod import run_js

PRIPONY = ["pdf", "jpg", "jpeg", "png", "heic", "webp", "dwg", "dxf", "doc", "docx", "xls", "xlsx"]
SEZNAM = ", ".join(PRIPONY)
MB = 1024 * 1024
PLATNA = {
    "jmeno": "Martin Jirásko",
    "email": "jirasko96@gmail.com",
    "telefon": "735 541 757",
    "zprava": "Mám pozemek v Jesenici a chtěl bych na něm dům.",
    "souhlas": True,
    "soubory": [],
}


@pytest.fixture()
def js():
    def call(body, **args):
        return run_js("validace.mjs", body, args={"ok": PLATNA, "mb": MB, **args})

    return call


def test_konstanty(js):
    assert js("out(m.PRIPONY);") == PRIPONY
    assert js("out(m.LIMIT_SOUBOR);") == 15 * MB
    assert js("out(m.LIMIT_CELKEM);") == 40 * MB


def test_pripona(js):
    assert js('out(m.pripona("A.Foto.JPG"));') == "jpg"
    assert js('out(m.pripona("plan.dwg"));') == "dwg"
    assert js('out(m.pripona(".gitignore"));') == ""
    assert js('out(m.pripona("bez"));') == ""
    assert js("out(m.pripona(null));") == ""


def test_je_email(js):
    assert js('out(m.jeEmail("jirasko96@gmail.com"));') is True
    assert js('out(m.jeEmail("a@b.cz"));') is True
    assert js('out(m.jeEmail("a@b"));') is False
    assert js('out(m.jeEmail("a@b.c"));') is False
    assert js('out(m.jeEmail("@b.cz"));') is False
    assert js('out(m.jeEmail("a b@c.cz"));') is False
    assert js('out(m.jeEmail("a@b@c.cz"));') is False
    assert js('out(m.jeEmail(""));') is False


def test_telefon(js):
    assert js('out(m.normalizujTelefon("735 541 757"));') == "735541757"
    assert js('out(m.normalizujTelefon("+420 735-541/757"));') == "+420735541757"
    assert js('out(m.normalizujTelefon("(735) 541 757"));') == "735541757"
    assert js("out(m.normalizujTelefon(null));") == ""
    assert js('out(m.jeTelefon("735 541 757"));') is True
    assert js('out(m.jeTelefon("+420735541757"));') is True
    assert js('out(m.jeTelefon("00420735541757"));') is True
    assert js('out(m.jeTelefon("73554175"));') is False
    assert js('out(m.jeTelefon("+420 735 541 7570"));') is False
    assert js('out(m.jeTelefon(""));') is False


def test_soubor_chyba(js):
    assert js('out(m.souborChyba({ nazev: "plan.dwg", velikost: 100 }));') is None
    assert js('out(m.souborChyba({ nazev: "virus.exe", velikost: 100 }));') == \
        f"Soubor virus.exe nemůžu přijmout (povolené: {SEZNAM})."
    assert js("out(m.souborChyba({ nazev: 'velky.pdf', velikost: 16 * A.mb }));") == \
        "Soubor velky.pdf je větší než 15 MB."
    assert js("out(m.souborChyba({ nazev: 'velky.exe', velikost: 16 * A.mb }));") == \
        f"Soubor velky.exe nemůžu přijmout (povolené: {SEZNAM}).", "přípona se hlásí dřív než velikost"


def test_soubory_chyby(js):
    assert js("out(m.souboryChyby([]));") == []
    assert js("out(m.souboryChyby(null));") == []
    ctyri = "[0,1,2,3].map(i => ({ nazev: `f${i}.pdf`, velikost: 11 * A.mb }))"
    assert js(f"out(m.souboryChyby({ctyri}));") == ["Přílohy dohromady přesahují 40 MB."]
    assert js("out(m.souboryChyby([{ nazev: 'a.pdf', velikost: 1 }, { nazev: 'b.exe', velikost: 1 }]));") == \
        [f"Soubor b.exe nemůžu přijmout (povolené: {SEZNAM})."]


def test_zkontroluj_platny(js):
    assert js("out(m.zkontroluj(A.ok));") == {"platny": True, "chyby": {}}


def test_zkontroluj_chyby(js):
    prazdny = js("out(m.zkontroluj({}));")
    assert prazdny["platny"] is False
    assert prazdny["chyby"] == {
        "jmeno": "Napište prosím jméno.",
        "email": "Nechte na sebe e-mail nebo telefon.",
        "zprava": "Napište pár vět o tom, co řešíte.",
        "souhlas": "Bez souhlasu se zpracováním to nemůžu odeslat.",
    }
    assert js("out(m.zkontroluj({ ...A.ok, email: 'spatne' }).chyby);") == \
        {"email": "Zkontrolujte e-mail."}
    assert js("out(m.zkontroluj({ ...A.ok, telefon: '123' }).chyby);") == \
        {"telefon": "Zkontrolujte telefon."}
    assert js("out(m.zkontroluj({ ...A.ok, email: '', telefon: '' }).chyby);") == \
        {"email": "Nechte na sebe e-mail nebo telefon."}
    assert js("out(m.zkontroluj({ ...A.ok, email: '', telefon: '735 541 757' }).platny);") is True
    assert js("out(m.zkontroluj({ ...A.ok, zprava: '   ' }).chyby.zprava);") == \
        "Napište pár vět o tom, co řešíte."
    assert js("out(m.zkontroluj({ ...A.ok, souhlas: 'ano' }).chyby.souhlas);") == \
        "Bez souhlasu se zpracováním to nemůžu odeslat."


def test_zkontroluj_soubory(js):
    chyby = js("out(m.zkontroluj({ ...A.ok, soubory: [{ nazev: 'a.exe', velikost: 1 }, { nazev: 'b.zip', velikost: 1 }] }).chyby);")
    assert chyby == {
        "soubory": f"Soubor a.exe nemůžu přijmout (povolené: {SEZNAM}). "
                   f"Soubor b.zip nemůžu přijmout (povolené: {SEZNAM})."
    }
