/* Obal stránky: hlava dokumentu, list papíru, navigace, patička. */
import { znacka, razitko, defsZnacky } from "./znacka.mjs";
import { krouzky } from "../lib/vazba.mjs";

/* Otisk sestavení se přidává k adresám stylů a skriptů, aby po nasazení
   nikdo nekoukal na starou verzi z mezipaměti prohlížeče. */
let otisk = "";
export function nastavOtisk(hodnota) { otisk = hodnota ? `?v=${hodnota}` : ""; }

/* Ostrý provoz na vlastní doméně. Náhled na GitHub Pages si nechává
   ukázkové projekty a hlášky o tom, že je to návrh; na atelieridej.cz
   nemá viset nic, co není architektovo. */
let ostry = false;
export function nastavOstry(hodnota) { ostry = !!hodnota; }

/** Pomůcky, které stránka používá přes CSS i SVG. */
export function defs() {
  return `<svg class="defs" aria-hidden="true" focusable="false"><defs>
<filter id="papir-stin"><feDropShadow dx="0" dy="1" stdDeviation="0.6" flood-opacity="0.18"/></filter>
${defsVazby()}
${defsZnacky()}
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

/** Sekce v pořadí, v jakém leží v bloku — pro navigaci i pro obsah. */
function sekceWebu(t) {
  return [
    { kotva: "co-delam", nazev: t.navigace.sluzby, cislo: t.sluzby.cislo },
    { kotva: "prace", nazev: t.navigace.prace, cislo: t.prace.cislo },
    { kotva: "postup", nazev: t.navigace.postup, cislo: t.postup.cislo },
    { kotva: "o-mne", nazev: t.navigace.oMne, cislo: t.oMne.cislo },
    { kotva: "kontakt", nazev: t.navigace.kontakt, cislo: t.kontakt.cislo },
  ];
}

export function navigace(t, aktivni, k = "") {
  const sekce = sekceWebu(t);
  const odkaz = (s, trida = "") =>
    `<a class="${trida}" href="${k}index.html#${s.kotva}">${s.nazev}</a>`;
  return `<nav class="navigace" aria-label="Hlavní navigace">
<div class="navigace-vnitrek">
<a class="navigace-znacka" href="${k}index.html" aria-label="ateliér IDEJ — domů">${znacka({ varianta: "samotna" })}</a>
${sekce.slice(0, -1).map((s) => odkaz(s)).join("\n")}
${odkaz(sekce[sekce.length - 1], "cil")}
</div>
</nav>`;
}

/* Na telefonu se lišta nahoře nevejde — zbyl by z ní jeden odkaz. Místo ní
   je u palce dvojtlačítko: vlevo obsah bloku, vpravo rovnou kontakt.
   Obsah se otevře jako další list papíru přes celou obrazovku. */
export function obsah(t, k = "") {
  const sekce = sekceWebu(t);
  return `<div class="palec" aria-hidden="false">
<button class="palec-obsah" type="button" aria-expanded="false" aria-controls="obsah-bloku">
<span class="palec-cary" aria-hidden="true"></span>Obsah</button>
<a class="palec-cil" href="${k}index.html#kontakt">${t.navigace.kontakt}</a>
</div>
<nav class="obsah-list" id="obsah-bloku" aria-label="Obsah bloku" hidden>
<div class="obsah-vnitrek">
<p class="stitek">Obsah</p>
<ol class="obsah-seznam">
${sekce.map((s) => `<li><a href="${k}index.html#${s.kotva}" data-kotva="${s.kotva}">
<span class="obsah-cislo">${s.cislo}</span><span class="obsah-nazev">${s.nazev}</span></a></li>`).join("\n")}
</ol>
<a class="obsah-domu" href="${k}index.html">Začátek bloku</a>
<button class="obsah-zavrit" type="button">Zavřít</button>
</div>
</nav>`;
}

/* Podpis autora webu v patičce. Logotyp je značka byPaldy — nepřebarvuje
   se, tečka zůstává čtyřbarevná a kolem loga je volno. Odkaz má
   `aria-label`, aby čtečka i vyhledávač četly jméno, ne obrázek; SVG je
   vložené přímo, ať to nestojí další požadavek.

   Pozor na formulaci: „byPalda" je „by Palda", takže sloveso před logem
   („vytvořil", „autor", „od") říká totéž dvakrát. Správně je jen předmět
   a za ním logotyp. */
export function podpisAutora() {
  return `<p class="autor-webu"><span>Web atelieridej.cz</span>
<a href="https://www.bypalda.cz/" aria-label="byPalda">
<svg class="autor-logo" role="img" viewBox="0 0 429.13 130.00"><title>byPalda</title>
<defs><linearGradient id="bypalda-logotyp-svetly-t" gradientUnits="userSpaceOnUse" x1="368.13" y1="-20.48" x2="389.13" y2="0.53"><stop offset="0" stop-color="#38d9ff"/><stop offset=".34" stop-color="#a78bfa"/><stop offset=".67" stop-color="#4ade80"/><stop offset="1" stop-color="#fbbf24"/></linearGradient></defs>
  <g transform="translate(20 90)">
    <path d="M34.8 1.4L34.8 1.4Q26.8 1.4 22.35 -1.75Q17.9 -4.9 15.8 -8.9L15.8 -8.9L14.6 -8.9L14.6 0L8.8 0L8.8 -70L14.8 -70L14.8 -40.1L16 -40.1Q17.3 -42.6 19.65 -44.85Q22 -47.1 25.75 -48.55Q29.5 -50 34.8 -50L34.8 -50Q41.4 -50 46.7 -46.95Q52 -43.9 55.1 -38.25Q58.2 -32.6 58.2 -24.9L58.2 -24.9L58.2 -23.7Q58.2 -16 55.05 -10.35Q51.9 -4.7 46.6 -1.65Q41.3 1.4 34.8 1.4M33.4 -4L33.4 -4Q41.7 -4 46.85 -9.3Q52 -14.6 52 -23.9L52 -23.9L52 -24.7Q52 -34 46.85 -39.3Q41.7 -44.6 33.4 -44.6L33.4 -44.6Q25.2 -44.6 20 -39.3Q14.8 -34 14.8 -24.7L14.8 -24.7L14.8 -23.9Q14.8 -14.6 20 -9.3Q25.2 -4 33.4 -4M105.6 20L76 20L76 14.6L104.4 14.6Q107.4 14.6 107.4 11.6L107.4 11.6L107.4 -8.4L106.2 -8.4Q105 -6 102.85 -3.85Q100.7 -1.7 97.25 -0.35Q93.8 1 88.6 1L88.6 1Q83.4 1 78.95 -1.2Q74.5 -3.4 71.85 -7.8Q69.2 -12.2 69.2 -18.9L69.2 -18.9L69.2 -48.6L75.2 -48.6L75.2 -19.3Q75.2 -11.4 79.2 -7.9Q83.2 -4.4 89.9 -4.4L89.9 -4.4Q97.4 -4.4 102.4 -9.3Q107.4 -14.2 107.4 -24.2L107.4 -24.2L107.4 -48.6L113.4 -48.6L113.4 12.4Q113.4 16 111.45 18Q109.5 20 105.6 20L105.6 20" fill="#0b0d17"/>
    <path d="M139.5 0L126.3 0L126.3 -70L155.1 -70Q161.7 -70 166.75 -67.35Q171.8 -64.7 174.65 -59.9Q177.5 -55.1 177.5 -48.5L177.5 -48.5L177.5 -47.1Q177.5 -40.6 174.55 -35.75Q171.6 -30.9 166.55 -28.25Q161.5 -25.6 155.1 -25.6L155.1 -25.6L139.5 -25.6L139.5 0M139.5 -58L139.5 -37.6L153.8 -37.6Q158.5 -37.6 161.4 -40.2Q164.3 -42.8 164.3 -47.3L164.3 -47.3L164.3 -48.3Q164.3 -52.8 161.4 -55.4Q158.5 -58 153.8 -58L153.8 -58L139.5 -58M198 1.4L198 1.4Q192.7 1.4 188.5 -0.45Q184.3 -2.3 181.85 -5.85Q179.4 -9.4 179.4 -14.5L179.4 -14.5Q179.4 -22.2 184.8 -26.1Q190.2 -30 198.6 -30L198.6 -30L212.2 -30L212.2 -32.8Q212.2 -36.3 210 -38.55Q207.8 -40.8 203 -40.8L203 -40.8Q198.3 -40.8 196 -38.65Q193.7 -36.5 193 -33.1L193 -33.1L181.4 -37Q182.6 -40.8 185.25 -43.95Q187.9 -47.1 192.35 -49.05Q196.8 -51 203.2 -51L203.2 -51Q213 -51 218.7 -46.1Q224.4 -41.2 224.4 -31.9L224.4 -31.9L224.4 -13.4Q224.4 -10.4 227.2 -10.4L227.2 -10.4L231.2 -10.4L231.2 0L222.8 0Q219.1 0 216.7 -1.8Q214.3 -3.6 214.3 -6.6L214.3 -6.6L214.3 -6.7L212.4 -6.7Q212 -5.5 210.6 -3.55Q209.2 -1.6 206.2 -0.1Q203.2 1.4 198 1.4M200.2 -8.8L200.2 -8.8Q205.5 -8.8 208.85 -11.75Q212.2 -14.7 212.2 -19.6L212.2 -19.6L212.2 -20.6L199.5 -20.6Q196 -20.6 194 -19.1Q192 -17.6 192 -14.9L192 -14.9Q192 -12.2 194.1 -10.5Q196.2 -8.8 200.2 -8.8M249.5 0L236.9 0L236.9 -70L249.5 -70L249.5 0M280 1.4L280 1.4Q274.1 1.4 268.95 -1.55Q263.8 -4.5 260.7 -10.2Q257.6 -15.9 257.6 -24L257.6 -24L257.6 -25.6Q257.6 -33.7 260.7 -39.4Q263.8 -45.1 268.9 -48.05Q274 -51 280 -51L280 -51Q286.8 -51 290.3 -48.75Q293.8 -46.5 295.4 -43.9L295.4 -43.9L297.2 -43.9L297.2 -70L309.8 -70L309.8 0L297.4 0L297.4 -6L295.6 -6Q293.9 -3.2 290.35 -0.9Q286.8 1.4 280 1.4M283.8 -9.6L283.8 -9.6Q289.6 -9.6 293.5 -13.35Q297.4 -17.1 297.4 -24.3L297.4 -24.3L297.4 -25.3Q297.4 -32.5 293.55 -36.25Q289.7 -40 283.8 -40L283.8 -40Q278 -40 274.1 -36.25Q270.2 -32.5 270.2 -25.3L270.2 -25.3L270.2 -24.3Q270.2 -17.1 274.1 -13.35Q278 -9.6 283.8 -9.6M335.7 1.4L335.7 1.4Q330.4 1.4 326.2 -0.45Q322 -2.3 319.55 -5.85Q317.1 -9.4 317.1 -14.5L317.1 -14.5Q317.1 -22.2 322.5 -26.1Q327.9 -30 336.3 -30L336.3 -30L349.9 -30L349.9 -32.8Q349.9 -36.3 347.7 -38.55Q345.5 -40.8 340.7 -40.8L340.7 -40.8Q336 -40.8 333.7 -38.65Q331.4 -36.5 330.7 -33.1L330.7 -33.1L319.1 -37Q320.3 -40.8 322.95 -43.95Q325.6 -47.1 330.05 -49.05Q334.5 -51 340.9 -51L340.9 -51Q350.7 -51 356.4 -46.1Q362.1 -41.2 362.1 -31.9L362.1 -31.9L362.1 -13.4Q362.1 -10.4 364.9 -10.4L364.9 -10.4L368.9 -10.4L368.9 0L360.5 0Q356.8 0 354.4 -1.8Q352 -3.6 352 -6.6L352 -6.6L352 -6.7L350.1 -6.7Q349.7 -5.5 348.3 -3.55Q346.9 -1.6 343.9 -0.1Q340.9 1.4 335.7 1.4M337.9 -8.8L337.9 -8.8Q343.2 -8.8 346.55 -11.75Q349.9 -14.7 349.9 -19.6L349.9 -19.6L349.9 -20.6L337.2 -20.6Q333.7 -20.6 331.7 -19.1Q329.7 -17.6 329.7 -14.9L329.7 -14.9Q329.7 -12.2 331.8 -10.5Q333.9 -8.8 337.9 -8.8" fill="#0b0d17"/>
    <circle cx="378.625" cy="-9.975" r="10.5" fill="url(#bypalda-logotyp-svetly-t)"/>
  </g>
</svg></a></p>`;
}

export function paticka(firma, t, k = "", sbirky = []) {
  return `<footer class="list paticka">
<div>
<p class="stitek" data-udaj="pravni">${firma.pravni}</p>
<p><span data-udaj="ulice">${firma.ulice}</span><br><span data-udaj="mesto">${firma.mesto}</span><br>IČO <span data-udaj="ico">${firma.ico}</span></p>
</div>
<div>
<p><a href="tel:${firma.telefonHref}" data-udaj="telefon">${firma.telefon}</a> · <a href="mailto:${firma.email}" data-udaj="email">${firma.email}</a></p>
${ostry ? "" : `<p class="rukou tuzkou" data-text="paticka.ukazka">${t.paticka.ukazka}</p>`}
${sbirky.length ? `<p class="paticka-sbirky"><span data-text="vystavka.odkazy">${t.vystavka.odkazy}</span>
${sbirky.map((g) => `<a href="${k}prace/${g.id}.html">${g.nazev}</a>`).join(" · ")}</p>` : ""}
<p>${ostry ? "" : `<a href="${k}administrace.html">${t.paticka.administrace}</a> · `}<a href="#zacatek">${t.paticka.nahoru}</a></p>
</div>
<div class="razitko">${razitko(firma, ostry)}</div>
${podpisAutora()}
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
${obsah(t, k)}
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
