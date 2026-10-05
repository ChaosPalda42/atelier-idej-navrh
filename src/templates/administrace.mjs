/* Demo administrace — několik listů, ne jedna dlouhá stránka.
   Co se tu dá přepsat, to se na webu projeví: každý text má svůj klíč
   a na stránce mu odpovídá prvek s `data-text="<klíč>"`. */
import { stranka } from "./layout.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const LISTY = [
  { id: "prehled", soubor: "administrace.html", nazev: "Přehled",
    popis: "Co je na webu a co jste v něm změnili." },
  { id: "texty", soubor: "administrace/texty.html", nazev: "Texty webu",
    popis: "Všechno, co je na stránce napsané — po sekcích, jak to jde za sebou." },
  { id: "sluzby", soubor: "administrace/sluzby.html", nazev: "Co děláme",
    popis: "Čtyři skupiny práce a texty na jejich listech." },
  { id: "postup", soubor: "administrace/postup.html", nazev: "Jak to probíhá",
    popis: "Kroky od schůzky po dozor na stavbě." },
  { id: "skici", soubor: "administrace/skici.html", nazev: "Skici",
    popis: "Pořadí, názvy a zařazení skic ve skicáku." },
  { id: "projekty", soubor: "administrace/projekty.html", nazev: "Projekty",
    popis: "Ukázky prací — texty, zařazené skici a fotografie." },
  { id: "poptavky", soubor: "administrace/poptavky.html", nazev: "Poptávky",
    popis: "Co lidé poslali formulářem." },
  { id: "kontakt", soubor: "administrace/kontakt.html", nazev: "Kontakt",
    popis: "Telefon, e-mail, adresa a údaje firmy." },
  { id: "zaloha", soubor: "administrace/zaloha.html", nazev: "Záloha",
    popis: "Vyvezení a načtení obsahu, návrat do výchozího stavu." },
];

/* ------------------------------------------------- co se dá editovat kde */
const POPISKY = {
  "uvod.stitek": "Štítek nad úvodní větou",
  "uvod.claim": "Úvodní věta (velká, psaná rukou)",
  "uvod.dolu": "Pobídka k rolování",
  "uvod.poznamka": "Poznámka na okraji úvodu",
  "uvod.text": "Představení ateliéru",
  "uvod.cil": "Tlačítko — hlavní",
  "uvod.druhy": "Tlačítko — vedlejší",
  "sluzby.nadpis": "Nadpis sekce", "sluzby.cislo": "Číslo sekce",
  "sluzby.perex": "Úvodní odstavec", "sluzby.poznamka": "Poznámka na okraji",
  "prace.nadpis": "Nadpis sekce", "prace.cislo": "Číslo sekce",
  "prace.perex": "Úvodní odstavec", "prace.poznamka": "Poznámka na okraji",
  "prace.vse": "Popisek filtru „vše“",
  "postup.nadpis": "Nadpis sekce", "postup.cislo": "Číslo sekce",
  "postup.perex": "Úvodní odstavec", "postup.poznamka": "Poznámka na okraji",
  "oMne.nadpis": "Nadpis sekce", "oMne.cislo": "Číslo sekce",
  "oMne.poznamka": "Poznámka na okraji",
  "oMne.claim": "Věta nad textem o ateliéru",
  "oMne.zaver": "Závěrečný odstavec",
  "kontakt.nadpis": "Nadpis sekce", "kontakt.cislo": "Číslo sekce",
  "kontakt.perex": "Úvodní odstavec", "kontakt.poznamka": "Poznámka na okraji",
  "kontakt.jmeno": "Formulář — jméno", "kontakt.email": "Formulář — e-mail",
  "kontakt.telefon": "Formulář — telefon", "kontakt.zprava": "Formulář — zpráva",
  "kontakt.zpravaNapoveda": "Formulář — nápověda u zprávy",
  "kontakt.prilohy": "Formulář — přílohy", "kontakt.prilohyNapoveda": "Formulář — co lze přiložit",
  "kontakt.souhlas": "Formulář — souhlas", "kontakt.odeslat": "Formulář — tlačítko",
  "kontakt.hotovo": "Hláška po odeslání", "kontakt.podpis": "Podpis pod formulářem",
  "paticka.ukazka": "Patička — věta o ukázce",
  "web.titulek": "Titulek stránky (v záložce prohlížeče a ve vyhledávání)",
  "vystavka.odkazy": "Věta nad odkazy na skupiny",
  "vystavka.popisek": "Pobídka ke zvětšení skici",
  "projekt.zpet": "Odkaz zpátky na výběr prací",
  "projekt.skici": "Nadpis nad skicami projektu",
  "projekt.fotky": "Nadpis nad fotografiemi",
  "projekt.predchozi": "Odkaz na předchozí projekt",
  "projekt.dalsi": "Odkaz na další projekt",
  "projekt.zastupne": "Upozornění, že je projekt ukázkový",
  "web.popis": "Popis stránky pro vyhledávače",
};

const DLOUHE = /perex|text|popis|poznamka|hotovo|napoveda|souhlas|claim|titulek|odkazy/i;

const VZORY = [
  [/^oMne\.bloky\.\d+\.nadpis$/, "Nadpis bloku"],
  [/^oMne\.bloky\.\d+\.text$/, "Text bloku"],
];

function poleTextu(klic, popisek) {
  const podleVzoru = VZORY.find(([v]) => v.test(klic));
  return {
    klic,
    popisek: popisek || POPISKY[klic] || (podleVzoru ? podleVzoru[1] : klic),
    dlouhe: DLOUHE.test(klic),
  };
}

/** Z dat se složí seznam toho, co jde na kterém listu přepsat. */
export function schema(site, t, skici) {
  const skupinaTextu = (nazev, klice) => ({ nazev, pole: klice.map((k) => poleTextu(k)) });

  return {
    texty: [
      skupinaTextu("Úvodní obrazovka", ["uvod.stitek", "uvod.claim", "uvod.dolu"]),
      skupinaTextu("Představení", ["uvod.text", "uvod.poznamka", "uvod.cil", "uvod.druhy"]),
      skupinaTextu("Co děláme", ["sluzby.cislo", "sluzby.nadpis", "sluzby.perex", "sluzby.poznamka"]),
      skupinaTextu("Vybrané práce", ["prace.cislo", "prace.nadpis", "prace.perex", "prace.poznamka", "prace.vse"]),
      skupinaTextu("Jak to probíhá", ["postup.cislo", "postup.nadpis", "postup.perex", "postup.poznamka"]),
      skupinaTextu("O nás", ["oMne.cislo", "oMne.nadpis", "oMne.claim",
        ...t.oMne.bloky.flatMap((_, i) => [`oMne.bloky.${i}.nadpis`, `oMne.bloky.${i}.text`]),
        "oMne.zaver", "oMne.poznamka"]),
      skupinaTextu("Kontakt", ["kontakt.cislo", "kontakt.nadpis", "kontakt.perex", "kontakt.poznamka",
        "kontakt.podpis", "kontakt.hotovo"]),
      skupinaTextu("Formulář", ["kontakt.jmeno", "kontakt.email", "kontakt.telefon", "kontakt.zprava",
        "kontakt.zpravaNapoveda", "kontakt.prilohy", "kontakt.prilohyNapoveda", "kontakt.souhlas", "kontakt.odeslat"]),
      skupinaTextu("Skicák", ["vystavka.odkazy", "vystavka.popisek"]),
      skupinaTextu("Listy projektů", ["projekt.zpet", "projekt.skici", "projekt.fotky",
        "projekt.predchozi", "projekt.dalsi", "projekt.zastupne"]),
      skupinaTextu("Navigace", ["navigace.sluzby", "navigace.prace", "navigace.postup",
        "navigace.oMne", "navigace.kontakt"]),
      skupinaTextu("Patička a hlava stránky", ["paticka.ukazka", "web.titulek", "web.popis"]),
    ],
    sluzby: [
      ...site.sluzby.map((s, i) => ({
        nazev: s.nazev,
        pole: [poleTextu(`site.sluzby.${i}.nazev`, "Název"), poleTextu(`site.sluzby.${i}.popis`, "Popis")],
      })),
      ...site.skupiny.map((g, i) => ({
        nazev: `List „${g.nazev}“`,
        pole: g.text.map((_, j) => poleTextu(`site.skupiny.${i}.text.${j}`, `Odstavec ${j + 1}`)),
      })),
    ],
    postup: site.postup.map((krok, i) => ({
      nazev: krok.nazev,
      pole: [poleTextu(`site.postup.${i}.nazev`, "Název kroku"),
             poleTextu(`site.postup.${i}.trvani`, "Jak dlouho trvá"),
             poleTextu(`site.postup.${i}.popis`, "Popis")],
    })),
  };
}

/* ------------------------------------------------------------- jeden list */
function navigace(aktivni, k) {
  return `<nav class="admin-nav" aria-label="Části administrace">
${LISTY.map((l) => `<a class="admin-nav-polozka${l.id === aktivni ? " je" : ""}" href="${k}${l.soubor}">
<span>${esc(l.nazev)}</span><small>${esc(l.popis)}</small></a>`).join("\n")}
</nav>`;
}

function adminList({ site, t, skici, aktivni, telo, k }) {
  const list = LISTY.find((l) => l.id === aktivni);
  const data = {
    firma: site.firma,
    site: { sluzby: site.sluzby, postup: site.postup, skupiny: site.skupiny, projekty: site.projekty },
    skici: skici.map((s) => ({ slug: s.zaklad, nazev: s.popis, typ: s.skupina })),
    texty: t,
    schema: schema(site, t, skici),
    listy: LISTY,
    korenAdmin: k,
  };
  const telo_ = `<div class="list admin-list" data-admin="${aktivni}">
<header class="admin-hlava">
<div>
<p class="stitek"><a href="${k}index.html">← Zpátky na web</a> · Demo administrace</p>
<h1 class="rukou">${esc(list.nazev)}</h1>
<p class="vedouci">${esc(list.popis)}</p>
</div>
</header>
<div class="admin-telo">
${navigace(aktivni, k)}
<div class="admin-obsah">${telo}</div>
</div>
</div>
<script type="application/json" id="admin-data">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

  return stranka({
    titulek: `${list.nazev} — administrace ateliér IDEJ`,
    popis: list.popis,
    telo: telo_,
    trida: "admin",
    t,
    firma: site.firma,
    k,
    aktivni: "",
    skripty: ["admin.js"],
  });
}

/** Vrátí všechny listy administrace jako [{ soubor, html }]. */
export function administrace(site, t, skici = []) {
  const telo = {
    prehled: `<div class="admin-dlazdice" id="admin-prehled"></div>
<div id="admin-zmeny" class="admin-seznam"></div>`,
    texty: `<div id="admin-pole" data-sada="texty"></div>`,
    sluzby: `<div id="admin-pole" data-sada="sluzby"></div>`,
    postup: `<div id="admin-pole" data-sada="postup"></div>`,
    skici: `<div class="admin-radek"><p class="vedouci">Přetahovat se tu nedá, ale pořadí se dá posouvat šipkami. Skrytá skica na webu není.</p></div>
<div id="admin-skici" class="admin-seznam"></div>
<p class="admin-poznamka-demo">Nahraná skica se v ukázce objeví na webu rovnou. Drží se
ale jen v tomhle prohlížeči — na ostrém webu ji po uložení zpracuje server stejně jako
těch jedenáct stávajících (vybělí papír, udělá průhlednost a tři velikosti).</p>`,
    projekty: `<div class="admin-radek"><p class="vedouci">Každý projekt má texty, skici, ze kterých vznikl, a fotografie realizace.</p></div>
<div id="admin-projekty" class="admin-seznam"></div>
<p class="admin-poznamka-demo">Úpravy textů i fotografie se v ukázce projeví na listech
projektů. Úplně nový projekt dostane vlastní list až na ostrém webu — tam ho po uložení
vygeneruje server.</p>`,
    poptavky: `<p class="vedouci">Vyzkoušejte si to — odešlete poptávku na webu a objeví se tady.</p>
<div id="admin-poptavky" class="admin-seznam"></div>`,
    kontakt: `<div id="admin-kontakt" class="admin-seznam"></div>`,
    zaloha: `<div class="admin-radek">
<button class="tlacitko lehke" id="admin-export">Vyvézt do souboru</button>
<label class="tlacitko lehke" for="admin-import">Načíst ze souboru</label>
<input id="admin-import" type="file" accept="application/json" hidden>
<button class="tlacitko lehke" id="admin-reset">Vrátit ukázku do výchozího stavu</button>
</div>
<pre id="admin-vypis" class="admin-vypis"></pre>`,
  };

  return LISTY.map((l) => ({
    soubor: l.soubor,
    html: adminList({
      site, t, skici, aktivni: l.id, telo: telo[l.id],
      k: l.soubor.includes("/") ? "../" : "",
    }),
  }));
}
