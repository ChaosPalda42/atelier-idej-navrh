/* Stránky: blok listů (index) a list skupiny skic.
   Ručně psané se píše (`pise`), všechno ostatní je prostě na papíře. */
import { stranka } from "./layout.mjs";
import { znacka } from "./znacka.mjs";
import { KRESBY, kresbaHero, kresbaPudorys, kresbaRez, kresbaSituace, kresbaZDat } from "./kresby.mjs";
import { filtr, pocty, sousedi } from "../lib/prace.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function sekce({ id, cislo, nadpis, perex = "", poznamka = "", telo, klic = "", pozadi = "", exponaty = {} }) {
  const kPerex = klic ? ` data-text="${klic}.perex"` : "";
  const kPozn = klic ? ` data-text="${klic}.poznamka"` : "";
  const presah = (exponaty.presah || []).length ? " sekce--s-presahem" : "";
  return `<section class="list sekce${presah}" id="${id}" data-psat>
<span class="hrana" aria-hidden="true"></span>
${pozadi}
${(exponaty.presah || []).length ? `<div class="presahy" aria-hidden="false">${(exponaty.presah || []).join("\n")}</div>` : ""}
<div class="sekce-hlava">
<span class="sekce-cislo"${klic ? ` data-text="${klic}.cislo"` : ""}>${cislo}</span>
<h2 class="nadpis rukou"${klic ? ` data-text="${klic}.nadpis"` : ""}>${esc(nadpis)}</h2>
${poznamka ? `<p class="poznamka pise"${kPozn}>${esc(poznamka)}</p>` : ""}
${(exponaty.okraj || []).join("\n")}
</div>
<div class="sekce-telo">
${perex ? `<p class="vedouci"${kPerex}>${esc(perex)}</p>` : ""}
${telo}
</div>
</section>`;
}

/** Exponát — skica položená do stránky. Bez papíru, takže je součástí listu;
    teprve pod myší se zvýrazní a dá se na ni kliknout. */
function exponat(s, misto, { k = "", klic = "" } = {}) {
  if (!s) return "";
  const cesta = (jmeno) => `${k}obrazky/${jmeno}`;
  const srcset = s.varianty.map((v) => `${cesta(v.soubor)} ${v.sirka}w`).join(", ");
  const sken = cesta((s.sken || s.varianty[s.varianty.length - 1]).soubor);
  const velikosti = misto.styl === "vystava"
    ? "(max-width: 920px) 88vw, 54vw"
    : misto.styl === "presah" ? "(max-width: 1100px) 60vw, 30vw" : "(max-width: 920px) 60vw, 19vw";
  return `<figure class="exponat exponat--${misto.styl}" data-slug="${esc(s.zaklad)}"
 data-typ="${esc(s.skupina)}" data-otoceni="0"
 style="--w:${s.sirka};--h:${s.vyska}${misto.kde ? `;--kde:${misto.kde}` : ""}${misto.natoceni ? `;--natoceni:${misto.natoceni}` : ""}">
<span class="exponat-ram">
<img src="${cesta(s.varianty[0].soubor)}" srcset="${srcset}" sizes="${velikosti}"
 width="${s.sirka}" height="${s.vyska}" alt="Skica — ${esc(s.popis)}" loading="lazy"
 data-lightbox="${sken}">
</span>
<figcaption class="exponat-popis"><span ${klic ? `data-text="${klic}"` : 'data-pole="nazev"'}>${esc(misto.poznamka || s.popis)}</span></figcaption>
</figure>`;
}

/** Poskládá exponáty podle `vystavka` v datech: { kam -> [html] }. */
function rozmisti(site, skici, k = "") {
  const podleZakladu = {};
  skici.forEach((s) => { podleZakladu[s.zaklad] = s; });
  const kam = {};
  (site.vystavka || []).forEach((misto, i) => {
    const s = podleZakladu[misto.zaklad];
    if (!s) return;
    misto = { ...misto, klic: `site.vystavka.${i}.poznamka` };
    const skupina = (kam[misto.kam] = kam[misto.kam] || { okraj: [], presah: [], vystava: [], poznamky: [], klice: [] });
    skupina[misto.styl] = skupina[misto.styl] || [];
    skupina[misto.styl].push(exponat(s, misto, { k, klic: misto.klic }));
    skupina.poznamky.push(misto.poznamka || "");
    skupina.klice.push(misto.klic);
  });
  return kam;
}

/** Samostatný list jen pro jednu skicu — jako exponát ve vitríně. */
function listVystavy(html, poznamka, klicPoznamky = "") {
  if (!html) return "";
  return `<section class="list vystava" data-psat>
<span class="hrana" aria-hidden="true"></span>
<div class="vystava-telo">${html}</div>
${poznamka ? `<p class="poznamka pise vystava-poznamka"${klicPoznamky ? ` data-text="${klicPoznamky}"` : ""}>${esc(poznamka)}</p>` : ""}
</section>`;
}

export function index(site, t, kresby = {}, skici = []) {
  const { firma, sluzby, postup } = site;
  const p = pocty(skici.map((s) => ({ typ: s.skupina })));
  const kam = rozmisti(site, skici);

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
<span class="hrana" aria-hidden="true"></span>
<div class="sekce-hlava">
<div class="hlavicka-znacka kresba">${znacka({ varianta: "stohovana" })}</div>
<p class="poznamka pise" data-text="uvod.poznamka">${esc(t.uvod.poznamka)}</p>
${((kam.predstaveni || {}).okraj || []).join("\n")}
</div>
<div class="sekce-telo">
<p class="vedouci" data-text="uvod.text">${esc(t.uvod.text)}</p>
<div class="hlavicka-pod">
<a class="tlacitko" href="#kontakt" data-text="uvod.cil">${esc(t.uvod.cil)}</a>
<a class="tlacitko lehke" href="#prace" data-text="uvod.druhy">${esc(t.uvod.druhy)}</a>
</div>
</div>
<div class="hero-kresba kresba" aria-hidden="true">${kresbaHero()}</div>
${((kam.predstaveni || {}).presah || []).length ? `<div class="presahy">${((kam.predstaveni || {}).presah || []).join("\n")}</div>` : ""}
</section>`;

  const sluzbyTelo = `<div class="sluzby">
${sluzby.map((s, i) => `<article class="sluzba">
<div class="sluzba-kresba kresba">${(KRESBY[s.kresba] || KRESBY.dum)()}</div>
<h3 class="rukou" data-text="site.sluzby.${i}.nazev">${esc(s.nazev)}</h3>
<p data-text="site.sluzby.${i}.popis">${esc(s.popis)}</p>
</article>`).join("\n")}
</div>
<p class="skicak-odkazy"><span data-text="vystavka.odkazy">${esc(t.vystavka.odkazy)}</span>
${site.skupiny.filter((g) => p[g.id]).map((g) => `<a href="prace/${g.id}.html">${esc(g.nazev)}</a>`).join(" · ")}</p>`;

  const postupTelo = `<ol class="postup-osa">
${postup.map((krok, i) => `<li class="postup-krok">
<h3 class="rukou" data-text="site.postup.${i}.nazev">${esc(krok.nazev)}</h3><span class="postup-trvani" data-text="site.postup.${i}.trvani">${esc(krok.trvani)}</span>
<p data-text="site.postup.${i}.popis">${esc(krok.popis)}</p>
</li>`).join("\n")}
</ol>`;

  const oMneTelo = `${t.oMne.text.map((o, i) => `<p data-text="oMne.text.${i}">${esc(o)}</p>`).join("\n")}
<div class="detail-cisla">
${t.oMne.cisla.map((c, i) => `<div class="detail-cislo"><strong class="rukou" data-text="oMne.cisla.${i}.hodnota">${esc(c.hodnota)}</strong><span data-text="oMne.cisla.${i}.popisek">${esc(c.popisek)}</span></div>`).join("\n")}
</div>`;

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
<p class="podpis pise">${esc(firma.architekt.replace("Ing. arch. ", ""))}<small data-text="kontakt.podpis">${esc(t.kontakt.podpis)}</small></p>
<div class="kontakt-udaje">
<p class="stitek">Nebo rovnou</p>
<p><a href="tel:${firma.telefonHref}" data-udaj="telefon">${esc(firma.telefon)}</a><br><a href="mailto:${firma.email}" data-udaj="email">${esc(firma.email)}</a></p>
</div>`;

  const telo = [
    hlavicka,
    sekce({ pozadi: `<div class="list-pozadi list-pozadi--vpravo kresba" aria-hidden="true">${kresbaPudorys()}</div>`,
            exponaty: kam["co-delam"], klic: "sluzby", id: "co-delam", cislo: t.sluzby.cislo,
            nadpis: t.sluzby.nadpis, perex: t.sluzby.perex, poznamka: t.sluzby.poznamka, telo: sluzbyTelo }),
    listVystavy(((kam["vystava-1"] || {}).vystava || [])[0], (kam["vystava-1"] || { poznamky: [] }).poznamky[0], (kam["vystava-1"] || { klice: [] }).klice[0]),
    sekce({ pozadi: `<div class="list-pozadi list-pozadi--dole kresba" aria-hidden="true">${kresbaRez()}</div>`,
            exponaty: kam.postup, klic: "postup", id: "postup", cislo: t.postup.cislo,
            nadpis: t.postup.nadpis, perex: t.postup.perex, poznamka: t.postup.poznamka, telo: postupTelo }),
    listVystavy(((kam["vystava-2"] || {}).vystava || [])[0], (kam["vystava-2"] || { poznamky: [] }).poznamky[0], (kam["vystava-2"] || { klice: [] }).klice[0]),
    sekce({ pozadi: `<div class="list-pozadi list-pozadi--vlevo kresba" aria-hidden="true">${kresbaSituace()}</div>`,
            exponaty: kam["o-mne"], klic: "oMne", id: "o-mne", cislo: t.oMne.cislo,
            nadpis: t.oMne.nadpis, poznamka: t.oMne.poznamka, telo: oMneTelo }),
    listVystavy(((kam["vystava-3"] || {}).vystava || [])[0], (kam["vystava-3"] || { poznamky: [] }).poznamky[0], (kam["vystava-3"] || { klice: [] }).klice[0]),
    sekce({ exponaty: kam.kontakt, klic: "kontakt", id: "kontakt", cislo: t.kontakt.cislo,
            nadpis: t.kontakt.nadpis, perex: t.kontakt.perex, poznamka: t.kontakt.poznamka, telo: kontaktTelo }),
  ].join("\n");

  return stranka({ titulek: t.web.titulek, popis: t.web.popis, telo, t, firma, aktivni: "prace" });
}

/** List jedné skupiny skic (rodinné domy, bytové domy, …). */
export function detail(site, t, id, kresby = {}, skici = []) {
  const skupina = site.skupiny.find((g) => g.id === id);
  const sluzba = site.sluzby.find((s) => s.id === id);
  const moje = filtr(skici.map((s) => ({ ...s, typ: s.skupina })), id);
  const poradi = site.skupiny.filter((g) => skici.some((s) => s.skupina === g.id));
  const okolo = sousedi(poradi.map((g) => ({ ...g, slug: g.id })), id);
  const vykres = (sluzba && kresby[sluzba.vykres]) || null;

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
    telo, t, firma: site.firma, k: "../", aktivni: "prace",
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
