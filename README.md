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

## Z výkresu kresba
Soubory `.rvt` přečíst nejde (Revit na Macu neběží, formát je uzavřený).
Z **DXF** nebo z **vektorového PDF** ano:

    uv run python -m tools.vykres podklady/vykresy/pudorys.dxf dum-pudorys \
        --slabe "A-ANNO-DIMS" --tolerance 18 --nejkratsi 60

Nástroj vytáhne čáry, spojí navazující, zjednoduší je (Douglas–Peucker),
zahodí drobty a vmestná do rámečku; výsledek jde do `data/kresby/*.json`
a web ho nakreslí stejnou rukou jako ostatní kresby (`src/lib/kresleni.mjs`).
Podrobný návod pro klienta je v `dokumenty/JAK-DODAT-VYKRESY.txt`.

## Co je v ukázce vymyšlené
Všech 6 prací, sekce „Kdo to kreslí" a čísla u ní. Skutečné jsou údaje z rejstříku,
jméno architekta, telefon a popis toho, co ateliér dělá. Podrobně v `dokumenty/PRECTI-ME.txt`.
