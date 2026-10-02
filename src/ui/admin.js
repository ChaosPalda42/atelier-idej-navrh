/* Demo administrace — několik listů, data drží jen prohlížeč.
   Čistou logiku dodává window.IDEJ.administrace (src/lib/administrace.mjs). */
(function () {
  "use strict";

  var A = (window.IDEJ || {}).administrace;
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };
  var obal = $(".admin-list");
  if (!A || !obal) return;

  var KLIC = "idej-admin";
  var D = JSON.parse($("#admin-data").textContent);
  var stranka = obal.dataset.admin;

  /* -------------------------------------------------------- stav a ukládání */
  function vychozi() {
    return A.vychoziStav({ firma: D.firma, prace: D.skici });
  }

  /** Uložený stav může být starší než web — srovná se se skutečným seznamem skic. */
  function srovnejSeSkicami(ulozeny) {
    var zname = {};
    D.skici.forEach(function (s) { zname[s.slug] = s; });
    var mam = {};
    (ulozeny.prace || []).forEach(function (p) { if (p && p.slug) mam[p.slug] = true; });

    var prace = (ulozeny.prace || []).filter(function (p) { return p && zname[p.slug]; });
    D.skici.forEach(function (s) { if (!mam[s.slug]) prace.push(s); });
    return Object.assign({}, ulozeny, { prace: prace });
  }

  function nacti() {
    try {
      var ulozene = localStorage.getItem(KLIC);
      if (ulozene) {
        var v = A.importuj(ulozene);
        if (v.stav) return srovnejSeSkicami(v.stav);
      }
    } catch (e) { /* soukromé okno */ }
    return vychozi();
  }

  var stav = nacti();

  function uloz() {
    try { localStorage.setItem(KLIC, A.exportuj(stav)); } catch (e) { /* nevadí */ }
    vykresli();
  }

  /** Původní znění klíče: `site.*` sahá do dat webu, zbytek do textů. */
  function puvodni(klic) {
    var zdroj = D.texty;
    var cesta = klic;
    if (klic.indexOf("site.") === 0) { zdroj = D.site; cesta = klic.slice(5); }
    return cesta.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, zdroj);
  }

  function nyni(klic) {
    var zapis = stav.texty[klic];
    return zapis ? zapis.hodnota : puvodni(klic);
  }

  /* ------------------------------------------------------------- stavební prvky */
  function prvek(znacka, trida, text) {
    var el = document.createElement(znacka);
    if (trida) el.className = trida;
    if (text != null) el.textContent = text;
    return el;
  }

  function poleTextu(pole) {
    var zmeneno = Object.prototype.hasOwnProperty.call(stav.texty, pole.klic);
    var obalek = prvek("div", "admin-pole" + (zmeneno ? " je-zmeneno" : ""));

    var hlava = prvek("div", "admin-pole-hlava");
    hlava.appendChild(prvek("span", "admin-pole-popis", pole.popisek));
    if (zmeneno) {
      var vrat = prvek("button", "admin-mini admin-mini--vratit", "Vrátit původní");
      vrat.addEventListener("click", function () {
        stav = A.nastavText(stav, pole.klic, puvodni(pole.klic), puvodni(pole.klic));
        uloz();
      });
      hlava.appendChild(vrat);
    }
    obalek.appendChild(hlava);

    var vstup = document.createElement(pole.dlouhe ? "textarea" : "input");
    if (!pole.dlouhe) vstup.type = "text";
    vstup.value = nyni(pole.klic) == null ? "" : nyni(pole.klic);
    vstup.addEventListener("change", function () {
      stav = A.nastavText(stav, pole.klic, vstup.value, puvodni(pole.klic));
      uloz();
    });
    obalek.appendChild(vstup);

    if (zmeneno) {
      obalek.appendChild(prvek("p", "admin-puvodni", "Původně: " + puvodni(pole.klic)));
    }
    return obalek;
  }

  function vykresliSadu(nazevSady) {
    var kam = $("#admin-pole");
    if (!kam) return;
    kam.innerHTML = "";
    (D.schema[nazevSady] || []).forEach(function (skupina) {
      var blok = prvek("section", "admin-skupina");
      blok.appendChild(prvek("h2", "", skupina.nazev));
      skupina.pole.forEach(function (p) { blok.appendChild(poleTextu(p)); });
      kam.appendChild(blok);
    });
  }

  /* ------------------------------------------------------------------ přehled */
  function vykresliPrehled() {
    var kam = $("#admin-prehled");
    if (!kam) return;
    var nove = stav.poptavky.filter(function (p) { return p.stav === "nova"; }).length;
    var skryte = stav.prace.filter(function (p) { return p.skryta; }).length;
    var dlazdice = [
      ["Skic ve skicáku", stav.prace.length - skryte, "skici"],
      ["Došlé poptávky", stav.poptavky.length, "poptavky"],
      ["Nepřečtené", nove, "poptavky"],
      ["Přepsaných textů", Object.keys(A.textyKPrepisu(stav)).length, "texty"],
    ];
    kam.innerHTML = "";
    dlazdice.forEach(function (d) {
      var odkaz = document.createElement("a");
      odkaz.className = "admin-dlazdice-kus";
      odkaz.href = D.korenAdmin + (D.listy.filter(function (l) { return l.id === d[2]; })[0] || {}).soubor;
      odkaz.innerHTML = "<strong>" + d[1] + "</strong><span>" + d[0] + "</span>";
      kam.appendChild(odkaz);
    });

    var zmeny = $("#admin-zmeny");
    if (!zmeny) return;
    zmeny.innerHTML = "";
    var klice = Object.keys(A.textyKPrepisu(stav));
    if (!klice.length) {
      zmeny.innerHTML = '<p class="vedouci">Zatím jste nic nezměnili. Web běží na výchozích textech.</p>';
      return;
    }
    zmeny.appendChild(prvek("h2", "", "Co jste změnili"));
    klice.forEach(function (klic) {
      var karta = prvek("div", "admin-karta");
      karta.appendChild(prvek("p", "stitek", klic));
      karta.appendChild(prvek("p", "", stav.texty[klic].hodnota));
      var vrat = prvek("button", "admin-mini admin-mini--vratit", "Vrátit původní");
      vrat.addEventListener("click", function () {
        stav = A.nastavText(stav, klic, puvodni(klic), puvodni(klic));
        uloz();
      });
      karta.appendChild(vrat);
      zmeny.appendChild(karta);
    });
  }

  /* -------------------------------------------------------------------- skici */
  function vykresliSkici() {
    var kam = $("#admin-skici");
    if (!kam) return;
    kam.innerHTML = "";
    var skupiny = D.site.sluzby.map(function (s) { return { id: s.id, nazev: s.nazev }; });

    stav.prace.forEach(function (p, i) {
      var karta = prvek("article", "admin-karta" + (p.skryta ? " admin-karta--skryta" : ""));
      var hlava = prvek("div", "admin-radek");
      hlava.appendChild(prvek("strong", "", p.nazev || "(bez názvu)"));

      var ovladani = prvek("div", "admin-ovladani");
      [["↑", -1], ["↓", 1]].forEach(function (d) {
        var b = prvek("button", "admin-mini", d[0]);
        b.title = d[1] < 0 ? "Posunout nahoru" : "Posunout dolů";
        b.disabled = (d[1] < 0 && i === 0) || (d[1] > 0 && i === stav.prace.length - 1);
        b.addEventListener("click", function () { stav = A.presun(stav, p.slug, d[1]); uloz(); });
        ovladani.appendChild(b);
      });
      var schovat = prvek("button", "admin-mini", p.skryta ? "Zobrazit" : "Skrýt");
      schovat.addEventListener("click", function () {
        stav = A.upravPraci(stav, p.slug, { skryta: !p.skryta });
        uloz();
      });
      ovladani.appendChild(schovat);
      hlava.appendChild(ovladani);
      karta.appendChild(hlava);

      var jmeno = prvek("label", "admin-pole");
      jmeno.appendChild(prvek("span", "admin-pole-popis", "Název"));
      var vstup = document.createElement("input");
      vstup.type = "text";
      vstup.value = p.nazev || "";
      vstup.addEventListener("change", function () {
        stav = A.upravPraci(stav, p.slug, { nazev: vstup.value }); uloz();
      });
      jmeno.appendChild(vstup);
      karta.appendChild(jmeno);

      var skupina = prvek("label", "admin-pole");
      skupina.appendChild(prvek("span", "admin-pole-popis", "Skupina"));
      var vyber = document.createElement("select");
      skupiny.forEach(function (s) {
        var o = document.createElement("option");
        o.value = s.id; o.textContent = s.nazev;
        if (s.id === p.typ) o.selected = true;
        vyber.appendChild(o);
      });
      vyber.addEventListener("change", function () {
        stav = A.upravPraci(stav, p.slug, { typ: vyber.value }); uloz();
      });
      skupina.appendChild(vyber);
      karta.appendChild(skupina);
      kam.appendChild(karta);
    });
  }

  /* ----------------------------------------------------------------- poptávky */
  function naberNovePoptavky() {
    var fronta = [];
    try { fronta = JSON.parse(localStorage.getItem("idej-poptavky") || "[]"); } catch (e) { fronta = []; }
    if (!fronta.length) return;
    fronta.slice().reverse().forEach(function (p) { stav = A.prijmiPoptavku(stav, p); });
    try {
      localStorage.removeItem("idej-poptavky");
      localStorage.setItem(KLIC, A.exportuj(stav));
    } catch (e) { /* nevadí */ }
  }

  function vykresliPoptavky() {
    var kam = $("#admin-poptavky");
    if (!kam) return;
    naberNovePoptavky();
    kam.innerHTML = "";
    if (!stav.poptavky.length) {
      kam.innerHTML = '<p class="vedouci">Zatím nic.</p>';
      return;
    }
    stav.poptavky.forEach(function (p) {
      var karta = prvek("article", "admin-karta admin-karta--" + p.stav);
      karta.innerHTML =
        '<div class="admin-radek"><strong>' + (p.jmeno || "(bez jména)") + "</strong>" +
        '<span class="prace-meta">' + p.id + " · " + (p.kdy ? new Date(p.kdy).toLocaleString("cs") : "") + "</span></div>" +
        "<p>" + (p.zprava || "") + "</p>" +
        '<p class="prace-meta">' + [p.email, p.telefon].filter(Boolean).join(" · ") + "</p>";
      var radek = prvek("div", "admin-ovladani");
      [["Přečteno", "ctena"], ["Vyřízeno", "vyrizena"], ["Nová", "nova"]].forEach(function (d) {
        var b = prvek("button", "admin-mini" + (p.stav === d[1] ? " je" : ""), d[0]);
        b.addEventListener("click", function () { stav = A.zmenStavPoptavky(stav, p.id, d[1]); uloz(); });
        radek.appendChild(b);
      });
      karta.appendChild(radek);
      kam.appendChild(karta);
    });
  }

  /* ------------------------------------------------------------------ kontakt */
  var KONTAKT = [
    ["telefon", "Telefon"], ["email", "E-mail"], ["ulice", "Ulice a číslo"],
    ["mesto", "PSČ a město"], ["ico", "IČO"], ["pravni", "Název firmy"],
    ["architekt", "Jméno architekta"], ["domena", "Doména"],
  ];

  function vykresliKontakt() {
    var kam = $("#admin-kontakt");
    if (!kam) return;
    kam.innerHTML = "";
    var blok = prvek("section", "admin-skupina");
    blok.appendChild(prvek("h2", "", "Kontaktní údaje"));
    KONTAKT.forEach(function (d) {
      var obalek = prvek("label", "admin-pole");
      obalek.appendChild(prvek("span", "admin-pole-popis", d[1]));
      var vstup = document.createElement("input");
      vstup.type = "text";
      vstup.value = stav.kontakt[d[0]] == null ? "" : stav.kontakt[d[0]];
      vstup.addEventListener("change", function () {
        var novy = Object.assign({}, stav.kontakt);
        novy[d[0]] = vstup.value;
        if (d[0] === "telefon") novy.telefonHref = "+420" + vstup.value.replace(/\D/g, "").slice(-9);
        stav = Object.assign({}, stav, { kontakt: novy });
        uloz();
      });
      obalek.appendChild(vstup);
      blok.appendChild(obalek);
    });
    kam.appendChild(blok);
  }

  /* ------------------------------------------------------------------- záloha */
  function zaloha() {
    var ven = $("#admin-export");
    var dovnitr = $("#admin-import");
    var reset = $("#admin-reset");
    var vypis = $("#admin-vypis");
    if (!ven) return;

    ven.addEventListener("click", function () {
      var text = A.exportuj(stav);
      var odkaz = document.createElement("a");
      odkaz.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      odkaz.download = "atelier-idej-obsah.json";
      odkaz.click();
      URL.revokeObjectURL(odkaz.href);
      if (vypis) vypis.textContent = text.slice(0, 1500) + (text.length > 1500 ? "\n…" : "");
    });

    dovnitr.addEventListener("change", function () {
      var soubor = dovnitr.files[0];
      if (!soubor) return;
      soubor.text().then(function (text) {
        var v = A.importuj(text);
        if (v.chyba) { alert(v.chyba); return; }
        stav = v.stav;
        uloz();
      });
    });

    reset.addEventListener("click", function () {
      if (!confirm("Vrátit ukázku do výchozího stavu?")) return;
      try { localStorage.removeItem(KLIC); localStorage.removeItem("idej-poptavky"); } catch (e) { /* nevadí */ }
      stav = vychozi();
      uloz();
    });
  }

  /* -------------------------------------------------------------------- běh */
  function vykresli() {
    if (stranka === "prehled") vykresliPrehled();
    if (stranka === "texty" || stranka === "sluzby" || stranka === "postup") {
      vykresliSadu($("#admin-pole").dataset.sada);
    }
    if (stranka === "skici") vykresliSkici();
    if (stranka === "poptavky") vykresliPoptavky();
    if (stranka === "kontakt") vykresliKontakt();
  }

  zaloha();
  vykresli();
})();
