#!/bin/bash
# Zabalí ukázku pro klienta (web + PRECTI-ME).
set -e
KOREN="$(cd "$(dirname "$0")/.." && pwd)"
cd "$KOREN"
node build.mjs
rm -rf _balicek && mkdir -p _balicek/atelier-IDEJ-ukazka
cp -R out/* _balicek/atelier-IDEJ-ukazka/
cp dokumenty/PRECTI-ME.txt _balicek/atelier-IDEJ-ukazka/PRECTI-ME.txt 2>/dev/null || true
cd _balicek && zip -qr atelier-IDEJ-ukazka.zip atelier-IDEJ-ukazka && rm -rf atelier-IDEJ-ukazka
echo "hotovo: _balicek/atelier-IDEJ-ukazka.zip ($(du -h atelier-IDEJ-ukazka.zip | cut -f1))"
