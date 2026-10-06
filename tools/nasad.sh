#!/usr/bin/env bash
# Nasazení na Český hosting (atelieridej.cz).
#
# Hosting umí aktualizovat obsah webu podle větve v Git archivu domény.
# Do archivu se proto posílá VÝSLEDEK sestavení, ne zdrojáky: pracovní
# kopie v `_nasazeni/` má v kořeni to, co má být v kořeni webu.
#
# Přístup jde přes klíč `~/.ssh/atelier-idej-nasazeni`, žádné heslo se
# nikam nepíše. Klíč je jen na tomhle stroji; když se ztratí, založí se
# nový a starý se smaže v administraci hostingu.
#
# Spuštění:  ./tools/nasad.sh
set -euo pipefail

KOREN="$(cd "$(dirname "$0")/.." && pwd)"
VZDALENY="ssh://atelieridej_cz__git@gonzales.thinline.cz/~/atelieridej.cz"
KLIC="$HOME/.ssh/atelier-idej-nasazeni"
VETEV="nasazeni"
PRAC="$KOREN/_nasazeni"

export GIT_SSH_COMMAND="ssh -i $KLIC -o IdentitiesOnly=yes"

if [ ! -f "$KLIC" ]; then
  echo "Chybí klíč $KLIC — bez něj se na hosting nedostaneme." >&2
  exit 1
fi

echo "— sestavuju ostrou verzi —"
cd "$KOREN"
OSTRY=1 node build.mjs

echo "— kontrola —"
uv run python -m tools.kontrola_webu out

if [ ! -d "$PRAC/.git" ]; then
  echo "— zakládám pracovní kopii pro nasazení —"
  rm -rf "$PRAC"
  git init -q -b "$VETEV" "$PRAC"
  git -C "$PRAC" remote add hosting "$VZDALENY"
fi

echo "— přenáším obsah —"
rsync -a --delete --exclude ".git" "$KOREN/out/" "$PRAC/"

git -C "$PRAC" add -A
if git -C "$PRAC" diff --cached --quiet; then
  echo "Na webu se nic nemění, nic se neposílá."
  exit 0
fi

OTISK="$(grep -o 'style.css?v=[0-9a-f]*' "$KOREN/out/index.html" | head -1 | cut -d= -f3)"
git -C "$PRAC" commit -q -m "nasazení $(date '+%Y-%m-%d %H:%M') (otisk ${OTISK:-?})"
git -C "$PRAC" push -q hosting "$VETEV"

echo
echo "Hotovo. Hosting si obsah stáhne z větve '$VETEV'."
echo "Pokud se web nezměnil, zkontroluj v administraci hostingu:"
echo "  Domény a hosting → atelieridej.cz → Git → Automatická aktualizace"
