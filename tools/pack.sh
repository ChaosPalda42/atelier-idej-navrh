#!/bin/bash
# Zabalí ukázku pro klienta (web + PRECTI-ME).
set -e
KOREN="$(cd "$(dirname "$0")/.." && pwd)"
cd "$KOREN"
node build.mjs
rm -rf _balicek && mkdir -p _balicek/Fofrmont-ukazka
cp -R out/* _balicek/Fofrmont-ukazka/
cp dokumenty/PRECTI-ME.txt _balicek/Fofrmont-ukazka/PRECTI-ME.txt 2>/dev/null || true
cd _balicek && zip -qr Fofrmont-ukazka.zip Fofrmont-ukazka && rm -rf Fofrmont-ukazka
echo "hotovo: _balicek/Fofrmont-ukazka.zip ($(du -h Fofrmont-ukazka.zip | cut -f1))"
