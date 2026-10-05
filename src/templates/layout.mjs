/* Obal stránky: hlava dokumentu, list papíru, navigace, patička. */
import { znacka, razitko } from "./znacka.mjs";
import { krouzky } from "../lib/vazba.mjs";

/* Otisk sestavení se přidává k adresám stylů a skriptů, aby po nasazení
   nikdo nekoukal na starou verzi z mezipaměti prohlížeče. */
let otisk = "";
export function nastavOtisk(hodnota) { otisk = hodnota ? `?v=${hodnota}` : ""; }

/** Pomůcky, které stránka používá přes CSS i SVG. */
export function defs() {
  return `<svg class="defs" aria-hidden="true" focusable="false"><defs>
<filter id="papir-stin"><feDropShadow dx="0" dy="1" stdDeviation="0.6" flood-opacity="0.18"/></filter>
${defsVazby()}
</defs></svg>`;
}

/* Kroužek drátěné vazby. Kreslí se jednou jako <symbol>, listy ho pak jen
   pokládají přes <use> — jinak by se dvacet stejných kroužků opakovalo
   v každém listu znovu a stránka by o to ztloustla.

   Soustava: celá vazba je jedno SVG přes šířku listu s viewBoxem
   0 0 1180 84, kde šev mezi listy leží na y = 27. Všechno nad ním se kreslí
   na list předchozí, takže se drát opravdu přehýbá přes hranu. Škáluje se
   celé najednou — kdyby měl kroužek pevnou velikost v pixelech a jen
   procentní rozteč, na užším okně by do sebe sousedi najeli.

   Kov je válec, proto přechod jde NAPŘÍČ drátem, ne podél něj. */
export function defsVazby() {
  return `<linearGradient id="vazba-kov" x1="0" x2="1" y1="0" y2="0">
<stop offset="0" stop-color="#6f6a61"/>
<stop offset="0.12" stop-color="#aaa49a"/>
<stop offset="0.30" stop-color="#f4f2ed"/>
<stop offset="0.46" stop-color="#c6c0b5"/>
<stop offset="0.68" stop-color="#847d72"/>
<stop offset="0.87" stop-color="#aba499"/>
<stop offset="1" stop-color="#5c574f"/>
</linearGradient>
<linearGradient id="vazba-dira" x1="0" x2="0" y1="0" y2="1">
<stop offset="0" stop-color="#4a4133"/>
<stop offset="0.5" stop-color="#8a7f6c"/>
<stop offset="1" stop-color="#f1ebe0"/>
</linearGradient>
<radialGradient id="vazba-vyboul" cx="0.5" cy="0.5">
<stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
<stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
</radialGradient>
<symbol id="vazba-krouzek" viewBox="0 0 30 84">
<ellipse cx="15" cy="40" rx="14" ry="9" fill="url(#vazba-vyboul)"/>
<ellipse cx="15" cy="44" rx="10.6" ry="6.4" fill="url(#vazba-dira)"/>
<ellipse cx="15" cy="43" rx="9" ry="4.9" fill="#6a6151"/>
<rect x="10.8" y="9" width="8.4" height="37" rx="4.2" fill="url(#vazba-kov)"/>
<rect class="vazba-odlesk" x="12.3" y="13" width="2" height="24" rx="1" fill="#ffffff"/>
<ellipse cx="15" cy="45.4" rx="5.2" ry="3" fill="#2c2318" opacity="0.5"/>
</symbol>`;
}

/* Řada kroužků podél horní hrany jednoho listu. Polohy počítá C-012
   (src/lib/vazba.mjs), rozhození náklonu a odlesků taky — každý list má
   vlastní seed, aby dva listy neměly drát ohnutý úplně stejně.

   MERITKO zvětšuje kroužek proti jeho vlastní soustavě: skutečný blok má
   drát vysoký zhruba 4 % šířky listu, při 1:1 by z něj byly špendlíky. */
const SIRKA = 1180;
const MERITKO = 1.5;
const SEV = 27 * MERITKO;          // kde v kresbě leží hrana mezi listy
export const VAZBA_SEV = SEV / SIRKA;

export function vazba(seed = 1) {
  const sirkaKrouzku = 30 * MERITKO;
  const vyska = 84 * MERITKO;
  const rada = krouzky(SIRKA, { rozestup: 62, okraj: 40, seed })
    .map((kr) => `<g transform="translate(${(kr.x - sirkaKrouzku / 2).toFixed(2)} 0) rotate(${kr.naklon.toFixed(2)} ${(sirkaKrouzku / 2).toFixed(1)} ${(49 * MERITKO).toFixed(1)})"
 style="--lesk:${kr.lesk.toFixed(2)};--stin:${kr.stin.toFixed(2)}"><use href="#vazba-krouzek" width="${sirkaKrouzku}" height="${vyska}"/></g>`)
    .join("\n");
  return `<svg class="vazba" viewBox="0 0 ${SIRKA} ${vyska}" aria-hidden="true" focusable="false">
<path class="perforace" d="M44 ${(76 * MERITKO).toFixed(0)}H${SIRKA - 44}"/>
${rada}
</svg>`;
}

export function hrot() {
  return `<div class="hrot" aria-hidden="true">
<svg viewBox="0 0 22 30"><path d="M11 29 4 9l7-8 7 8-7 20z" fill="none" stroke="var(--tuha-3)" stroke-width="1.1"/><path d="M11 29 7.6 19h6.8L11 29z" fill="var(--tuha)"/><path d="M4 9h14" fill="none" stroke="var(--tuha-3)" stroke-width="1.1"/></svg>
</div>`;
}

export function pravitko() {
  return `<div class="pravitko" aria-hidden="true">
<span class="pravitko-cislo">0 %</span>
<span class="pravitko-drah"></span>
</div>`;
}

export function navigace(t, aktivni, k = "") {
  const odkaz = (cil, popis, trida = "") =>
    `<a class="${trida}" href="${k}${cil}">${popis}</a>`;
  return `<nav class="navigace" aria-label="Hlavní navigace">
<div class="navigace-vnitrek">
<a class="navigace-znacka" href="${k}index.html" aria-label="ateliér IDEJ — domů">${znacka({ varianta: "samotna" })}</a>
${odkaz("index.html#co-delam", t.navigace.sluzby)}
${odkaz("index.html#prace", t.navigace.prace)}
${odkaz("index.html#postup", t.navigace.postup)}
${odkaz("index.html#o-mne", t.navigace.oMne)}
${odkaz("index.html#kontakt", t.navigace.kontakt, "cil")}
</div>
</nav>`;
}

export function paticka(firma, t, k = "", sbirky = []) {
  return `<footer class="list paticka">
<div>
<p class="stitek" data-udaj="pravni">${firma.pravni}</p>
<p><span data-udaj="ulice">${firma.ulice}</span><br><span data-udaj="mesto">${firma.mesto}</span><br>IČO <span data-udaj="ico">${firma.ico}</span></p>
</div>
<div>
<p><a href="tel:${firma.telefonHref}" data-udaj="telefon">${firma.telefon}</a> · <a href="mailto:${firma.email}" data-udaj="email">${firma.email}</a></p>
<p class="rukou tuzkou" data-text="paticka.ukazka">${t.paticka.ukazka}</p>
${sbirky.length ? `<p class="paticka-sbirky"><span data-text="vystavka.odkazy">${t.vystavka.odkazy}</span>
${sbirky.map((g) => `<a href="${k}prace/${g.id}.html">${g.nazev}</a>`).join(" · ")}</p>` : ""}
<p><a href="${k}administrace.html">${t.paticka.administrace}</a> · <a href="#zacatek">${t.paticka.nahoru}</a></p>
</div>
<div class="razitko">${razitko(firma)}</div>
</footer>`;
}

/* Listy se proberou v pořadí, v jakém leží v bloku, a každý dostane dvě věci:
   kroužkovou vazbu (s vlastním seedem, aby dva listy neměly drát stejně
   rozhozený) a — každý druhý — pauzák. Dělá se to tady jedním průchodem,
   ne v jednotlivých šablonách: list přibyde na pěti místech a na vazbu by
   se dřív nebo později někde zapomnělo. */
function oblecListy(telo) {
  let poradi = 0;
  return telo.replace(/<(section|article|header|footer) class="list ([^"]*)"([^>]*)>/g,
    (cely, znacka, tridy, zbytek) => {
      poradi += 1;
      const pauzak = poradi % 2 === 0 ? " list--pauzak" : "";
      /* Vazba prvního listu se kreslí PŘED ním, ne v něm: drát se přehýbá
         přes horní hranu bloku ven na stůl a uvnitř listu by ho uřízl
         `overflow: hidden`, kterým si úvodní list ořezává vyčuhující kruh. */
      if (poradi === 1) {
        return `<div class="vazba-vrch">${vazba(1)}</div>`
          + `<${znacka} class="list list--prvni ${tridy}"${zbytek}>`
          + `<span class="hrana" aria-hidden="true"></span>`;
      }
      return `<${znacka} class="list ${tridy}${pauzak}"${zbytek}>`
        + `<span class="hrana" aria-hidden="true"></span>${vazba(poradi)}`;
    });
}

export function stranka({ titulek, popis, telo, trida = "", t, firma, k = "", aktivni = "", skripty = [], sbirky = [] }) {
  /* patička je taky list bloku, proto se obléká spolu s tělem — jinak by
     na ní chyběla vazba a prostřídání pauzáku by na ní skončilo. */
  const listy = oblecListy(`${telo}\n${paticka(firma, t, k, sbirky)}`);
  return `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulek}</title>
<meta name="description" content="${popis}">
<meta name="theme-color" content="#faf7f1">
<meta property="og:title" content="${titulek}">
<meta property="og:description" content="${popis}">
<meta property="og:type" content="website">
<link rel="icon" href="${k}assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${k}assets/style.css${otisk}">
<link rel="preload" href="${k}assets/fonts/inter-cs.woff2" as="font" type="font/woff2" crossorigin>
</head>
<body class="${trida}">
<a class="jen-pro-ctecku" href="#zacatek">${t.web.preskocit}</a>
<div class="nacitani" aria-hidden="true">
<div class="nacitani-znacka">${znacka({ varianta: "samotna", kresli: true, trida: "znacka--velka" })}</div>
<div class="nacitani-logotyp">${znacka({ varianta: "stohovana" }).replace(/<g class="znacka-kruh"[\s\S]*?<\/g>/, "")}</div>
</div>
<div class="setmeni" aria-hidden="true"></div>
${navigace(t, aktivni, k)}
${pravitko()}
${defs()}
<main class="blok" id="zacatek">
${listy}
</main>
${hrot()}
<script src="${k}assets/lib.js${otisk}"></script>
<script src="${k}assets/web.js${otisk}"></script>
${skripty.map((s) => `<script src="${k}assets/${s}${otisk}"></script>`).join("\n")}
</body>
</html>`;
}
