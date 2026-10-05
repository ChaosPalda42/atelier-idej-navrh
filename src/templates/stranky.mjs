/* Stránky: blok listů (index) a list skupiny skic.
   Ručně psané se píše (`pise`), všechno ostatní je prostě na papíře. */
import { stranka } from "./layout.mjs";
import { znacka } from "./znacka.mjs";
import { kresbaPudorys, kresbaRez, kresbaSituace, kresbaZDat } from "./kresby.mjs";
import { filtr, pocty, sousedi } from "../lib/prace.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function sekce({ id, cislo, nadpis, perex = "", poznamka = "", telo, klic = "", pozadi = "" }) {
  const kPerex = klic ? ` data-text="${klic}.perex"` : "";
  const kPozn = klic ? ` data-text="${klic}.poznamka"` : "";
  return `<section class="list sekce" id="${id}" data-psat>
${pozadi}
<div class="sekce-hlava">
<span class="sekce-cislo"${klic ? ` data-text="${klic}.cislo"` : ""}>${cislo}</span>
<h2 class="nadpis rukou"${klic ? ` data-text="${klic}.nadpis"` : ""}>${esc(nadpis)}</h2>
${poznamka ? `<p class="poznamka pise"${kPozn}>${esc(poznamka)}</p>` : ""}
</div>
<div class="sekce-telo">
${perex ? `<p class="vedouci"${kPerex}>${esc(perex)}</p>` : ""}
${telo}
</div>
</section>`;
}

/** Obrázek skici — srcset, poměr stran, zvětšení po kliknutí.
    Skici jsou PNG s průhledným pozadím, takže leží rovnou na papíře. */
function obrazekSkici(s, { k = "", trida = "", velikosti = "100vw", lupa = true, popis = "" } = {}) {
  if (!s) return "";
  const cesta = (jmeno) => `${k}obrazky/${jmeno}`;
  const sken = cesta((s.sken || s.varianty[s.varianty.length - 1]).soubor);
  return `<img class="${trida}" src="${cesta(s.varianty[0].soubor)}"
 srcset="${s.varianty.map((v) => `${cesta(v.soubor)} ${v.sirka}w`).join(", ")}" sizes="(max-width: 920px) 88vw, 54vw"
 width="${s.sirka}" height="${s.vyska}" alt="Skica — ${esc(popis || s.popis)}" loading="lazy"${lupa ? ` data-lightbox="${sken}"` : ""}>`;
}

/** Karta skici v mřížce vybraných prací. Filtr (C-003) ji najde přes data-typ.
    Patří-li skica k projektu, vede dlaždice na jeho list; jinak se po kliknutí
    otevře aspoň původní sken. */
function karta(s, projekt, k = "") {
  const obraz = obrazekSkici(s, {
    k, trida: "skica-obraz", velikosti: "(max-width: 560px) 44vw, 22vw", lupa: !projekt,
  });
  const vnitrek = projekt
    ? `<a class="skica-odkaz" href="${k}prace/${esc(projekt.slug)}.html">${obraz}</a>`
    : obraz;
  return `<figure class="skica-list" data-slug="${esc(s.zaklad)}" data-typ="${esc(s.skupina)}">
${vnitrek}
<figcaption class="skica-popis" data-pole="nazev">${projekt
    ? `<a class="skica-odkaz" href="${k}prace/${esc(projekt.slug)}.html">${esc(projekt.nazev)}</a>`
    : esc(s.popis)}</figcaption>
</figure>`;
}

/** Exponát — skica na listu sbírky. Bez papíru, takže je součástí listu;
    teprve pod myší se zvýrazní a dá se na ni kliknout. */
function exponat(s, misto = {}, { k = "", klid = false } = {}) {
  if (!s) return "";
  const cesta = (jmeno) => `${k}obrazky/${jmeno}`;
  const srcset = s.varianty.map((v) => `${cesta(v.soubor)} ${v.sirka}w`).join(", ");
  const sken = cesta((s.sken || s.varianty[s.varianty.length - 1]).soubor);
  return `<figure class="exponat exponat--vystava" data-slug="${esc(s.zaklad)}"
 data-typ="${esc(s.skupina)}" data-otoceni="0"${klid ? " data-klid" : ""} style="--w:${s.sirka};--h:${s.vyska}">
<span class="exponat-ram">
<img src="${cesta(s.varianty[0].soubor)}" srcset="${srcset}" sizes="(max-width: 920px) 88vw, 54vw"
 width="${s.sirka}" height="${s.vyska}" alt="Skica — ${esc(s.popis)}" loading="lazy"
 data-lightbox="${sken}">
</span>
<figcaption class="exponat-popis"><span data-pole="nazev">${esc(misto.poznamka || s.popis)}</span></figcaption>
</figure>`;
}

export function index(site, t, skici = [], razitkoAtelieru = "") {
  const { firma, sluzby, postup } = site;
  const p = pocty(skici.map((s) => ({ typ: s.skupina })));
  const podleZakladu = Object.fromEntries(skici.map((s) => [s.zaklad, s]));
  /* rejstřík skica -> projekt, aby dlaždice věděla, kam odkázat */
  const kProjektu = {};
  (site.projekty || []).forEach((pr) => (pr.skici || []).forEach((z) => { kProjektu[z] = pr; }));
  const hero = podleZakladu[site.hero];

  const hlavicka = `<header class="list uvod" data-psat>
<div class="uvod-znacka" aria-hidden="true">${znacka({ varianta: "samotna", kresli: true, trida: "znacka--velka" })}</div>
<div class="uvod-text">
<span class="stitek" data-text="uvod.stitek">${esc(t.uvod.stitek)}</span>
<h1 class="claim rukou" data-text="uvod.claim">${esc(t.uvod.claim)}</h1>
</div>
<a class="uvod-dolu rukou pise" href="#predstaveni"><span data-text="uvod.dolu">${esc(t.uvod.dolu)}</span>
<svg viewBox="0 0 26 34" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2c-1 9 1 18 0 28"/><path d="M6 23l7 9 7-9"/></svg>
</a>
</header>

<section class="list sekce predstaveni" id="predstaveni" data-psat>
<div class="sekce-hlava">
<div class="hlavicka-znacka kresba">${znacka({ varianta: "stohovana" })}</div>
<p class="poznamka pise" data-text="uvod.poznamka">${esc(t.uvod.poznamka)}</p>
</div>
<div class="sekce-telo">
<p class="vedouci" data-text="uvod.text">${esc(t.uvod.text)}</p>
<div class="hlavicka-pod">
<a class="tlacitko" href="#kontakt" data-text="uvod.cil">${esc(t.uvod.cil)}</a>
<a class="tlacitko lehke" href="#postup" data-text="uvod.druhy">${esc(t.uvod.druhy)}</a>
</div>
</div>
${hero ? `<div class="hero-kresba">${obrazekSkici(hero, { trida: "hero-obraz", velikosti: "(max-width: 920px) 92vw, 78vw" })}</div>` : ""}
</section>`;

  const sluzbyTelo = `<div class="sluzby">
${sluzby.map((s, i) => `<article class="sluzba">
${podleZakladu[s.skica] ? `<div class="sluzba-kresba">${obrazekSkici(podleZakladu[s.skica], { trida: "sluzba-obraz", velikosti: "(max-width: 920px) 44vw, 23vw", popis: s.nazev })}</div>` : ""}
<h3 class="rukou" data-text="site.sluzby.${i}.nazev">${esc(s.nazev)}</h3>
<p data-text="site.sluzby.${i}.popis">${esc(s.popis)}</p>
</article>`).join("\n")}
</div>`;

  /* Vybrané práce: filtr (C-003) a mřížka skic. Skupiny se berou ze skic,
     ne ze služeb — architekt má zatím skici jen ke čtyřem z nich. */
  const praceTelo = `<div class="filtry" role="group" aria-label="Filtr skic">
<button class="filtr" data-filtr="vse" aria-pressed="true"><span data-text="prace.vse">${esc(t.prace.vse)}</span><span class="filtr-pocet">${p.vse}</span></button>
${site.skupiny.filter((g) => p[g.id]).map((g) =>
    `<button class="filtr" data-filtr="${g.id}" aria-pressed="false">${esc(g.nazev)}<span class="filtr-pocet">${p[g.id]}</span></button>`).join("\n")}
</div>
<div class="skicak" data-prace>
${skici.map((s) => karta(s, kProjektu[s.zaklad])).join("\n")}
</div>`;

  const postupTelo = `<ol class="postup-osa">
${postup.map((krok, i) => `<li class="postup-krok">
<h3 class="rukou" data-text="site.postup.${i}.nazev">${esc(krok.nazev)}</h3>${krok.trvani ? `<span class="postup-trvani" data-text="site.postup.${i}.trvani">${esc(krok.trvani)}</span>` : ""}
<p data-text="site.postup.${i}.popis">${esc(krok.popis)}</p>
</li>`).join("\n")}
</ol>`;

  const oMneTelo = `<p class="vedouci claim-sekce" data-text="oMne.claim">${esc(t.oMne.claim)}</p>
${t.oMne.bloky.map((b, i) => `<div class="o-nas-blok">
<h3 class="rukou" data-text="oMne.bloky.${i}.nadpis">${esc(b.nadpis)}</h3>
<p data-text="oMne.bloky.${i}.text">${esc(b.text)}</p>
</div>`).join("\n")}
<p class="o-nas-zaver" data-text="oMne.zaver">${esc(t.oMne.zaver)}</p>`;

  const kontaktTelo = `<form class="formular" id="poptavka" novalidate>
<div class="pole" data-pole="jmeno">
<label for="jmeno" data-text="kontakt.jmeno">${esc(t.kontakt.jmeno)}</label>
<input id="jmeno" name="jmeno" type="text" autocomplete="name">
<span class="pole-chyba"></span>
</div>
<div class="pole" data-pole="email">
<label for="email" data-text="kontakt.email">${esc(t.kontakt.email)}</label>
<input id="email" name="email" type="email" autocomplete="email">
<span class="pole-chyba"></span>
</div>
<div class="pole" data-pole="telefon">
<label for="telefon" data-text="kontakt.telefon">${esc(t.kontakt.telefon)}</label>
<input id="telefon" name="telefon" type="tel" autocomplete="tel">
<span class="pole-chyba"></span>
</div>
<div class="pole" data-pole="zprava">
<label for="zprava" data-text="kontakt.zprava">${esc(t.kontakt.zprava)}</label>
<textarea id="zprava" name="zprava" placeholder="${esc(t.kontakt.zpravaNapoveda)}"></textarea>
<span class="pole-chyba"></span>
</div>
<div class="pole" data-pole="soubory">
<label for="prilohy" data-text="kontakt.prilohy">${esc(t.kontakt.prilohy)}</label>
<input id="prilohy" name="prilohy" type="file" multiple>
<span class="stitek" data-text="kontakt.prilohyNapoveda">${esc(t.kontakt.prilohyNapoveda)}</span>
<span id="prilohy-vypis" class="prace-meta"></span>
<span class="pole-chyba"></span>
</div>
<div class="pole" data-pole="souhlas">
<label class="souhlas"><input id="souhlas" name="souhlas" type="checkbox"> <span data-text="kontakt.souhlas">${esc(t.kontakt.souhlas)}</span></label>
<span class="pole-chyba"></span>
</div>
<button class="tlacitko" type="submit" data-text="kontakt.odeslat">${esc(t.kontakt.odeslat)}</button>
</form>
<p class="vedouci" id="poptavka-hotovo" data-text="kontakt.hotovo" hidden>${esc(t.kontakt.hotovo)}</p>
<div class="podpis-rada">
<p class="podpis pise">${esc(firma.architekt.replace("Ing. arch. ", ""))}<small data-text="kontakt.podpis">${esc(t.kontakt.podpis)}</small></p>
${razitkoAtelieru ? `<img class="razitko-ruka" src="obrazky/${razitkoAtelieru}" alt="Razítko ateliéru" width="411" height="366" loading="lazy">` : ""}
</div>
<div class="kontakt-udaje">
<p class="stitek">Nebo rovnou</p>
<p><a href="tel:${firma.telefonHref}" data-udaj="telefon">${esc(firma.telefon)}</a><br><a href="mailto:${firma.email}" data-udaj="email">${esc(firma.email)}</a></p>
</div>`;

  const telo = [
    hlavicka,
    sekce({ pozadi: `<div class="list-pozadi list-pozadi--vpravo kresba" aria-hidden="true">${kresbaPudorys()}</div>`,
            klic: "sluzby", id: "co-delam", cislo: t.sluzby.cislo,
            nadpis: t.sluzby.nadpis, perex: t.sluzby.perex, poznamka: t.sluzby.poznamka, telo: sluzbyTelo }),
    sekce({ klic: "prace", id: "prace", cislo: t.prace.cislo,
            nadpis: t.prace.nadpis, perex: t.prace.perex, poznamka: t.prace.poznamka, telo: praceTelo }),
    sekce({ pozadi: `<div class="list-pozadi list-pozadi--dole kresba" aria-hidden="true">${kresbaRez()}</div>`,
            klic: "postup", id: "postup", cislo: t.postup.cislo,
            nadpis: t.postup.nadpis, perex: t.postup.perex, poznamka: t.postup.poznamka, telo: postupTelo }),
    sekce({ pozadi: `<div class="list-pozadi list-pozadi--vlevo kresba" aria-hidden="true">${kresbaSituace()}</div>`,
            klic: "oMne", id: "o-mne", cislo: t.oMne.cislo,
            nadpis: t.oMne.nadpis, poznamka: t.oMne.poznamka, telo: oMneTelo }),
    sekce({ klic: "kontakt", id: "kontakt", cislo: t.kontakt.cislo,
            nadpis: t.kontakt.nadpis, perex: t.kontakt.perex, poznamka: t.kontakt.poznamka, telo: kontaktTelo }),
  ].join("\n");

  return stranka({ titulek: t.web.titulek, popis: t.web.popis, telo, t, firma,
    sbirky: site.skupiny.filter((g) => p[g.id]) });
}

/** List jedné skupiny skic (rodinné domy, bytové domy, …). */
export function detail(site, t, id, kresby = {}, skici = []) {
  const skupina = site.skupiny.find((g) => g.id === id);
  /* Výkres z DXF/PDF (tools/vykres.py → data/kresby/*.json). Dokud architekt
     žádný nepošle, složka je prázdná a na listu prostě není — ukázkový
     půdorys, který tu byl dřív, byl vymyšlený. */
  const vykres = kresby[(site.sluzby.find((x) => x.id === id) || {}).vykres] || null;
  const moje = filtr(skici.map((s) => ({ ...s, typ: s.skupina })), id);
  const poradi = site.skupiny.filter((g) => skici.some((s) => s.skupina === g.id));
  const okolo = sousedi(poradi.map((g) => ({ ...g, slug: g.id })), id);

  const telo = `<article class="list detail" data-psat>
<header class="detail-hlava">
<div class="sekce-hlava">
<span class="sekce-cislo">${moje.length} ${moje.length === 1 ? "skica" : moje.length < 5 ? "skici" : "skic"}</span>
<p class="stitek"><a href="../index.html#prace">${esc(t.detail.zpet)}</a></p>
</div>
<div>
<h1 class="nadpis rukou">${esc(skupina.nazev)}</h1>
${skupina.text.map((o, j) => `<p class="${j === 0 ? "vedouci" : ""}" data-text="site.skupiny.${site.skupiny.indexOf(skupina)}.text.${j}">${esc(o)}</p>`).join("\n")}
</div>
</header>
<div class="vystava-rada">
${moje.map((s) => exponat(s, { styl: "vystava", poznamka: s.popis }, { k: "../" })).join("\n")}
</div>
${vykres ? `<div class="detail-vykres kresba">${kresbaZDat(vykres, { seed: 11 })}</div>` : ""}
<nav class="sousedi">
<a href="${esc(okolo.predchozi.id)}.html"><span class="stitek">${esc(t.detail.predchozi)}</span>${esc(okolo.predchozi.nazev)}</a>
<a href="${esc(okolo.dalsi.id)}.html" style="text-align:right"><span class="stitek">${esc(t.detail.dalsi)}</span>${esc(okolo.dalsi.nazev)}</a>
</nav>
</article>`;

  return stranka({
    titulek: `${skupina.nazev} — ateliér IDEJ`,
    popis: skupina.text[0],
    telo, t, firma: site.firma, k: "../",
    sbirky: site.skupiny.filter((g) => skici.some((x) => x.skupina === g.id)),
  });
}

/** Zástupná fotografie projektu (tools/ukazky.py). */
function fotka(u, k = "", popis = "") {
  if (!u) return "";
  const cesta = (jmeno) => `${k}obrazky/${jmeno}`;
  const nejvetsi = u.varianty[u.varianty.length - 1];
  return `<figure class="fotka">
<img src="${cesta(u.varianty[0].soubor)}"
 srcset="${u.varianty.map((v) => `${cesta(v.soubor)} ${v.sirka}w`).join(", ")}"
 sizes="(max-width: 920px) 92vw, 46vw" width="${u.sirka}" height="${u.vyska}"
 alt="${esc(popis || u.popis)}" loading="lazy" data-lightbox="${cesta(nejvetsi.soubor)}">
</figure>`;
}

/** List jednoho projektu: skici z rozmýšlení, fotky realizace, texty. */
export function projekt(site, t, p, skici = [], ukazky = []) {
  const podle = (seznam, klic) => (klic || []).map((z) => seznam.find((x) => x.zaklad === z)).filter(Boolean);
  const mojeSkici = podle(skici, p.skici);
  const mojeFotky = podle(ukazky, p.fotky);
  const okolo = sousedi(site.projekty, p.slug);
  const i = site.projekty.indexOf(p);
  const stav = (t.projekt.stavy || {})[p.stav] || p.stav;

  const telo = `<article class="list sekce projekt" data-psat>
<div class="sekce-hlava">
<span class="sekce-cislo">${esc(String(p.rok))}</span>
<p class="stitek"><a href="../index.html#prace" data-text="projekt.zpet">${esc(t.projekt.zpet)}</a></p>
<p class="poznamka pise" data-text="projekt.zastupne">${esc(t.projekt.zastupne)}</p>
</div>
<div class="sekce-telo">
<h1 class="nadpis rukou" data-text="site.projekty.${i}.nazev">${esc(p.nazev)}</h1>
<p class="projekt-udaje"><span data-text="site.projekty.${i}.misto">${esc(p.misto)}</span> · ${esc(stav)}</p>
<p class="vedouci" data-text="site.projekty.${i}.anotace">${esc(p.anotace)}</p>
${p.text.map((o, j) => `<p data-text="site.projekty.${i}.text.${j}">${esc(o)}</p>`).join("\n")}
</div>
</article>

${mojeFotky.length ? `<section class="list projekt-fotky" data-psat>
<h2 class="nadpis rukou" data-text="projekt.fotky">${esc(t.projekt.fotky)}</h2>
<div class="fotky-rada">${mojeFotky.map((u) => fotka(u, "../", p.nazev)).join("\n")}</div>
</section>` : ""}

${mojeSkici.length ? `<section class="list projekt-skici" data-psat>
<h2 class="nadpis rukou" data-text="projekt.skici">${esc(t.projekt.skici)}</h2>
<div class="vystava-rada">${mojeSkici.map((s) => exponat(s, { poznamka: s.popis }, { k: "../", klid: true })).join("\n")}</div>
<nav class="sousedi">
<a href="${esc(okolo.predchozi.slug)}.html"><span class="stitek" data-text="projekt.predchozi">${esc(t.projekt.predchozi)}</span>${esc(okolo.predchozi.nazev)}</a>
<a href="${esc(okolo.dalsi.slug)}.html" style="text-align:right"><span class="stitek" data-text="projekt.dalsi">${esc(t.projekt.dalsi)}</span>${esc(okolo.dalsi.nazev)}</a>
</nav>
</section>` : ""}`;

  return stranka({
    titulek: `${p.nazev} — ateliér IDEJ`,
    popis: p.anotace,
    telo, t, firma: site.firma, k: "../", aktivni: "prace",
    sbirky: site.skupiny.filter((g) => skici.some((x) => x.skupina === g.id)),
  });
}

/** Stránka, která tu není. GitHub Pages ji servíruje na každou neznámou adresu. */
export function chyba404(site, t) {
  const telo = `<article class="list sekce chyba" data-psat>
<div class="list-pozadi list-pozadi--vpravo kresba" aria-hidden="true">${kresbaSituace()}</div>
<div class="sekce-hlava">
<span class="sekce-cislo">404</span>
<p class="poznamka pise">${esc(t.chyba.poznamka)}</p>
</div>
<div class="sekce-telo">
<h1 class="nadpis rukou">${esc(t.chyba.nadpis)}</h1>
<p class="vedouci">${esc(t.chyba.text)}</p>
<div class="hlavicka-pod">
<a class="tlacitko" href="index.html" data-koren>${esc(t.chyba.domu)}</a>
<a class="tlacitko lehke" href="index.html#prace" data-koren>${esc(t.chyba.skicak)}</a>
<a class="tlacitko lehke" href="index.html#kontakt" data-koren>${esc(t.chyba.kontakt)}</a>
</div>
</div>
</article>
<script>
/* Adresy se opraví podle toho, odkud se na 404 přišlo (web běží v podsložce). */
(function () {
  var cesta = location.pathname.split("/").filter(Boolean);
  var koren = location.hostname.indexOf("github.io") >= 0 && cesta.length ? "/" + cesta[0] + "/" : "/";
  var prvky = document.querySelectorAll("[data-koren]");
  for (var i = 0; i < prvky.length; i++) {
    prvky[i].setAttribute("href", koren + prvky[i].getAttribute("href"));
  }
})();
</script>`;

  return stranka({
    titulek: `${t.chyba.nadpis} — ateliér IDEJ`,
    popis: t.chyba.text,
    telo, t, firma: site.firma, aktivni: "",
  });
}

/** Stará adresa, kterou někdo může mít v záložkách — pošle se tam, kam patří. */
export function presmerovani(cil, popisek) {
  return `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<title>Přesunuto — ateliér IDEJ</title>
<link rel="canonical" href="${cil}">
<meta http-equiv="refresh" content="0; url=${cil}">
<meta name="robots" content="noindex">
</head>
<body style="font:16px/1.6 system-ui,sans-serif;background:#cfc3ad;color:#221f1b;padding:40px">
<p>Tahle stránka se přestěhovala${popisek ? ` — ${popisek}` : ""}.
<a href="${cil}">Pokračovat</a>.</p>
</body>
</html>`;
}
