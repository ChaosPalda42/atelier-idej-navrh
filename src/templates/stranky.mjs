/* Stránky: jeden dlouhý list (index) a detail práce. */
import { stranka } from "./layout.mjs";
import { znacka } from "./znacka.mjs";
import { KRESBY, kresbaHero, zastupnaSkica } from "./kresby.mjs";
import { serad, pocty, sousedi } from "../lib/prace.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function sekce({ id, cislo, nadpis, perex = "", poznamka = "", telo, klic = "" }) {
  const klicPerexu = klic ? `${klic}.perex` : "";
  const klicPoznamky = klic ? `${klic}.poznamka` : "";
  return `<section class="sekce" id="${id}" data-psat>
<div class="sekce-hlava">
<span class="sekce-cislo">${cislo}</span>
<h2 class="pise" data-znaky>${esc(nadpis)}</h2>
${poznamka ? `<p class="poznamka rukou pise"${klicPoznamky ? ` data-text="${klicPoznamky}"` : ""}>${esc(poznamka)}</p>` : ""}
</div>
<div class="sekce-telo">
${perex ? `<p class="vedouci pise"${klicPerexu ? ` data-text="${klicPerexu}"` : ""}>${esc(perex)}</p>` : ""}
${telo}
</div>
</section>`;
}

function obrazek(prace, i) {
  const foto = (prace.fotky || [])[0];
  if (foto && foto.srcset) {
    return `<img src="fotky/${foto.varianty[0].soubor}" srcset="${foto.srcset}" sizes="(max-width: 900px) 92vw, 33vw" width="${foto.sirka}" height="${foto.vyska}" alt="${esc(prace.nazev)}" loading="lazy">
${foto.skica ? `<span class="skica"><img src="skici/${foto.skica}" alt="" aria-hidden="true" loading="lazy"></span>` : ""}`;
  }
  return `<span class="skica skica--sama">${zastupnaSkica(i + 1)}</span>`;
}

function karta(prace, i) {
  return `<a class="prace-karta polozit" data-typ="${esc(prace.typ)}" data-slug="${esc(prace.slug)}" href="prace/${esc(prace.slug)}.html">
<span class="prace-obraz">${obrazek(prace, i)}</span>
<span class="prace-popis">
<span class="prace-meta" data-pole="meta">${esc(prace.misto)} · ${prace.rok} · ${esc(prace.stav)}</span>
<h3 data-pole="nazev">${esc(prace.nazev)}</h3>
<span class="prace-anotace" data-pole="anotace">${esc(prace.anotace)}</span>
</span>
</a>`;
}

export function index(site, t) {
  const { firma, sluzby, postup, prace } = site;
  const serazene = serad(prace);
  const p = pocty(prace);
  const nazvyTypu = Object.fromEntries(sluzby.map((s) => [s.id, s.nazev]));

  const hlavicka = `<header class="hlavicka" data-psat>
<div class="hlavicka-znacka kresba">${znacka({ varianta: "stohovana" })}</div>
<div class="hlavicka-text">
<p class="stitek pise">${esc(t.uvod.stitek)}</p>
<h1 class="hlavicka-claim pise" data-znaky data-text="uvod.claim">${esc(t.uvod.claim)}</h1>
<p class="vedouci pise" data-text="uvod.text">${esc(t.uvod.text)}</p>
<div class="hlavicka-pod polozit">
<a class="tlacitko" href="#kontakt">${esc(t.uvod.cil)}</a>
<a class="tlacitko lehke" href="#prace">${esc(t.uvod.druhy)}</a>
</div>
</div>
<p class="poznamka hlavicka-poznamka rukou pise" data-text="uvod.poznamka">${esc(t.uvod.poznamka)}</p>
</header>
<div class="hero-kresba kresba" data-psat aria-hidden="true">${kresbaHero()}</div>`;

  const sluzbyTelo = `<div class="sluzby">
${sluzby.map((s) => `<article class="sluzba">
<div class="sluzba-kresba kresba">${(KRESBY[s.kresba] || KRESBY.dum)()}</div>
<h3 class="pise">${esc(s.nazev)}</h3>
<p class="pise">${esc(s.popis)}</p>
</article>`).join("\n")}
</div>`;

  const filtry = `<div class="filtry" role="group" aria-label="Filtr prací">
<button class="filtr" data-filtr="vse" aria-pressed="true">${esc(t.prace.vse)}<span class="filtr-pocet">${p.vse}</span></button>
${sluzby.filter((s) => p[s.id]).map((s) =>
    `<button class="filtr" data-filtr="${s.id}" aria-pressed="false">${esc(s.nazev)}<span class="filtr-pocet">${p[s.id]}</span></button>`).join("\n")}
</div>`;

  const praceTelo = `${filtry}
<div class="prace-mrizka" data-prace>
${serazene.map(karta).join("\n")}
</div>`;

  const postupTelo = `<ol class="postup-osa">
${postup.map((krok) => `<li class="postup-krok">
<h3 class="pise">${esc(krok.nazev)}</h3><span class="postup-trvani">${esc(krok.trvani)}</span>
<p class="pise">${esc(krok.popis)}</p>
</li>`).join("\n")}
</ol>`;

  const oMneTelo = `${t.oMne.text.map((o) => `<p class="pise">${esc(o)}</p>`).join("\n")}
<div class="detail-cisla">
${t.oMne.cisla.map((c) => `<div class="detail-cislo"><strong class="pise">${esc(c.hodnota)}</strong><span>${esc(c.popisek)}</span></div>`).join("\n")}
</div>`;

  const kontaktTelo = `<form class="formular" id="poptavka" novalidate>
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
<div class="kontakt-udaje">
<p class="stitek">Nebo rovnou</p>
<p><a href="tel:${firma.telefonHref}" data-udaj="telefon">${esc(firma.telefon)}</a><br><a href="mailto:${firma.email}" data-udaj="email">${esc(firma.email)}</a></p>
</div>`;

  const telo = [
    hlavicka,
    sekce({ klic: "sluzby", id: "co-delam", cislo: t.sluzby.cislo, nadpis: t.sluzby.nadpis, perex: t.sluzby.perex, poznamka: t.sluzby.poznamka, telo: sluzbyTelo }),
    sekce({ klic: "prace", id: "prace", cislo: t.prace.cislo, nadpis: t.prace.nadpis, perex: t.prace.perex, poznamka: t.prace.poznamka, telo: praceTelo }),
    sekce({ klic: "postup", id: "postup", cislo: t.postup.cislo, nadpis: t.postup.nadpis, perex: t.postup.perex, poznamka: t.postup.poznamka, telo: postupTelo }),
    sekce({ klic: "oMne", id: "o-mne", cislo: t.oMne.cislo, nadpis: t.oMne.nadpis, poznamka: t.oMne.poznamka, telo: oMneTelo }),
    sekce({ klic: "kontakt", id: "kontakt", cislo: t.kontakt.cislo, nadpis: t.kontakt.nadpis, perex: t.kontakt.perex, poznamka: t.kontakt.poznamka, telo: kontaktTelo }),
  ].join("\n");

  void nazvyTypu;
  return stranka({ titulek: t.web.titulek, popis: t.web.popis, telo, t, firma, aktivni: "prace" });
}

export function detail(site, t, slug) {
  const serazene = serad(site.prace);
  const prace = serazene.find((x) => x.slug === slug);
  const okolo = sousedi(serazene, slug);
  const i = serazene.indexOf(prace);

  const fotky = (prace.fotky || []).length
    ? prace.fotky.map((f) => `<figure class="polozit">
<img src="../fotky/${f.varianty[0].soubor}" srcset="${(f.srcset || "").replace(/(^|, )/g, "$1../fotky/")}" sizes="(max-width: 900px) 92vw, 46vw" width="${f.sirka}" height="${f.vyska}" alt="${esc(f.popis || prace.nazev)}" data-lightbox="../fotky/${f.varianty[f.varianty.length - 1].soubor}" loading="lazy">
${f.popis ? `<figcaption>${esc(f.popis)}</figcaption>` : ""}
</figure>`).join("\n")
    : `<figure class="kresba">${zastupnaSkica(i + 2)}<figcaption>${esc(t.detail.fotky)}</figcaption></figure>
<figure class="kresba">${zastupnaSkica(i + 7)}<figcaption>&nbsp;</figcaption></figure>`;

  const telo = `<header class="detail-hlava" data-psat>
<div class="sekce-hlava">
<span class="sekce-cislo">${esc(prace.misto)}</span>
<p class="stitek"><a href="../index.html#prace">${esc(t.detail.zpet)}</a></p>
</div>
<div>
<h1 class="pise" data-znaky>${esc(prace.nazev)}</h1>
<p class="vedouci pise">${esc(prace.anotace)}</p>
<p class="prace-meta">${prace.rok} · ${esc(prace.stav)} · ${esc(prace.misto)}</p>
<div class="detail-cisla">
${(prace.cisla || []).map((c) => `<div class="detail-cislo"><strong class="pise">${esc(c.hodnota)}</strong><span>${esc(c.popisek)}</span></div>`).join("\n")}
</div>
</div>
</header>
<div class="detail-fotky" data-psat>${fotky}</div>
<section class="sekce" data-psat>
<div class="sekce-hlava"><span class="sekce-cislo">${esc(t.detail.zadani)}</span></div>
<div class="sekce-telo">
${(prace.popis || []).map((o) => `<p class="pise">${esc(o)}</p>`).join("\n")}
</div>
</section>
<nav class="sousedi">
<a href="${esc(okolo.predchozi.slug)}.html"><span class="stitek">${esc(t.detail.predchozi)}</span>${esc(okolo.predchozi.nazev)}</a>
<a href="${esc(okolo.dalsi.slug)}.html" style="text-align:right"><span class="stitek">${esc(t.detail.dalsi)}</span>${esc(okolo.dalsi.nazev)}</a>
</nav>`;

  return stranka({
    titulek: `${prace.nazev} — ateliér IDEJ`,
    popis: prace.anotace,
    telo, t, firma: site.firma, k: "../", aktivni: "prace",
  });
}
