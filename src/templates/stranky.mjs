/* Stránky: blok listů (index) a detail práce.
   Ruční písmo dostane `pise` (píše se), vysázené `zjevit` (jen se položí). */
import { stranka } from "./layout.mjs";
import { znacka } from "./znacka.mjs";
import { KRESBY, kresbaHero, kresbaPudorys, kresbaRez, kresbaSituace, kresbaZDat, zastupnaSkica } from "./kresby.mjs";
import { serad, pocty, sousedi } from "../lib/prace.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function sekce({ id, cislo, nadpis, perex = "", poznamka = "", telo, klic = "", pozadi = "" }) {
  const kPerex = klic ? ` data-text="${klic}.perex"` : "";
  const kPozn = klic ? ` data-text="${klic}.poznamka"` : "";
  return `<section class="list sekce" id="${id}" data-psat>
<span class="vazba" aria-hidden="true"></span>
${pozadi}
<div class="sekce-hlava">
<span class="sekce-cislo">${cislo}</span>
<h2 class="nadpis rukou pise" data-znaky>${esc(nadpis)}</h2>
${poznamka ? `<p class="poznamka pise"${kPozn}>${esc(poznamka)}</p>` : ""}
</div>
<div class="sekce-telo">
${perex ? `<p class="vedouci zjevit"${kPerex}>${esc(perex)}</p>` : ""}
${telo}
</div>
</section>`;
}

function obrazek(prace, i, kresby = {}) {
  const vykres = (prace.vykresy || []).map((n) => kresby[n]).filter(Boolean)[0];
  if (vykres) return `<span class="skica skica--sama">${kresbaZDat(vykres, { seed: i + 4 })}</span>`;
  const foto = (prace.fotky || [])[0];
  if (foto && foto.srcset) {
    return `<img src="fotky/${foto.varianty[0].soubor}" srcset="${foto.srcset}" sizes="(max-width: 920px) 92vw, 33vw" width="${foto.sirka}" height="${foto.vyska}" alt="${esc(prace.nazev)}" loading="lazy">
${foto.skica ? `<span class="skica"><img src="skici/${foto.skica}" alt="" aria-hidden="true" loading="lazy"></span>` : ""}`;
  }
  return `<span class="skica skica--sama">${zastupnaSkica(i + 1)}</span>`;
}

function karta(prace, i, kresby) {
  return `<a class="prace-karta polozit" data-typ="${esc(prace.typ)}" data-slug="${esc(prace.slug)}" href="prace/${esc(prace.slug)}.html">
<span class="prace-obraz">${obrazek(prace, i, kresby)}</span>
<span class="prace-popis">
<span class="prace-meta" data-pole="meta">${esc(prace.misto)} · ${prace.rok} · ${esc(prace.stav)}</span>
<h3 data-pole="nazev">${esc(prace.nazev)}</h3>
<span class="prace-anotace" data-pole="anotace">${esc(prace.anotace)}</span>
</span>
</a>`;
}

export function index(site, t, kresby = {}) {
  const { firma, sluzby, postup, prace } = site;
  const serazene = serad(prace);
  const p = pocty(prace);

  const hlavicka = `<header class="list uvod" data-psat>
<div class="uvod-znacka" aria-hidden="true">${znacka({ varianta: "samotna", kresli: true, trida: "znacka--velka" })}</div>
<div class="uvod-text">
<span class="stitek zjevit">${esc(t.uvod.stitek)}</span>
<h1 class="claim rukou pise" data-znaky data-text="uvod.claim">${esc(t.uvod.claim)}</h1>
</div>
<a class="uvod-dolu rukou pise" href="#predstaveni">${esc(t.uvod.dolu)}
<svg viewBox="0 0 26 34" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2c-1 9 1 18 0 28"/><path d="M6 23l7 9 7-9"/></svg>
</a>
</header>

<section class="list sekce predstaveni" id="predstaveni" data-psat>
<span class="vazba" aria-hidden="true"></span>
<div class="sekce-hlava">
<div class="hlavicka-znacka kresba">${znacka({ varianta: "stohovana" })}</div>
<p class="poznamka pise" data-text="uvod.poznamka">${esc(t.uvod.poznamka)}</p>
</div>
<div class="sekce-telo">
<p class="vedouci zjevit" data-text="uvod.text">${esc(t.uvod.text)}</p>
<div class="hlavicka-pod polozit">
<a class="tlacitko" href="#kontakt">${esc(t.uvod.cil)}</a>
<a class="tlacitko lehke" href="#prace">${esc(t.uvod.druhy)}</a>
</div>
</div>
<div class="hero-kresba kresba" aria-hidden="true">${kresbaHero()}</div>
</section>`;

  const sluzbyTelo = `<div class="sluzby">
${sluzby.map((s) => `<article class="sluzba">
<div class="sluzba-kresba kresba">${(KRESBY[s.kresba] || KRESBY.dum)()}</div>
<h3 class="rukou pise">${esc(s.nazev)}</h3>
<p class="zjevit">${esc(s.popis)}</p>
</article>`).join("\n")}
</div>`;

  const filtry = `<div class="filtry polozit" role="group" aria-label="Filtr prací">
<button class="filtr" data-filtr="vse" aria-pressed="true">${esc(t.prace.vse)}<span class="filtr-pocet">${p.vse}</span></button>
${sluzby.filter((s) => p[s.id]).map((s) =>
    `<button class="filtr" data-filtr="${s.id}" aria-pressed="false">${esc(s.nazev)}<span class="filtr-pocet">${p[s.id]}</span></button>`).join("\n")}
</div>`;

  const praceTelo = `${filtry}
<div class="prace-mrizka" data-prace>
${serazene.map((x, i) => karta(x, i, kresby)).join("\n")}
</div>`;

  const postupTelo = `<ol class="postup-osa">
${postup.map((krok) => `<li class="postup-krok zjevit">
<h3 class="rukou pise">${esc(krok.nazev)}</h3><span class="postup-trvani">${esc(krok.trvani)}</span>
<p>${esc(krok.popis)}</p>
</li>`).join("\n")}
</ol>`;

  const oMneTelo = `${t.oMne.text.map((o) => `<p class="zjevit">${esc(o)}</p>`).join("\n")}
<div class="detail-cisla zjevit">
${t.oMne.cisla.map((c) => `<div class="detail-cislo"><strong class="rukou pise">${esc(c.hodnota)}</strong><span>${esc(c.popisek)}</span></div>`).join("\n")}
</div>`;

  const kontaktTelo = `<form class="formular zjevit" id="poptavka" novalidate>
<div class="pole" data-pole="jmeno">
<label for="jmeno">${esc(t.kontakt.jmeno)}</label>
<input id="jmeno" name="jmeno" type="text" autocomplete="name">
<span class="pole-chyba"></span>
</div>
<div class="pole" data-pole="email">
<label for="email">${esc(t.kontakt.email)}</label>
<input id="email" name="email" type="email" autocomplete="email">
<span class="pole-chyba"></span>
</div>
<div class="pole" data-pole="telefon">
<label for="telefon">${esc(t.kontakt.telefon)}</label>
<input id="telefon" name="telefon" type="tel" autocomplete="tel">
<span class="pole-chyba"></span>
</div>
<div class="pole" data-pole="zprava">
<label for="zprava">${esc(t.kontakt.zprava)}</label>
<textarea id="zprava" name="zprava" placeholder="${esc(t.kontakt.zpravaNapoveda)}"></textarea>
<span class="pole-chyba"></span>
</div>
<div class="pole" data-pole="soubory">
<label for="prilohy">${esc(t.kontakt.prilohy)}</label>
<input id="prilohy" name="prilohy" type="file" multiple>
<span class="stitek">${esc(t.kontakt.prilohyNapoveda)}</span>
<span id="prilohy-vypis" class="prace-meta"></span>
<span class="pole-chyba"></span>
</div>
<div class="pole" data-pole="souhlas">
<label class="souhlas"><input id="souhlas" name="souhlas" type="checkbox"> <span>${esc(t.kontakt.souhlas)}</span></label>
<span class="pole-chyba"></span>
</div>
<button class="tlacitko" type="submit">${esc(t.kontakt.odeslat)}</button>
</form>
<p class="vedouci" id="poptavka-hotovo" data-text="kontakt.hotovo" hidden>${esc(t.kontakt.hotovo)}</p>
<p class="podpis pise">${esc(firma.architekt.replace("Ing. arch. ", ""))}<small>${esc(t.kontakt.podpis)}</small></p>
<div class="kontakt-udaje zjevit">
<p class="stitek">Nebo rovnou</p>
<p><a href="tel:${firma.telefonHref}" data-udaj="telefon">${esc(firma.telefon)}</a><br><a href="mailto:${firma.email}" data-udaj="email">${esc(firma.email)}</a></p>
</div>`;

  const telo = [
    hlavicka,
    sekce({ pozadi: `<div class="list-pozadi list-pozadi--vpravo kresba" aria-hidden="true">${kresbaPudorys()}</div>`, klic: "sluzby", id: "co-delam", cislo: t.sluzby.cislo, nadpis: t.sluzby.nadpis, perex: t.sluzby.perex, poznamka: t.sluzby.poznamka, telo: sluzbyTelo }),
    sekce({ klic: "prace", id: "prace", cislo: t.prace.cislo, nadpis: t.prace.nadpis, perex: t.prace.perex, poznamka: t.prace.poznamka, telo: praceTelo }),
    sekce({ pozadi: `<div class="list-pozadi list-pozadi--dole kresba" aria-hidden="true">${kresbaRez()}</div>`, klic: "postup", id: "postup", cislo: t.postup.cislo, nadpis: t.postup.nadpis, perex: t.postup.perex, poznamka: t.postup.poznamka, telo: postupTelo }),
    sekce({ pozadi: `<div class="list-pozadi list-pozadi--vlevo kresba" aria-hidden="true">${kresbaSituace()}</div>`, klic: "oMne", id: "o-mne", cislo: t.oMne.cislo, nadpis: t.oMne.nadpis, poznamka: t.oMne.poznamka, telo: oMneTelo }),
    sekce({ klic: "kontakt", id: "kontakt", cislo: t.kontakt.cislo, nadpis: t.kontakt.nadpis, perex: t.kontakt.perex, poznamka: t.kontakt.poznamka, telo: kontaktTelo }),
  ].join("\n");

  return stranka({ titulek: t.web.titulek, popis: t.web.popis, telo, t, firma, aktivni: "prace" });
}

export function detail(site, t, slug, kresby = {}) {
  const serazene = serad(site.prace);
  const prace = serazene.find((x) => x.slug === slug);
  const okolo = sousedi(serazene, slug);
  const i = serazene.indexOf(prace);

  const vykresy = (prace.vykresy || []).map((n) => kresby[n]).filter(Boolean);
  const fotky = vykresy.length
    ? vykresy.map((v, k) => `<figure class="kresba vykres">${kresbaZDat(v, { seed: k + 9 })}<figcaption>${esc(v.popis || "")}</figcaption></figure>`).join("\n")
    : (prace.fotky || []).length
    ? prace.fotky.map((f) => `<figure class="polozit">
<img src="../fotky/${f.varianty[0].soubor}" srcset="${(f.srcset || "").replace(/(^|, )/g, "$1../fotky/")}" sizes="(max-width: 920px) 92vw, 46vw" width="${f.sirka}" height="${f.vyska}" alt="${esc(f.popis || prace.nazev)}" data-lightbox="../fotky/${f.varianty[f.varianty.length - 1].soubor}" loading="lazy">
${f.popis ? `<figcaption>${esc(f.popis)}</figcaption>` : ""}
</figure>`).join("\n")
    : `<figure class="kresba">${zastupnaSkica(i + 2)}<figcaption>${esc(t.detail.fotky)}</figcaption></figure>
<figure class="kresba">${zastupnaSkica(i + 7)}</figure>`;

  const telo = `<article class="list detail" data-psat>
<header class="detail-hlava">
<div class="sekce-hlava">
<span class="sekce-cislo">${esc(prace.misto)}</span>
<p class="stitek"><a href="../index.html#prace">${esc(t.detail.zpet)}</a></p>
</div>
<div>
<h1 class="nadpis rukou pise" data-znaky>${esc(prace.nazev)}</h1>
<p class="vedouci zjevit">${esc(prace.anotace)}</p>
<p class="prace-meta zjevit">${prace.rok} · ${esc(prace.stav)} · ${esc(prace.misto)}</p>
<div class="detail-cisla zjevit">
${(prace.cisla || []).map((c) => `<div class="detail-cislo"><strong class="rukou pise">${esc(c.hodnota)}</strong><span>${esc(c.popisek)}</span></div>`).join("\n")}
</div>
</div>
</header>
<div class="detail-fotky">${fotky}</div>
</article>
<section class="list sekce" data-psat>
<span class="vazba" aria-hidden="true"></span>
<div class="sekce-hlava"><h2 class="nadpis rukou pise" data-znaky>${esc(t.detail.zadani)}</h2></div>
<div class="sekce-telo">
${(prace.popis || []).map((o) => `<p class="zjevit">${esc(o)}</p>`).join("\n")}
<nav class="sousedi">
<a href="${esc(okolo.predchozi.slug)}.html"><span class="stitek">${esc(t.detail.predchozi)}</span>${esc(okolo.predchozi.nazev)}</a>
<a href="${esc(okolo.dalsi.slug)}.html" style="text-align:right"><span class="stitek">${esc(t.detail.dalsi)}</span>${esc(okolo.dalsi.nazev)}</a>
</nav>
</div>
</section>`;

  return stranka({
    titulek: `${prace.nazev} — ateliér IDEJ`,
    popis: prace.anotace,
    telo, t, firma: site.firma, k: "../", aktivni: "prace",
  });
}
