"""Akceptační test C-014 — src/php/odeslat.php (příjem poptávky a odeslání mailem).

Testuje se přes PHP CLI: skript při `php odeslat.php` nic neodesílá, jen
zpřístupní své čisté funkce, takže se dají zavolat bez webserveru a bez
skutečného mailu.
"""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

KOREN = Path(__file__).resolve().parents[1]
SKRIPT = KOREN / "src" / "php" / "odeslat.php"


def php(telo: str, **argumenty) -> object:
    """Načte skript a vykoná `telo`; výstup `vrat(...)` se vrátí jako JSON."""
    kod = (
        "<?php $A = json_decode(%s, true);"
        "require %s;"
        "function vrat($v) { echo '<<<JSON>>>' . json_encode($v); }"
        "%s" % (json.dumps(json.dumps(argumenty)), json.dumps(str(SKRIPT)), telo)
    )
    hotovo = subprocess.run(["php", "-r", kod[5:]], capture_output=True, text=True, timeout=30)
    assert hotovo.returncode == 0, hotovo.stderr[:2000]
    znacka = "<<<JSON>>>"
    at = hotovo.stdout.rfind(znacka)
    assert at >= 0, f"skript nic nevrátil: {hotovo.stdout[:400]!r}"
    return json.loads(hotovo.stdout[at + len(znacka):])


def test_skript_sam_o_sobe_nic_nedela():
    """Spuštění z příkazové řádky nesmí nic odeslat ani nic vypsat."""
    hotovo = subprocess.run(["php", str(SKRIPT)], capture_output=True, text=True, timeout=30)
    assert hotovo.returncode == 0
    assert hotovo.stdout.strip() == ""


def test_ocisti_hlavicku():
    """Do hlavičky mailu se nesmí dostat konec řádku — tudy se podstrkují
    cizí příjemci (header injection)."""
    assert php('vrat(ocisti_hlavicku("Jan Novák"));') == "Jan Novák"
    assert php('vrat(ocisti_hlavicku("Jan\\r\\nBcc: zly@example.com"));') == "JanBcc: zly@example.com"
    assert php('vrat(ocisti_hlavicku("a\\nb\\rc\\0d"));') == "abcd"
    assert php('vrat(ocisti_hlavicku(str_repeat("x", 500)));') == "x" * 200


def test_zkontroluj_prijme_poradnou_poptavku():
    v = php('vrat(zkontroluj($A));', jmeno="Jan Novák", email="jan@example.com",
            telefon="+420 777 111 222", zprava="Mám pozemek v Říčanech, parc. č. 123/4.",
            souhlas="1")
    assert not v["chyby"]
    assert v["data"]["jmeno"] == "Jan Novák"


def test_zkontroluj_hlida_povinne():
    v = php('vrat(zkontroluj($A));', jmeno="", email="neplatny", zprava="krátká", souhlas="")
    assert set(v["chyby"]) >= {"jmeno", "email", "zprava", "souhlas"}


def test_zkontroluj_email():
    for dobry in ("a@b.cz", "jan.novak+web@seznam.cz"):
        v = php('vrat(zkontroluj($A));', jmeno="X Y", email=dobry,
                zprava="Dost dlouhá zpráva o záměru stavby.", souhlas="1")
        assert "email" not in v["chyby"], dobry
    for spatny in ("a@b", "zavináč chybí", "a @b.cz", ""):
        v = php('vrat(zkontroluj($A));', jmeno="X Y", email=spatny,
                zprava="Dost dlouhá zpráva o záměru stavby.", souhlas="1")
        assert "email" in v["chyby"], spatny


def test_past_na_roboty():
    """Skryté pole vyplní jen robot. Poptávka se zahodí, ale tváříme se,
    že prošla — jinak si robot vyzkouší jinou cestu."""
    v = php('vrat(zkontroluj($A));', jmeno="X Y", email="a@b.cz",
            zprava="Dost dlouhá zpráva o záměru stavby.", souhlas="1", vzkaz="spam")
    assert v["robot"] is True
    assert not v["chyby"]


def test_sestav_mail_ma_vse_podstatne():
    v = php('vrat(sestav_mail($A, []));', jmeno="Jan Novák", email="jan@example.com",
            telefon="+420777111222", zprava="Pozemek v Říčanech.")
    assert "Jan Novák" in v["telo"]
    assert "jan@example.com" in v["telo"]
    assert "Pozemek v Říčanech." in v["telo"]
    assert v["predmet"].startswith("Poptávka z webu")
    hlavicky = v["hlavicky"].lower()
    assert "reply-to: jan@example.com" in hlavicky
    assert "from: " in hlavicky
    # odesílatel musí být na vlastní doméně, jinak to pošta zahodí
    assert "@atelieridej.cz" in hlavicky.split("from:")[1].split("\n")[0]


def test_mail_se_neda_podvrhnout_pres_jmeno():
    v = php('vrat(sestav_mail($A, []));', jmeno="Jan\r\nBcc: zly@example.com",
            email="jan@example.com", telefon="", zprava="Text zprávy, dost dlouhý.")
    assert "bcc:" not in v["hlavicky"].lower()
    assert "\r\n\r\n" not in v["hlavicky"]


def test_prilohy_v_mailu():
    v = php('vrat(sestav_mail($A, [["nazev" => "plan.pdf", "typ" => "application/pdf", "obsah" => "ABC"]]));',
            jmeno="Jan Novák", email="jan@example.com", telefon="", zprava="Text zprávy, dost dlouhý.")
    assert "plan.pdf" in v["telo"]
    assert "multipart/mixed" in v["hlavicky"].lower()


def test_prijemce_je_atelier():
    assert php('vrat(PRIJEMCE);') == "info@atelieridej.cz"


# ------------------------------------------- doplněno po revizi (C-014/2)

def test_typ_prilohy_se_nebere_od_klienta(tmp_path):
    """Content-Type přílohy určuje přípona, ne to, co pošle prohlížeč —
    jinak si odesílatel vybere, jak se soubor bude tvářit."""
    soubor = tmp_path / "plan.pdf"
    soubor.write_bytes(b"%PDF-1.4 cosi")
    v = php(
        'vrat(nacti_prilohy(["name" => ["plan.pdf"], "type" => ["text/html"],'
        ' "tmp_name" => [$A["cesta"]], "error" => [0], "size" => [13]]));',
        cesta=str(soubor),
    )
    assert len(v) == 1
    assert v[0]["nazev"] == "plan.pdf"
    assert v[0]["typ"] == "application/pdf", "typ se má odvodit z přípony"


def test_neznama_pripona_se_zahodi(tmp_path):
    soubor = tmp_path / "skript.php"
    soubor.write_bytes(b"<?php evil();")
    v = php(
        'vrat(nacti_prilohy(["name" => ["skript.php"], "type" => ["application/pdf"],'
        ' "tmp_name" => [$A["cesta"]], "error" => [0], "size" => [13]]));',
        cesta=str(soubor),
    )
    assert v == []


def test_omezeni_cetnosti(tmp_path):
    """Z jedné adresy se nesmí dát vysypat schránka. Pátá poptávka v hodině
    ještě projde, šestá už ne; po uplynutí okna se počítá znovu."""
    slozka = str(tmp_path)
    for i in range(5):
        assert php('vrat(prilis_casto("1.2.3.4", $A["d"], 1000));', d=slozka) is False, i
    assert php('vrat(prilis_casto("1.2.3.4", $A["d"], 1000));', d=slozka) is True
    # jiná adresa má svůj vlastní počet
    assert php('vrat(prilis_casto("5.6.7.8", $A["d"], 1000));', d=slozka) is False
    # po okně se zapomíná
    assert php('vrat(prilis_casto("1.2.3.4", $A["d"], 1000 + LIMIT_OKNO + 1));', d=slozka) is False


def test_omezeni_neuklada_adresu_v_citelne_podobe(tmp_path):
    """V dočasném souboru nemá ležet IP návštěvníka čitelně."""
    slozka = tmp_path
    php('vrat(prilis_casto("203.0.113.9", $A["d"], 1000));', d=str(slozka))
    obsah = b"".join(p.read_bytes() for p in slozka.iterdir())
    assert b"203.0.113.9" not in obsah



# ----------------------------------------- obsluha požadavku (C-014/3)
# Čisté funkce prošly, a přesto formulář na ostrém webu vracel 422
# s prázdným seznamem chyb: prázdná mapa chyb se porovnávala s [] a jako
# objekt se nikdy nerovnala. Proto se tu zkouší celý požadavek, ne jen
# jednotlivé funkce.

@pytest.fixture(scope="module")
def server():
    import socket, time
    from contextlib import closing
    with closing(socket.socket()) as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    beh = subprocess.Popen(
        ["php", "-S", f"127.0.0.1:{port}", "-t", str(SKRIPT.parent)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try:
            with closing(socket.create_connection(("127.0.0.1", port), 0.2)):
                break
        except OSError:
            time.sleep(0.1)
    yield f"http://127.0.0.1:{port}/odeslat.php"
    beh.terminate()
    beh.wait(timeout=5)


def posli(adresa, pole):
    import urllib.error, urllib.parse, urllib.request
    data = urllib.parse.urlencode(pole).encode()
    zadost = urllib.request.Request(adresa, data=data, method="POST")
    try:
        with urllib.request.urlopen(zadost, timeout=20) as o:
            return o.status, json.loads(o.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def test_get_neprojde(server):
    import urllib.error, urllib.request
    try:
        with urllib.request.urlopen(server, timeout=20) as o:
            stav = o.status
    except urllib.error.HTTPError as e:
        stav = e.code
    assert stav == 405


def test_prazdny_formular_vrati_chyby_po_polich(server):
    stav, telo = posli(server, {})
    assert stav == 422
    assert telo["ok"] is False
    assert set(telo["chyby"]) >= {"jmeno", "email", "zprava", "souhlas"}, telo


def test_poradna_poptavka_projde_pres_kontrolu(server):
    """Nesmí skončit na 422 — odeslání mailu tady selhat smí (stroj není
    poštovní server), ale kontrola ji zamítnout nesmí."""
    stav, telo = posli(server, {
        "jmeno": "Jan Novák", "email": "jan@example.com", "telefon": "777111222",
        "zprava": "Mám pozemek v Říčanech, parcelní číslo 123/4.", "souhlas": "1",
    })
    assert stav != 422, telo
    assert stav in (200, 500), (stav, telo)


def test_robot_dostane_podekovani_ale_nic_se_nepole(server):
    stav, telo = posli(server, {
        "jmeno": "Robot", "email": "robot@example.com",
        "zprava": "Tohle je spam, dost dlouhý na projití.", "souhlas": "1",
        "vzkaz": "past",
    })
    assert stav == 200
    assert telo == {"ok": True}
