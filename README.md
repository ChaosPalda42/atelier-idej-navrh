# ateliér IDEJ — návrh webu

Klikací ukázka nového webu pro **Ateliér Idej s.r.o.** (Ing. arch. Martin Jirásko, Praha 5).
Není to ostrý provoz, je to návrh k rozhodnutí.

**Živá ukázka:** https://chaospalda42.github.io/atelier-idej-navrh/

## Koncept
Blok papírů v drátěné vazbě. Každá sekce je vlastní list; na horní hraně má kroužky,
proražené díry a mikroperforaci, a každý druhý list je pauzák. Co je psané rukou,
to se před očima opravdu píše. Obrázky na webu jsou skutečné skici architekta —
dopsané kresby zůstaly jen jako bledé vodoznaky na pozadí listů. Značka je vytažená
ze zadaného PDF — při otevření se objede a pak se pomalu otáčí.

## Jak to postavit
    uv sync
    node build.mjs                       # -> out/
    uv run pytest -q                     # 121 akceptačních testů
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
Složka `data/kresby/` je zatím prázdná — ukázkový půdorys, který v ní byl, byl vymyšlený
a šel pryč. Jakmile v ní nějaký výkres bude, stačí ho u služby v `data/site.json`
odkázat klíčem `vykres` a objeví se na listu té sbírky.
Podrobný návod pro klienta je v `dokumenty/JAK-DODAT-VYKRESY.txt`.

## Obsah přes administraci
Texty, projekty i nahrané obrázky se spravují v `administrace.html` (demo: stav
v localStorage, obrázky v IndexedDB). Druhá cesta je přímo přes repozitář: skicu
stačí položit do `zdroje/skici/` jako obrázek + JSON s popisem a zařazením,
nasazení ji prožene `tools/skici.py --jen-nahrane` (vybělí, zprůhlední, tři velikosti)
a slije s manifestem.

## Zástupné fotografie
Dokud architekt nepošle fotky realizací, mají listy projektů kreslené plotny:

    uv run python -m tools.ukazky 10     # -> data/obrazky/ukazka-*.jpg + ukazky.json

Jsou deterministické a kreslí se Pillow — žádné cizí snímky. Hledá se systémové
písmo s češtinou (Arial, DejaVu, Liberation); když žádné není, popis se vysází
bez diakritiky, protože výchozí písmo Pillow háčky nemá.

## Co je v ukázce vymyšlené
Popisky u jednotlivých skic, texty na čtyřech listech sbírek, popisky polí ve formuláři
a bledé kreslené vodoznaky na pozadí listů. Všechny texty webu, všech 11 skic, razítko
i údaje z rejstříku jsou od architekta. Podrobně v `dokumenty/PRECTI-ME.txt`.
