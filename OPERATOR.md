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
