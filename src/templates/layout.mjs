/* Obal stránky: hlava dokumentu, list papíru, navigace, patička. */
import { znacka, razitko } from "./znacka.mjs";

/* Otisk sestavení se přidává k adresám stylů a skriptů, aby po nasazení
   nikdo nekoukal na starou verzi z mezipaměti prohlížeče. */
let otisk = "";
export function nastavOtisk(hodnota) { otisk = hodnota ? `?v=${hodnota}` : ""; }

/** Pomůcky, které stránka používá přes CSS i SVG. */
export function defs() {
  return `<svg class="defs" aria-hidden="true" focusable="false"><defs>
<filter id="papir-stin"><feDropShadow dx="0" dy="1" stdDeviation="0.6" flood-opacity="0.18"/></filter>
</defs></svg>`;
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
${odkaz("index.html#prace", t.navigace.prace, aktivni === "prace" ? "aktivni" : "")}
${odkaz("index.html#co-delam", t.navigace.sluzby)}
${odkaz("index.html#postup", t.navigace.postup)}
${odkaz("index.html#o-mne", t.navigace.oMne)}
${odkaz("index.html#kontakt", t.navigace.kontakt, "cil")}
</div>
</nav>`;
}

export function paticka(firma, t, k = "") {
  return `<footer class="list paticka">
<span class="vazba" aria-hidden="true"></span>
<div>
<p class="stitek" data-udaj="pravni">${firma.pravni}</p>
<p><span data-udaj="ulice">${firma.ulice}</span><br><span data-udaj="mesto">${firma.mesto}</span><br>IČO <span data-udaj="ico">${firma.ico}</span></p>
</div>
<div>
<p><a href="tel:${firma.telefonHref}" data-udaj="telefon">${firma.telefon}</a> · <a href="mailto:${firma.email}" data-udaj="email">${firma.email}</a></p>
<p class="rukou tuzkou" data-text="paticka.ukazka">${t.paticka.ukazka}</p>
<p><a href="${k}administrace.html">${t.paticka.administrace}</a> · <a href="#zacatek">${t.paticka.nahoru}</a></p>
</div>
<div class="razitko">${razitko(firma)}</div>
</footer>`;
}

export function stranka({ titulek, popis, telo, trida = "", t, firma, k = "", aktivni = "", skripty = [] }) {
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
<div class="zavoj" aria-hidden="true"></div>
${navigace(t, aktivni, k)}
${pravitko()}
${defs()}
<main class="blok" id="zacatek">
${telo}
${paticka(firma, t, k)}
</main>
${hrot()}
<script src="${k}assets/lib.js${otisk}"></script>
<script src="${k}assets/web.js${otisk}"></script>
${skripty.map((s) => `<script src="${k}assets/${s}${otisk}"></script>`).join("\n")}
</body>
</html>`;
}
