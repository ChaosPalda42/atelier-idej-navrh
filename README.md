# ateliér IDEJ — návrh webu

Klikací ukázka nového webu pro **Ateliér Idej s.r.o.** (Ing. arch. Martin Jirásko, Praha 5).
Není to ostrý provoz, je to návrh k rozhodnutí.

**Živá ukázka:** https://chaospalda42.github.io/atelier-idej-navrh/

## Koncept
Blok papírů v drátěné vazbě. Každá sekce je vlastní list, mezi listy jsou kroužky.
Co je psané rukou, to se před očima opravdu píše; vysázený text se jen pokládá na papír;
kresby se rýsují čárou a žádná není rovná. Značka je vytažená ze zadaného PDF —
při otevření se objede a pak se pomalu otáčí.

## Jak to postavit
    uv sync
    node build.mjs                       # -> out/
    uv run pytest -q                     # 70 akceptačních testů
    uv run python -m tools.kontrola_webu out
    ./tools/pack.sh                      # balíček pro klienta

Značku lze kdykoli znovu vytáhnout z podkladu: `uv run python -m tools.znacka`
(potřebuje `podklady/logo/Logo.pdf`, který se do repozitáře nedává).

## Co je v ukázce vymyšlené
Všech 6 prací, sekce „Kdo to kreslí" a čísla u ní. Skutečné jsou údaje z rejstříku,
jméno architekta, telefon a popis toho, co ateliér dělá. Podrobně v `dokumenty/PRECTI-ME.txt`.
