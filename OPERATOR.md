# OPERATOR — atelier-idej

## Co a proč
Návrh nového webu pro **Ateliér Idej s.r.o.** (IČO 24855561, Nádražní 349/3, Smíchov,
150 00 Praha 5, jednatel Ing. arch. Martin Jirásko, 735 541 757, jirasko96@gmail.com).
Architektonický ateliér — rodinné domy, komerční stavby, rekonstrukce, studie.
Klient nemá web ani jiné podklady než logo; stavíme na zelené louce.

## Koncept
**List papíru, který se popisuje sám.** Jedna dlouhá stránka na teplém papíru
s jemným vláknem; obsah se před očima píše a rýsuje — značka se nakreslí tahem,
nadpisy se píšou, odstavce se odkrývají po řádcích rychlostí čtení, kresby se
rýsují (stroke-dashoffset), fotky se „pokládají" na papír. Ruční poznámky na okraji.

Pojistky: text je celý v DOM od začátku (SEO, čtečky), animace jen odkrývá;
`prefers-reduced-motion` vypíná; klik nebo rychlé rolování nechá psaní okamžitě
doběhnout; plná verze jen při prvním otevření v relaci (sessionStorage).

## Rozhodnutí (1. 10. 2026, s Michaelem)
- Míra animace: **výrazně, ale chytře** (plné psaní jen 1× v relaci, jde přeskočit).
- Rozsah: single page + **detail projektu** + **demo administrace** + **poptávkový formulář**.
- Jazyk: **jen česky** (překlad do EN lze dodělat `tools/prelozit.py` jako u Fofrmontu).
- Logo: **překreslit do čistého vektoru + logotyp**, zachovat myšlenku tří tahů kruhu;
  dodat varianty (horizontální, stohovaná, jednobarevná, favicon).

## Barvy a písmo
Papír `#FAF7F1`, tuha `#1C1A17`, oranžová značky `#F07F1A`, modrá rýsovací linka `#B8C4D0`.
Logotyp a text: Inter (offline, česká podmnožina). Ruční poznámky: Caveat (OFL, diakritika).
Kresby: tenká tuš 1,25 px, žádné stíny v kresbě.

## Dělba práce
- **Factory** (kontrakty): logika psaní a odkrývání, galerie, filtr prací, validace
  a stav poptávky, administrace, Pillow nástroje (varianty fotek, fotka→skica),
  kontrola hotového webu, deterministické statistiky do administrace.
- **Operátor (Claude)**: design systém (`src/assets/style.css`), značka a kresby v SVG,
  šablony (`src/templates/`), `build.mjs`, DOM vrstva (`src/ui/web.js`), texty.
  (SVG a DOM lokální modely opakovaně nezvládly — viz ~/factory/docs.)

## Pravidla projektu
- Stack: python; testy: `uv run pytest -q`; JS moduly se testují přes `tests/jsmod.py`.
- Sestavení: `node build.mjs` → `out/`. Náhled: `.claude/launch.json` → `idej` (port 4390).
- Při `factory run` na projekt nesahat (PATH_POLICY vrací změny mimo soubor kontraktu).

## Stav podkladů
- `podklady/logo/` — zatím nic, k dispozici jen rastrový obrázek loga z přílohy chatu.
- `podklady/prace/` — čeká na fotky prací od klienta. Do té doby jsou práce v ukázce
  **smyšlené** a bude je třeba přemapovat.

## Postup (2. 10. 2026)
- Factory: **9 kontraktů z 9 zelených na první pokus**, 26 iterací, 13 minut,
  70 testů. Nula balíčků k rozhodnutí. Dělba podle ~/factory/docs vyšla přesně:
  modely psaly logiku a nástroje, operátor značku, kresby, šablony a DOM.
- Hotovo: jednostránka, 6 detailů prací, demo administrace, balíček
  `_balicek/atelier-IDEJ-ukazka.zip`, `PRECTI-ME.txt`.
- Náhled: `.claude/launch.json` → `idej` (port 4390), build `node build.mjs`,
  kontrola `uv run python -m tools.kontrola_webu out`.
- Značka překreslena generátorem `tools/znacka.py` (tři tahy kruhu jako data,
  logotyp z Inter v křivkách) → `src/templates/znacka-cesty.mjs`.

## Druhé kolo podle zpětné vazby (2. 10. 2026)
Michael: logo málo detailní, celek se nelíbí, sekce oddělit „kroužkovou vazbou",
logo animovat (složit se a pomalu rotovat), psaní dává smysl jen u psacího písma,
svislá linka vlevo překáží, oranžové ruční texty se povedly.

- **Značka už se nepřekresluje.** Z `podklady/logo/Logo.pdf` se nástrojem
  `tools/znacka.py` vytáhnou skutečné vektory: 69 tahů ve třech barvách
  (#ff8000 silněji, #ff9664 tenčí, černý přejezd), logotyp v Ebrimě a svislé
  „IDEJ" v **aurebeshu** (hvězdněválečná abeceda — vysvětluje IDEJ ↔ JEDI).
  V ukázce je aurebesh zatím vypnutý, čeká se na rozhodnutí.
  Animace: objezd kruhu maskou (stroke-dashoffset na kruhu v masce) a potom
  trvalá pomalá rotace 72 s/otáčku.
- **Blok s drátěnou vazbou:** každá sekce je vlastní `.list`, mezi listy je
  `.vazba` (dlaždice v data-URI: díra + kovový kroužek + stín hrany).
  Svislá linka okraje zrušena.
- **Psaní jen u ručního písma.** `.pise` = Caveat (claim, nadpisy, poznámky),
  `.zjevit` = vysázený text, který se jen položí. V `pisar.mjs` přibyl typ „jev".
- **Kresby od ruky:** `cara()` v `kresby.mjs` rozdělí každou čáru na úseky a
  deterministicky je rozhodí, takže nic není rovné.
- E-mail v datech změněn na info@atelieridej.cz (doména se teprve zakládá).

Podklady prací: zatím dorazily jen dva soubory .rvt (Revit, 1 GB) z jedné
zakázky — v nich není nic použitelného jako obrázek (náhled v souboru je list
s textem). Je potřeba export JPG/PNG nebo PDF.

## Třetí kolo (2. 10. 2026) + nasazení
- **Kroužky se Michaelovi nezobrazily.** Příčina byla dvojí: textury i vazba byly
  `data:image/svg+xml;utf8,…` (Safari takový data-URI odmítá) a hlavně `build.mjs`
  kopíroval z `src/assets` jen `style.css` a fonty. Teď jsou z toho soubory
  (`vazba.svg`, `vlakno.svg`, `stul.svg`) a build kopíruje celou složku assets.
  Poučení: statiku kopírovat adresářem, ne výčtem souborů.
- Úvodní obrazovka: velká rotující značka na pozadí, jen štítek a claim,
  zbytek až po rolování (list „predstaveni").
- Víc psaného: nadpisy služeb a kroků postupu, čísla v „o mně", pobídka k rolování
  a podpis v kontaktu — všechno Caveat a všechno se píše.
- Velké kresby na pozadí listů: půdorys (co dělám), řez (postup), situace (o mně).
- **Podklady klienta ven z gitu:** dva soubory .rvt (1 GB) byly omylem zacommitované;
  historie přepsána `git filter-branch`, `.git` z 994 MB na 328 kB, `podklady/`
  v `.gitignore`. Do cloudu nesmí ani ony, ani Logo.pdf.
- Nasazeno: https://chaospalda42.github.io/atelier-idej-navrh/
  (repo ChaosPalda42/atelier-idej-navrh, workflow Pages jako u Fofrmontu).
