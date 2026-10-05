"""Nastavení správy webu se skládá z dat — musí z toho vyjít platné YAML.

Rozbitý `config.yml` se nijak neprojeví při sestavení, ale správa webu se
po otevření jen zasekne na prázdné stránce. Proto se kontroluje tady.
"""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

yaml = pytest.importorskip("yaml")

KOREN = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="module")
def nastaveni() -> dict:
    skript = """
      import { spravaNastaveni } from "./src/templates/sprava.mjs";
      import { readFile } from "node:fs/promises";
      const site = JSON.parse(await readFile("data/site.json", "utf8"));
      const t = JSON.parse(await readFile("data/texty.json", "utf8"));
      process.stdout.write(spravaNastaveni(site, t, { repo: "kdo/co" }));
    """
    hotovo = subprocess.run(["node", "--input-type=module", "-e", skript],
                            capture_output=True, text=True, cwd=KOREN, timeout=60)
    assert hotovo.returncode == 0, hotovo.stderr[:2000]
    return yaml.safe_load(hotovo.stdout)


def test_je_to_platne_yaml(nastaveni):
    assert nastaveni["backend"]["name"] == "github"
    assert nastaveni["backend"]["repo"] == "kdo/co"


def test_skici_jdou_zakladat(nastaveni):
    skici = next(c for c in nastaveni["collections"] if c["name"] == "skici")
    assert skici["create"] is True
    assert skici["folder"] == "zdroje/skici"
    pole = {p["name"]: p for p in skici["fields"]}
    assert pole["soubor"]["widget"] == "image"
    assert pole["skupina"]["widget"] == "select"


def test_skupiny_sedi_s_daty(nastaveni):
    site = json.loads((KOREN / "data" / "site.json").read_text(encoding="utf-8"))
    skici = next(c for c in nastaveni["collections"] if c["name"] == "skici")
    volby = {o["value"] for o in next(p for p in skici["fields"] if p["name"] == "skupina")["options"]}
    assert volby == {g["id"] for g in site["skupiny"]}


def test_vsechny_texty_jsou_k_editaci(nastaveni):
    """Co je v texty.json, musí jít ve správě přepsat — jinak je to past."""
    t = json.loads((KOREN / "data" / "texty.json").read_text(encoding="utf-8"))
    obsah = next(c for c in nastaveni["collections"] if c["name"] == "obsah")
    texty = next(f for f in obsah["files"] if f["name"] == "texty")
    assert {p["name"] for p in texty["fields"]} == set(t)


def test_projekty_jsou_v_site(nastaveni):
    obsah = next(c for c in nastaveni["collections"] if c["name"] == "obsah")
    site = next(f for f in obsah["files"] if f["name"] == "site")
    pole = {p["name"]: p for p in site["fields"]}
    assert pole["projekty"]["widget"] == "list"
    vnitrni = {p["name"] for p in pole["projekty"]["fields"]}
    assert {"nazev", "misto", "rok", "anotace", "text", "skici", "fotky"} <= vnitrni
