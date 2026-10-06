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

## Čtvrté kolo (2. 10. 2026)
- **Rozbité rolování na listu „představení"**: sekce neměla třídu `sekce`, takže
  na ní neplatila mřížka, a globální `position: sticky` u `.sekce-hlava` nechalo
  text podjíždět pod značku. Přidána třída; zbytek listů byl v pořádku.
  Poučení: `.sekce-hlava` je lepkavá — list bez mřížky znamená překryv.
- **Přechody mezi listy**: listy už mezi sebou nemají mezeru se stolem. Leží na
  sobě jako v bloku: nahoře světlý řez papíru, pod ním měkký stín, který horní
  list vrhá na spodní, a přes hranu jdou kroužky. Stín má blok jako celek
  (boky u všech listů, nahoru u prvního, dolů u posledního), ne každý list zvlášť.
- Adresy stylů a skriptů dostaly otisk (`?v=…`), aby po nasazení nikdo nekoukal
  na starou verzi z mezipaměti.

## Páté kolo (2. 10. 2026) — z výkresů skutečné kresby
Michael chce, aby kresby vznikaly ze skutečných staveb. Soubory `.rvt` to neumožní:
Revit na Macu neběží, formát je uzavřený a obsah streamů je komprimovaný
(ověřeno — čitelné je jen „Data generated by Autodesk Revit"); vložený náhled
je list s textem. Do Autodesk cloudu se to posílat nebude, jsou to data zakázek.

Postavena cesta pro formáty, které přečteme lokálně:
- `tools/vykres.py` (operátor) — čtečka **PDF** (vlastní interpret content streamu
  včetně `q/Q/cm`, Bézierů a `re`; dělí čáry na silné/slabé podle šířky tahu)
  a **DXF** (ezdxf + `recursive_decompose`, slabé podle vrstvy nebo lineweight).
- `tools/geometrie.py` (C-010, Factory) — délka, rámeček, Douglas–Peucker,
  slévání navazujících čar, zahazování drobtů, vmestnání do rámečku s otočením y.
- `src/lib/kresleni.mjs` (C-011, Factory) — ruka: deterministický generátor,
  rozhození bodů kolmo na směr, cesta. Kresby i značka teď kreslí tímtéž kódem.
- `kresbaZDat()` v `kresby.mjs`, data v `data/kresby/*.json`, práce je odkazuje
  polem `vykresy`. Build je načte sám.

Factory: 11 z 11 zelených, 89 testů. Ukázka cesty: `podklady/vykresy/pudorys-ukazka.dxf`
(vyrobený ezdxf jako napodobenina revitího exportu) → `data/kresby/ukazka-pudorys.json`
→ na detailu „Dům nad sadem". V PRECTI-ME je napsané, že to není jeho zakázka.

Pro klienta: `dokumenty/JAK-DODAT-VYKRESY.txt` (Revit → Export → CAD Formats → DXF).

## Šesté kolo (2. 10. 2026) — skutečný materiál
Michael poslal `WEB.zip`: **11 skic architekta** (propiska, fix, pastelka na papíře),
pojmenovaných podle skupin — bytové domy (5), rodinné domy (4), interiéry (1), garáže (1).
Žádné fotky staveb, žádné výkresy.

Z toho plyne přestavba obsahu:
- **Vymyšlené zakázky jsou pryč.** Sekce „Vybrané práce" → **„Ze skicáku"**:
  zeď skic (CSS columns, mírné natočení, lightbox), filtr podle skupin.
  Místo šesti smyšlených detailů jsou **čtyři listy skupin** (rodinné domy,
  bytové domy, interiéry, garáže) s texty o tom, jak se ten typ práce bere.
- **Služby přepsány podle toho, co opravdu dělá** (ne „komerční stavby
  a rekonstrukce", ale rodinné domy / bytové domy / interiéry / garáže
  a přístavby) + tři nové kresby ke službám.
- `tools/skici.py`: skeny se vybílí **odečtením rozmazaného pozadí** (percentil
  nestačil, skeny z mobilu mají nerovnoměrné osvětlení) a web je nasadí
  v `mix-blend-mode: multiply`, takže kresba leží rovnou na papíře listu
  a nevidí se žádný rámeček. Varianty 520/1040/1600 px, poměr se neořezává.
- Administrace spravuje skici (tentýž `administrace.mjs`, jen jiná data).

Chyba, která se našla až teď: `.svetelny-stul { display: flex }` přebíjelo atribut
`hidden`, takže přes každou stránku ležel neviditelný lightbox. Přidáno
`[hidden] { display: none !important; }` do resetu.

V ukázce zůstává vymyšlené už jen: dva odstavce „Kdo to kreslí", tři čísla pod nimi
a popisky čtyř skupin. Je to napsané v PRECTI-ME.

## Sedmé kolo (2. 10. 2026) — administrace na víc listů
Michael: administrace má umět hlavně texty, přehledně, ne všechno na jedné stránce.

- **Osm listů** místo záložek: Přehled, Texty webu, Co dělám, Jak to probíhá,
  Skici, Poptávky, Kontakt, Záloha. Vlevo postranní navigace s popiskem u každého.
- **Editovatelné je všechno, co je na webu napsané** (49 polí jen na listu textů):
  každý řetězec má klíč a na stránce mu odpovídá `data-text="<klíč>"`.
  Klíče začínající `site.` míří do `data/site.json` (služby, postup, texty skupin),
  ostatní do `data/texty.json`. Schéma se skládá **z dat při sestavení**, takže
  když přibude služba nebo krok postupu, objeví se v administraci sama.
- U každého pole je vidět, že je změněné, a je u něj „Vrátit původní" i původní
  znění. Přehled vypisuje všechny změny na jednom místě.
- Skici: pořadí, název, skupina, skrytí (skrytá se na webu nevykreslí).
- Pořád to stojí na jediném testovaném modulu `src/lib/administrace.mjs` —
  přibyla jen data, ne nová logika.

## Oprava (2. 10. 2026): starý uložený stav mazal skicák
Michael: „sekce vybrané práce přestaly fungovat". Příčina: `prepisy()` v `web.js`
mazalo z mřížky každou kartu, kterou nenašlo v uloženém stavu administrace
(`karta.remove()`). Kdo si prohlédl administraci před přestavbou na skici, měl
v prohlížeči uložené staré slugy (`01-obrazek`, `dum-nad-sadem`) — a protože se
žádný neshodoval s novými, zmizely **všechny** skici.

Pravidlo, které z toho plyne: **uložený stav z prohlížeče nesmí nikdy nic
odstranit.** Smí jen přejmenovat, přeřadit a skrýt to, co na stránce opravdu je;
pořadí se použije jen tehdy, když stav aspoň něco z téhle stránky zná.
V administraci se uložený stav navíc při načtení srovná se skutečným seznamem
skic (`srovnejSeSkicami`) — co zmizelo, se zahodí, co přibylo, se doplní.
Ověřeno: starý stav → všech 11 skic zůstane; skrytí a přejmenování z administrace
pořád fungují; filtr taky.

## Oprava (2. 10. 2026): 404 a staré adresy
Michael přišel na `prace/overovaci-studie-navsi.html` → 404 od GitHubu. Dvě věci chyběly:
- **Vlastní 404** (`out/404.html`, GitHub Pages ji servíruje na každou neznámou adresu):
  stejný papír, psaný nadpis, tři odkazy. Protože web běží v podsložce
  (`/atelier-idej-navrh/`), musí si odkazy na 404 dopočítat kořen z `location.pathname` —
  relativní cesty by se odvíjely od adresy, která neexistuje.
- **Přesměrování šesti starých adres** z verze s vymyšlenými zakázkami na odpovídající
  listy skupin (meta refresh + canonical + noindex).

## Osmé kolo (2. 10. 2026) — skici jako exponáty
Michael: skici nemají být samostatná sekce, ale rozeseté po celém webu „jako muzeum,
kde člověk narazí na exponát". A: odstranit jim pozadí, zvýraznit až pod myší,
kliknutím ukázat původní skicu. Plus hlásil špatné otočení.

- **Otočení**: 7 z 11 fotek mělo orientaci jen v EXIF (hodnota 6 = 90°) a Pillow ji
  sám neaplikuje. `ImageOps.exif_transpose` → 8 skic je teď na šířku, jak mají být.
- **Pozadí pryč**: `pruhledne()` v `tools/skici.py` dělá z vybílené kresby RGBA —
  alfa = 255 − min(R,G,B), barva se z bílé vydělí zpátky
  (C' = (C − min)·255/(255 − min)), jinak by světlé tahy vybledly. PNG se kvantuje
  na 96 barev, jinak by bylo třikrát větší. Vedle toho se ukládá **sken s papírem**
  (`-sken-`), který se ukáže v lightboxu po kliknutí.
- **Rozmístění** je data: `vystavka` v `site.json` říká u každé skici `kam`
  (predstaveni / co-delam / postup / o-mne / kontakt / vystava-1..3), `styl`
  (okraj / presah / vystava), natočení, výšku přesahu a popisek.
  Sekce „Ze skicáku" zrušena, čísla sekcí přečíslována.
- **Chování**: ve výchozím stavu je exponát ztlumený (opacity .78, menší sytost),
  pod myší se narovná, zvětší, objeví se pod ním světlá „vitrína" a popisek zoranžoví.
- Sekce s přesahem si uvolní 16 % šířky vpravo, aby skica neležela na textu
  (při 25 % se rozpadla mřížka služeb do jednoho sloupce).
- Popisky exponátů jsou editovatelné v administraci (`site.vystavka.N.poznamka`).

## Deváté kolo (2. 10. 2026) — psaní ven, exponáty jinak
Michael: zrušit psaní u běžného textu (nechat jen oranžové poznámky a podpis),
některé kresby nesedí, přesah nemá pokračovat na stole, zvýraznění obrátit
(ztmavit okolí místo zesvětlení kresby) a dát kresbě měkké okraje.

- **Psaní jen u ruky**: `pise` zůstalo na `.poznamka`, `.podpis` a pobídce
  k rolování; nadpisy i claim (pořád Caveat) se teď jen klidně objeví (`zjevit`).
- **Kresba domu v úvodu kolidovala** s exponátem v okraji — na vině byla lepkavá
  `.sekce-hlava`, která se při rolování sunula přes kresbu pod sebou.
  Na úvodním a výstavním listu je teď statická.
- **Přesah se ořízne hranou listu**: exponáty s přesahem jsou v obalu `.presahy`
  (`position: absolute; inset: 0; overflow: hidden`), takže na stole kresba
  nepokračuje. Obal nesmí být na `.list` samotném, jinak by zmizely kroužky vazby.
- **Obrácené zvýraznění**: `.setmeni` (fixní, 46 % tmavá) se rozsvítí, když je
  kurzor na exponátu; kresba zůstane plná a dostane pod sebe **měkké světlo**
  (radiální přechod z barvy papíru, žádná hrana).
  Past, do které jsem spadl: exponát je uvnitř vrstvy listu s vlastním pořadím
  vykreslování (`.list > * { z-index: 1 }`, `.presahy { z-index: 2 }`), takže
  samotné `z-index: 60` na exponátu nestačí — JS zvedá i ten obal (`.nad-setmenim`).
  Kvůli tomu zrušena `isolation: isolate` na `.list`.
- Na užších oknech (do 1100 px) se přesahy zařadí do textu, ale jen do 360 px
  a až na konec sekce (`order: 2`), jinak zabraly celou šířku listu.

## Desáté kolo (3. 10. 2026) — odkrývání ven, pauzák, načítání, zvětšení
Michael: sekce „Jak to probíhá" se nenačetla, dokud na ni neklikl; vypnout
tenhle způsob odkrývání; kroužková vazba se nelíbí; chybí načítací animace;
exponát by se měl pod myší i zvětšit.

- **Chyba v odkrývání (C-002)**: `kSpusteni` startovalo jen podle toho, jakou
  část má prvek vidět. Sekce vyšší než ~5 obrazovek vyplní celý výřez, ale její
  vlastní viditelnost zůstane pod prahem (800 px ze 6000 = 0,13) — nespustila se
  nikdy. Kontrakt doplněn o `podilVyrezu` a pravidlo „viditelnost >= prah **nebo**
  podilVyrezu >= prah". **Pozor, past, do které jsem spadl podruhé:** první běh
  Factory se tloukl o můj špatný test (napsal jsem 0.15 místo 0.1333 — spočítal
  jsem to pro jiný výřez). Model psal správný kód a padalo to na mém tvrzení.
  Po opravě testu prošly brány napoprvé (`factory gates C-002` → green, 91 testů).
- **Odkrývání textu zrušeno úplně** — `zjevit` i `polozit` pryč ze šablon i z motoru.
  Plán teď řeší jen psaní rukou a rýsování kreseb.
- **Pauzák místo kroužků**: každý druhý list je průsvitný, chladnější
  (`list--pauzak`, přiřazuje se při sestavení). Přechod je řez listu + stín,
  který vrhá na list pod sebou (`.hrana`).
- **Načítání**: na prázdném papíře se objezdem nakreslí kruh, dopíše se logotyp
  a pak kruh **přeletí na své místo** v záhlaví (FLIP: změří se cíl a dopočítá
  měřítko i posun). Jen při prvním otevření v relaci.
- **Zvětšení pod myší**: měřítko se **nepočítá podle velikosti kresby, ale podle
  okna** — malá skica se zvětší až 3,2×, velká skoro vůbec, a pak se dorovná
  posunem, aby zůstala celá v okně. Popisek při zvětšení ustoupí.
- **Dotyk**: `@media (hover: none)` — kresby jsou rovnou plné, nic se neztmavuje,
  klepnutí otevře původní sken.

## Jedenácté kolo (3. 10. 2026) — kruh za textem a mezera v kruhu
- **„Proč je tam ta mezera v kruhu?"** Nebyla v logu. Maska, kterou se kruh
  objíždí (`<mask>` s `znacka-objezd`), neměla **vlastní rozsah** — použil se
  výchozí (−10 %/120 %), který se u `maskUnits="userSpaceOnUse"` počítá
  z viewportu, a ten kresbu ořízl. A protože se kruh pomalu otáčí, ten zářez
  putoval dokola, takže byl pokaždé jinde. Ověřeno měřením: v datech značky
  není jediný úhel bez bodu. Maska teď dostává `x/y/width/height` s rezervou
  160 jednotek.
- **Kruh ustupuje textu**: `.uvod-znacka` má CSS masku — radiální přechod
  (74 % × 32 % se středem u levé hrany), takže kresba v pásu, kudy jde claim,
  měkce zmizí a nad ním i pod ním zůstane celá. Žádná viditelná hrana.
  Na úzkém okně je text nad kruhem, tam se maska vypíná.

## Dvanácté kolo (3. 10. 2026) — texty od architekta
Michael poslal `web_proces.docx`: architekt prošel web a **napsal vlastní texty**
(dokument vznikl před přestavbou, takže platí jen textová část).
Vytaženo z docx (text i obrázky s šipkami) a namapováno podle toho, u kterého
snímku která poznámka stála.

Co se změnilo:
- **Claim**: „Společně přetváříme Vaše ideje v realitu"; pobídka zkrácena na „Rolujte…".
- **Představení, čtyři služby, pět kroků postupu, celé „O nás", text u kontaktu** —
  všechno jeho slovy. Služby se přeskládaly: rodinné domy / komerční stavby /
  rekonstrukce a přestavby / **bytové domy** (místo interiérů a garáží, které
  zůstávají jako sbírky skic).
- **„O nás"** má novou stavbu: claim „Ateliér Idej je nástroj stavebníka",
  dva bloky s nadpisy (Idej, Ing. arch. Martin Jirásko) a závěrečný odstavec.
- **Dvě volné věty z dokumentu** zařazeny tam, kam tónem patří:
  „Každý prostor si zaslouží jasnou ideu a promyšlené řešení." jako perex
  sekce Co děláme, „Koexistence, kontrast, udržitelnost" jako poznámka na okraji.
- **Vymyšlené texty pryč**: čísla 24/4 roky/7 měsíců, délky kroků postupu,
  poznámky na okraji, které jsem psal já, a odstavce o architektovi.
- **Hlas sjednocen na množné číslo** („navrhujeme, odpovídáme"), jak píše on.
- **Razítko** z dokumentu (`podklady/razitko/`) prošlo stejnou cestou jako skici
  a sedí u podpisu v kontaktu.
- „Tady je nějaký divný ořez" u úvodní obrazovky — to byla ta maska, opravená
  už v jedenáctém kole.

## Oprava (3. 10. 2026): věta se skicami
Michael: „ta věta se skicama tam nepatří". Visela na konci mřížky služeb bez
souvislosti. Odkazy na čtyři sbírky skic se přesunuly do **patičky** (tam patří
druhotná navigace) a z hlavní navigace zmizela položka **„Práce"** — mířila na
`#prace`, což je kotva zrušené sekce, takže nevedla nikam.

## Třinácté kolo (5. 10. 2026) — vazba zpátky, a tentokrát pořádně
Architekt poslal `web_proces.pdf` (sedm stran, screeny ještě z verze před
přestavbou). Michael: *„I když s ním nesouhlasím, bude to jeho web."* Tři věci:
vrátit kroužkovou vazbu v realističtější podobě, nahradit moje kresby jeho
skicami a vrátit sekci ukázek prací. Rozhodnutí k otevřeným bodům padla
v AskUserQuestion: kroužky **i** pauzák, chybějící skici nahradit tím, co je,
kreslené vodoznaky na pozadí nechat.

**Vazba (C-012 + operátor).** Rozmístění kroužků dělá Factory
(`src/lib/vazba.mjs`, 3 iterace, zelená): poloha je čistě geometrická (první
sedí na okraji, poslední taky, mezera nikdy nepřeroste rozestup), náklon,
odlesk a krytí stínu jdou z LCG nasazeného seedem — každý list má jiný, takže
vazba není tapeta. Kreslení je operátorské: `<symbol>` v `defs()` a `<use>`
na každý kroužek.

Dvě věci, které to rozhodly:
- **Kroužek nesmí mít pevnou velikost v pixelech.** První verze měla pevných
  30 px a procentní rozteč; na okně užším než návrhových 1180 px do sebe
  sousedi najeli. Teď je celá vazba jedno SVG přes šířku listu a škáluje se
  vcelku. Posun nad hranu se dělá **procentním `margin-top`** — procentní
  marginy se počítají ze šířky rodiče, takže se zmenšuje spolu s kresbou.
- **Bez viditelného švu vazba neváže.** Dokud byl přechod mezi listy jen
  náznak, vypadal drát jako hřebíky zapíchnuté do jednolitého papíru. Teprve
  když horní list dostal pořádný řez a stín na list pod sebou, začalo to číst
  jako blok. Mimochodem přesně ten stín, který se Michaelovi v šestém kole
  nelíbil — sám o sobě je to rušivá hrana, s drátem je to vazba.

Vazba se vkládá **jedním průchodem** v `oblecListy()` (layout.mjs) nad hotovým
tělem stránky, ne v jednotlivých šablonách: list vzniká na pěti místech a na
vazbu by se někde zapomnělo. Tentýž průchod prostřídává pauzák — a patička
musela do něj, jinak na ní vazba chyběla (byla připojená až za `${telo}`).

**Jeho skici místo mých kreseb.** Hlavička listu představení, čtyři karty
služeb. Dopsané kresby (`kresbaHero`, `KRESBY`, `zastupnaSkica`) jsou smazané.
Vymyšlený ukázkový půdorys taky — ale cesta pro skutečný výkres z DXF zůstává
zapojená: `data/kresby/*.json` + `vykres` u služby, složka je zatím prázdná.
Ke „Komerčním stavbám" je garáž a k „Rekonstrukcím" rodinný dům; nic bližšího
architekt nemá, je to poznamenané v PRECTI-ME.

**Vybrané práce zpátky.** Sekce 02, filtr z C-003 a mřížka všech 11 skic ve
sloupcích (`columns`, ne grid — skici mají od 582 do 3212 px výšky a v mřížce
by kolem nízkých zůstaly díry). Výstavka se ztenčila z jedenácti míst na šest
a tři „vitrínové" listy zmizely: co je v mřížce, nemá smysl mít na webu
potřetí. Položka **Práce** je zpátky v navigaci, kotva `#prace` zase existuje,
takže fungují i přesměrování starých adres a odkaz „Zpátky na skicák".

**Texty.** Perex u služeb je prázdný a věta „Každý prostor si zaslouží jasnou
ideu a promyšlené řešení." se přesunula tam, kam ji architekt zakreslil —
jako poznámku na okraji u Vybraných prací. Navigace přešla na množné číslo
(Co děláme / O nás). Razítko jde k pravému okraji sloupce a výškou sedí na
podpis, jak to má v připomínkách nakreslené.

**Mimochodem nalezeno:** administrace neměla **vůbec žádný styl pro vlastní
rozcestník** (`.admin-nav`) — osm listů se vysypalo jako věta inline odkazů.
Chybělo to od začátku, jen si toho nikdo nevšiml. Doplněno; architekt si
v PDF říká, že texty chce přepisovat sám, takže na tom záleží.

**Review u C-012 se mýlila.** Verdikt „fix: u neplatného vstupu házej výjimku"
jde proti kontraktu i akceptačnímu testu, které prázdné pole vyžadují. Modul
zůstal, jak je. (Viz poučení z příručky: správná akce pod špatným verdiktem.)

## Oprava (5. 10. 2026): skici jen tam, kam patří
Michael: *„odstraňme ty jeho skici, co jsou random po webu — použijeme je jen
tam, kde to chtěl."* Rozesetí po listech (nápad z osmého kola) tím končí.
Skici jsou teď na čtyřech místech, a všechna si vyžádal architekt: přehled
**Vybraných prací**, **karty čtyř služeb**, **list představení** a **listy
sbírek**. Pryč šlo pole `vystavka` ze `site.json`, `rozmisti()`, parametr
`exponaty` u `sekce()`, obálka `.presahy` i styly `.exponat--okraj`,
`.exponat--presah`, `.sekce--s-presahem` a mrtvý `.vystava` (vitrínový list
zmizel už v třináctém kole). `exponat()` zůstává jen pro listy sbírek, takže
na nich dál funguje zvýraznění pod myší i zvětšení. V administraci se skupina
„Popisky u skic" scvrkla na „Skicák" — popisky k jednotlivým rozmístěním
už nejsou k čemu.

## Doladění (5. 10. 2026): čtvercový formát a vazba na prvním listu
Architekt: *„Vybrané práce dej k těm obrázkům jednotný čtvercový formát,
já si pak k jednotlivým ukázkám skicnu novou skicu"* a *„takhle ve třech
sloupcích bomba"*.

- Mřížka přešla ze `columns` na **grid napevno 3 sloupce** (2 pod 920 px,
  1 pod 560). Pružný `auto-fill` by na širokém okně udělal pět sloupců,
  a on chválil právě ty tři.
- Pole je **čtverec** (`aspect-ratio: 1`) a skica v něm sedí `object-fit:
  contain`, tedy **nikdy se neořízne** — výšky jsou od 582 po 3212 px
  a `cover` by z vysokých udělal výsek. Prázdné místo kolem je papír listu,
  skici mají průhledné pozadí. Natočení karet zrušeno, „jednotný formát"
  znamená srovnané.
- **Vazba prvního listu výš.** Nešla posunout uvnitř listu: `.uvod` má
  `overflow: hidden` kvůli kruhu, který z něj vyčuhuje vpravo, takže drát
  přetékající nahoru uřízl. Vazba prvního listu se proto kreslí **před**
  listem v obalu `.vazba-vrch` (výška 0, `z-index: 5`) a přehýbá se přes
  horní hranu bloku ven na stůl jako u ostatních listů. Pozor: tím přestal
  platit `.blok > .list:first-child`, od kterého se odvíjel horní stín —
  první list má teď třídu `list--prvni`.

## Šestnácté kolo (5. 10. 2026) — listy projektů
Architekt: *„po kliknutí na tu skicu by měl do budoucna vyjet detail projektu
včetně dalších fotografií."* Michael: postavit hned, s lorem ipsum a vzorovými
obrázky. Projekt je nový tvar v `site.json`: `{slug, nazev, misto, rok, stav,
typ, anotace, text[], skici[], fotky[]}`. `typ` schválně odpovídá id skupiny
skic, takže filtr z C-003 i `sousedi()` fungují beze změny.

Dlaždice ve Vybraných pracích teď vede na list projektu (a nemá lupu — ta by
si s odkazem konkurovala). Skici bez projektu by lupu měly dál, dnes ale patří
všech jedenáct k některému ze šesti ukázkových projektů.

**Zástupné fotografie (C-013, zelená na 2 iterace).** `tools/ukazky.py` kreslí
plotny v poměru 3:2 — papírový tón, rám, rohové značky, nápis „UKÁZKOVÁ
FOTOGRAFIE". Deterministické, nic se nestahuje.

Tři věci, na které kontrakt nestačil a musely se dodělat ručně:
- **Kam se zapisuje.** V kontraktu jsem zapomněl říct cestu, worker zvolil
  `out/ukazky` a testy to neodhalily, protože si `VEN` přepisují monkeypatchem.
  Review to tentokrát trefila. → `KOREN / "data" / "obrazky"`.
- **`main()` ignorovala příkazovou řádku** (`argv=None` → prázdný seznam →
  výchozí 4), takže `python -m tools.ukazky 10` dělalo čtyři plotny.
- **Písmo.** Kontrakt říkal `load_default()`; jenže výchozí Aileron nemá háčky
  a „UKÁZKOVÁ" vyšlo jako „UK□ZKOV□". Inter z `src/assets/fonts` nepomůže —
  je to woff2 subset, ze kterého Pillow glyfy nedostane (a woff2 by chtělo
  Brotli navíc). Teď se hledá první systémové písmo, které má `ŘůÁ` v cmapě
  (ověřuje fontTools), a když žádné není, popis se vysází bez diakritiky.

Poučení do dalších kontraktů: **u nástroje, co něco zapisuje, patří cesta do
kontraktu** — jinak si ji worker vymyslí a akceptační test, který si cíl
přepisuje, to nemá jak chytit.

## Sedmnácté kolo (5. 10. 2026) — správa webu přes git
Architekt se ptá, jak si bude přidávat skici. Michael zvolil opravdový admin
přes git, ne demo v prohlížeči.

**Proč ne localStorage.** Administrace drží stav v jednom klíči (~5 MB na
doménu). Jedna skica v base64 má přes půl mega, takže po třech čtyřech je plno
a `setItem` tiše spadne. A hlavně: cokoli uloženého v prohlížeči se na veřejný
web nedostane.

**Jak to teď jede.** `/sprava/` je Decap CMS. Nahraná skica se uloží do
`zdroje/skici/` (obrázek + JSON s popisem a zařazením), tím se spustí
nasazení, v něm `tools/skici.py --jen-nahrane` skicu vybělí, zprůhlední
a zmenší, slije ji s manifestem a web se sestaví znovu. Režim `--jen-nahrane`
existuje proto, že na serveru není `podklady/` — plný běh by manifest vymazal.

**Schéma se generuje z dat** (`src/templates/sprava.mjs`). CMS chce vyjmenovat
každé pole; texty jich mají přes devadesát. Ručně psaný `config.yml` by se
rozešel s daty při první změně, takhle se skládá ze stejných dat jako web
a demo administrace. Hlídá to `tests/test_sprava.py` — mimo jiné že **každý
klíč z texty.json jde ve správě přepsat**; rozbité YAML se jinak nijak
neprojeví, jen se správa po otevření zasekne na prázdné stránce.

Co musí zařídit Michael (zvenčí to nejde): OAuth aplikaci na GitHubu
a přihlašovací můstek, jeho adresu pak jako proměnnou `SPRAVA_MOST`
v nastavení repozitáře. Návod je v `dokumenty/SPRAVA-WEBU.txt`.

**Past, do které jsem spadl:** `tools/skici.py` na začátku plného běhu mazal
z `data/obrazky` *všechny* .jpg a .png — tedy i plotny z `tools/ukazky.py`.
Projevilo se to až v kontrole webu jako chybějící obrázek na listu projektu.
Teď maže jen to, co samo vyrábí (`MOJE`). Pravidlo: **nástroj, který uklízí
výstupní složku, musí poznat vlastní soubory** — složku s ním sdílí někdo jiný.

**Na tomhle Macu pozor:** `npx decap-server` poslouchá na 8081, což je port
llama-serveru. Při zkoušení správy lokálně mu dát jiný (`PORT=8083 npx
decap-server` a stejný port v `local_backend`).

## Doladění (5. 10. 2026): skici na listu projektu v klidu
Architekt: *„u listu projektu zruš to zvětšování a ztmavování, tam už to ty
skici nepotřebují."* Má pravdu — zvýraznění vzniklo pro skici rozeseté v textu,
kde se musely z listu vytáhnout. Na listu projektu stojí samy za sebe vedle
fotek, není z čeho je vytahovat.

Exponát proto umí režim `klid` (`data-klid`): kresba je rovnou plná (bez
`opacity: .78` a `saturate(.78)`), pod myší se nic neděje, okolí se nesetmívá.
`exponaty()` ve web.js si je rovnou nevybírá (`.exponat:not([data-klid])`),
takže se na ně zvětšení ani nenavěsí. Klepnutím se pořád otevře původní sken —
to je lupa, ne zvýraznění. Na listech sbírek zůstává efekt beze změny.

## Oprava (5. 10. 2026): pozadí listů končí na hraně, ne na stole
Bledé kresby na pozadí (půdorys, řez, situace) schválně přetékají přes okraj
listu — jenže přetékaly dál než na jeho hranu a čáry pokračovaly po stole.
`overflow: hidden` na `.list` dát nejde, uřízl by kroužky vazby, které přes
horní hranu přečuhují naschvál. Kresby proto sedí v obalu `.pozadi-ram`
(`inset: 0`, `overflow: hidden`) — stejný trik, jakým se dřív ořezávaly
přesahující exponáty. Vazba zůstává nedotčená, protože je mimo ten obal.

## Osmnácté kolo (5. 10. 2026) — nářadí na prkně
Architekt: *„mohli bychom na různá místa dát pár tužek, pravítko, kružítko,
gumu?"* Pět kusů v `kresby.mjs`: `kresbaTuzka`, `kresbaPravitko`,
`kresbaKruzitko`, `kresbaGuma`, `kresbaTrojuhelnik`, pokládá je `naradi()`.
Kreslí se stejnou rozhozenou rukou jako výkresy, jen zřetelněji (krytí 0,45) —
neprosvítají papírem, leží na něm. Sedí v `.pozadi-ram`, takže se na hraně
listu ořežou; pod 1100 px, kde se levý okraj ztrácí, se schovají.

Rozmístění: pravítko přes levý dolní roh listu „Co děláme" (přesahuje ven),
guma a trojúhelník do okraje u prací a „O nás", kružítko u postupu, tužka
u kontaktu. Na listu představení nářadí není — okraj tam drží logo a pod ním
hned začíná velká skica.

Dvě věci, které stály za přepracování:
- **Kružítko a guma z čar nečetly.** Kružítko byly dvě čárky do špičky; teprve
  plochá ramena (uzavřené čtyřúhelníky), kloub, hlavice a držák tuhy z toho
  udělaly nástroj. Guma byl obdélník s linkami; teprve kvádr v perspektivě
  (čelo + horní plocha + bok) a papírová manžeta.
- **Kontrola kolizí měřená moc brzy lže.** Poprvé vyšlo „nikde nic", protože
  oranžové poznámky se teprve dopisovaly a měly jiný box — guma pak na jedné
  seděla. Napoprvé se musí stránka projet celá, počkat, až se poznámky dopíšou,
  a teprve potom měřit.

## Doladění (5. 10. 2026): nářadí po celém webu
Michael: *„vypadá to, že je to vše na stejném místě; rozházej to, může to být
i za textem, a klidně 2–3× víc."* Z pěti kusů je osmnáct na sedmi listech.

Nářadí má teď dvě polohy. **V okraji** (krytí 0,45) je vidět jako odložený
nástroj; **pod textem** (`naradi--tlume`, krytí 0,24) prosvítá zpod odstavců
jako otisk na prkně. Druhá poloha je možná jen proto, že `.naradi` má
`z-index: 0` a obsah listu 1 — nářadí je tedy vždycky pod textem, ne nad ním,
a nemůže se stát, že by se do něj zamíchalo.

Čísla, na kterých to stojí: 0,17 bylo pod textem **tak málo vidět, že to
vypadalo jako šmouha v papíru**, 0,45 naopak rušilo čtení. 0,24 sedí.

Kontrola kolizí (projet stránku, počkat na dopsání poznámek, pak měřit) běží
jen na nepřitlumené kusy — u přitlumených je překryv s textem záměr. Hlídá se
i to, že každý přesahující kus má nad sebou ořezový rám: pět jich přesahuje,
čtyři ořezává `.pozadi-ram` a jeden (pravítko na úvodním listu) `.uvod`
vlastním `overflow: hidden`.

## Devatenácté kolo (5. 10. 2026) — projekty a nahrávání patří do administrace
Michael: *„už tam máme demo administraci, tak ta úprava a nahrávání jeho
projektů by měla probíhat tam."* Má pravdu a **Decap CMS (`/sprava/`) proto
končí** — dvě administrace vedle sebe jsou horší než jedna. Zůstává druhá
cesta přes repozitář: skica položená do `zdroje/skici/` (obrázek + JSON)
projde při nasazení `tools/skici.py --jen-nahrane`.

**C-006 rozšířena** (zelená, 121 testů): `pridejProjekt`, `upravProjekt`,
`smazProjekt`, `presunProjekt` a hlavně `srovnejSeznam(ulozene, zeSouboru)` —
obecné slévání uloženého stavu se stavem webu. Nahradilo `srovnejSeSkicami()`
z admin.js, které **zahazovalo položky, o kterých soubor neví** — tedy přesně
to, co si uživatel sám nahraje. Teď se použije na skici i na projekty.

**Obrázky do IndexedDB, ne do localStorage.** Jedna skica v base64 má přes půl
mega, úložiště má kolem pěti. Ve stavu zůstane jen id (`nahrane-<čas>-<náhoda>`),
soubor bydlí v IndexedDB a web si ho k id došahá sám.

Tři věci, na kterých to zakoplo:
- **Průhlednost.** Canvas zmenšoval do JPEG, takže z průhledného PNG byla
  **černá plocha**. PNG teď zůstává PNG; skica musí ležet na papíře, ne
  v černém rámečku.
- **`loading="lazy"` na doplněném obrázku.** Dlaždice se klonuje z existující,
  která má `lazy`. Prohlížeč u ní už jednou rozhodl, že se načítat nebude,
  a nová adresa ho neprobudí — obrázek zůstal prázdný i po odrolování.
  Doplněné obrázky proto `loading` ztrácejí.
- **Čísla u filtrů** se počítají při sestavení. Po nahrání skici tvrdila něco
  jiného, než bylo vidět (12 dlaždic, u filtru 11). Přepočítávají se z toho,
  co je v mřížce opravdu vidět.

Pole projektu se na webu značí `data-projekt="<slug>"` + `data-pole`, ne
pořadovým číslem — po přeřazení v administraci by index ukazoval na cizí
projekt. Texty projektů tím zmizely z listu „Texty webu": dva zdroje pravdy
pro jednu větu jsou past.

## Doladění (5. 10. 2026): výsledek se zadává od skici
Michael: *„k té skice pak budu potřebovat nahrát, jak to dopadlo — obrázky
a nějaký text."* Datově to je projekt, který už máme; chybělo to z druhé
strany. Architekt má nejdřív skicu a hotovou stavbu až za rok, takže vchod
musí být u skici, ne u projektu.

Pod každou skicou je proto oddíl **„Jak to dopadlo“**: textové pole a nahrávání
fotek, které zapisují do projektu, pod který skica patří (`projektKeSkice()`
hledá podle `skici[]`). Když žádný není, tlačítko ho založí a rovnou k ní
přiváže. List **Projekty** zůstává — je to druhý vchod do stejných dat, ne
druhá kopie.

Text se zadává jako jeden blok a dělí na odstavce prázdným řádkem; architekt
nemá klikat „+ odstavec“, když chce prostě napsat dva.

Vyhledání projektu ke skice je jednořádkový `find`, takže zůstalo v UI —
kontrakt by stál víc než ta oprava. Všechno, co mění stav, jde dál přes C-006.

## Dvacáté kolo (6. 10. 2026) — mobil
Michael: *„mobilní verze je extra důležitá, musí to být pecka, plně
optimalizované."* Audit na 375 px našel šest věcí, dvě z nich zásadní:

| nález | stav |
|---|---|
| v navigaci byl na telefonu **jediný odkaz** (`.navigace a:not(.cil){display:none}`) | nahrazeno |
| úvodní list měl **333 px místo celé výšky** (`min-height:auto` v mobilním dotazu) | 100svh |
| kruh ležel **přes claim** — maska byla na mobilu vypnutá | maska zpět, kruh dolů |
| skicák 1 sloupec → stránka 11 540 px | 2 sloupce, 9 065 px |
| dotykové cíle 18–39 px | ≥ 40 px |
| rotace značky běžela i mimo obrazovku | pauza přes IntersectionObserver |

**Navigace na telefonu.** Lišta nahoře se nevejde, tak je u palce dvojtlačítko
`.palec` (Obsah / Kontakt) a obsah se otevře jako další list přes celou
obrazovku — v duchu bloku, ne jako zásuvka z aplikace. Podtržené je to, kde
člověk zrovna je. Při psaní do formuláře lišta zmizí (`body.pise-se`), jinak
by seděla na klávesnici.

**`100svh`, ne `100vh`.** S `vh` se spodek úvodního listu schová pod adresní
řádek prohlížeče a pobídka k rolování je nedostupná. Spodní odsazení počítá
i s `env(safe-area-inset-bottom)` a s výškou plovoucí lišty.

**Co se ověřovalo a nebylo Baseline:** `animation-timeline` (scroll-driven
animace) ani `@view-transition` Safari neumí — obojí je proto v `@supports`
a bez nich web funguje úplně stejně. `text-wrap: pretty/balance` Baseline je,
takže jde napevno. Všechen nový pohyb je navíc uvnitř
`@media (prefers-reduced-motion: no-preference)`.

**Přechod mezi stránkami.** Dlaždice skici a tatáž skica na listu projektu
nesou stejné `view-transition-name` (`skica-<základ>`), takže se při prokliku
přenese místo bliknutí. Jména musí být v dokumentu unikátní — proto je nese
jen mřížka a list projektu, ne kresby u služeb ani hlavička.

**Největší úspora byla jinde, než bych čekal.** Kruh značky má 69 tahů a na
stránce je pětkrát (lišta, úvod, hlavička, načítání, razítko) — doslova
opsaný dělal **48 % index.html**. Teď se kreslí jednou do `<defs>` a instance
ho odkazují přes `<use>`: **200 → 123 kB** (gzip 37 → 29 kB). Rám kruhu se
tím nezměnil, rezervy při otáčení sedí na desetinu stejně jako předtím.

**Pauzák na telefonu.** Na úzkém dlouhém listu vypadalo prázdné místo
průsvitného pauzáku jako díra mezi listy. Materiál se pozná dál, ale papír je
pod 700 px hustší (0,95 místo 0,76).

Administrace na telefonu: devět karet rozcestníku pod sebou zabralo půl
obrazovky, než začal obsah — teď je to řádek, který se posouvá do strany.
Plovoucí lišta webu se v administraci schová, mířila by na cizí sekce.

## Dvacáté první kolo (6. 10. 2026) — ostrý provoz na atelieridej.cz
Architekt si web nasadil k Českému hostingu. Michael požádal o nastavení
v jejich administraci; udělal jsem všechno kromě toho, co dělat nemám.

**Co jsem nedělal a proč:** platbu (856,68 Kč) ani zakládání hesel — Git archiv
si založil Michael. Nasazovací klíč je ed25519 jen na tomhle stroji
(`~/.ssh/atelier-idej-nasazeni`), do administrace šla jen veřejná část.

**Nasazení** je `./tools/nasad.sh`: sestaví **ostrou** verzi, zkontroluje ji
a pošle obsah `out/` jako větev `nasazeni` do Git archivu domény. Hosting si
podle té větve sám aktualizuje web. Pozor: do archivu jde **výsledek**, ne
zdrojáky — pracovní kopie `_nasazeni/` má v kořeni to, co má být v kořeni webu.

**Ostrý provoz (`OSTRY=1`)** je samostatný režim sestavení: bez šesti ukázkových
projektů, bez zástupných ploten (nekopírují se vůbec), bez hlášky „Tohle je
návrh webu" i bez odkazu na demo administraci, a razítko má místo „NÁVRH WEBU ·
UKÁZKA" doménu. Administrace na webu zůstává, jen na ni nikde nevede odkaz —
tak to Michael chtěl. Náhled na GitHub Pages se nemění.

Zapnuto v administraci hostingu: Let's Encrypt (platí do 4. 1. 2027, obnovuje se
sám), přesměrování http → https a www → bez www.

**Past na rozklikávací seznamy v jejich administraci:** nastavení `<select>`
přes DOM se neuložilo — stránka bere až skutečnou interakci. Funguje kliknout,
Escape a napsat první písmeno volby.

### Poptávky chodí mailem (C-014)
`src/php/odeslat.php` na hostingu s PHP 8.4 posílá poptávky na
info@atelieridej.cz. Formulář má `action` jen v ostré verzi; na náhledu zůstává
demo chování. Proti zneužití past na roboty (skryté pole `vzkaz`, robot dostane
poděkování a nic se nepošle) a omezení pěti poptávek z adresy za hodinu.

**Tři poučení, všechna moje:**
- **Akceptace testovala jen čisté funkce, ne obsluhu požadavku.** Kontrakt ji
  popisoval, test ne — a přesně tam byla chyba, která se projevila až na ostrém
  webu. Doplněn test přes `php -S`, který posílá skutečný POST.
- **Ta chyba byla v mém testu.** Napsal jsem `assert v["chyby"] == {}`, takže
  worker musel vracet prázdný **objekt**; v PHP pak `$chyby !== []` platilo
  vždycky a formulář odmítal i bezchybné poptávky se 422 a prázdným seznamem.
  Pravidlo: u prázdné mapy testovat pravdivostní hodnotu, ne tvar.
- **Zelený kontrakt se nepřepočítá sám.** Po rozšíření akceptace Factory C-014
  dál hlásila zelenou a běh jen spadl na plné sadě. Shodit stav na `red`
  v `state.json` ji donutí běžet znovu.

**Co jsem z revize nevzal:** CSRF token (formulář nic nepřihlašuje ani nemění,
útočník by cizíma rukama poslal majiteli mail, který může poslat i sám) a závod
dvou souběžných požadavků v počítadle (v nejhorším projde šestá poptávka místo
páté — to limiter neruší).

### Podpis autora v patičce
„Web atelieridej.cz" + logotyp byPalda, odkaz na https://www.bypalda.cz/.
Logotyp i pravidla dodala session „Loga a animované titulky“. **Před logo nepatří
sloveso:** „byPalda" je „by Palda", takže „vytvořil byPalda" říká totéž dvakrát.
Značka se nepřebarvuje, tečka zůstává čtyřbarevná, šířka 100–120 px.

## Oprava (6. 10. 2026): logotyp na účaří
Session „Loga a animované titulky" naměřila, že logotyp v patičce plave
**7,6 px nad účařím** věty. Potvrzeno a opraveno.

Proč: vložené SVG stojí na účaří **spodní hranou svého rámečku**, jenže účaří
logotypu je uvnitř viewBoxu na 90,5 ze 130 jednotek (69 % výšky) — zbytek dole
je dotažnice „y" a „p". Chybí tedy posun o zbylých ~30,8 % výšky loga. Procento
z vlastní výšky, ne `em`: drží to při jakékoli velikosti loga i okolního písma.

Naměřeno na stejné stránce: bez posunu −10,3 px, můj původní `0.22em` −7,4 px
(jejich −7,6 sedí), `translateY(30.8%)` **+0,1 px**.

**Poučení o měření, ne o sazbě.** Napoprvé mi vycházelo, že oprava nepomohla.
Chyba byla v měřicí značce: `.autor-webu` je flexbox, takže vložený `<span>`
se stal **flex položkou** a jeho spodní hrana nebyla účaří textu. Značka musí
jít dovnitř existujícího textu, ne vedle něj. Kvůli tomu jsem taky zbytečně
přestavěl odkaz z `inline-flex` na `inline` — ověřeno, že na posunu nezáleží
(0,1 px v obou), tak je struktura zpátky; `inline-flex` drží svislé odsazení
dotykového cíle na mobilu.
