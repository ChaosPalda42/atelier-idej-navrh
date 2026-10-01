/* Demo administrace — jen prohlížeč, žádný server.
   Čistou logiku dodává window.IDEJ.administrace (src/lib/administrace.mjs). */
(function () {
  "use strict";

  var A = (window.IDEJ || {}).administrace;
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };
  if (!A || !$(".admin-telo")) return;

  var KLIC = "idej-admin";
  var vychozi = JSON.parse($("#admin-vychozi").textContent);

  /* texty, které dává smysl pouštět do administrace */
  var TEXTY = [
    ["uvod.claim", "Úvodní věta"],
    ["uvod.text", "Úvodní odstavec"],
    ["uvod.poznamka", "Poznámka na okraji (úvod)"],
    ["sluzby.perex", "Co dělám — perex"],
    ["sluzby.poznamka", "Co dělám — poznámka"],
    ["prace.perex", "Práce — perex"],
    ["postup.perex", "Postup — perex"],
    ["oMne.poznamka", "O mně — poznámka"],
    ["kontakt.perex", "Kontakt — perex"],
    ["kontakt.hotovo", "Hláška po odeslání poptávky"],
  ];

  var KONTAKT = [
    ["telefon", "Telefon"], ["email", "E-mail"], ["ulice", "Ulice"],
    ["mesto", "Město"], ["ico", "IČO"], ["pravni", "Název firmy"], ["architekt", "Architekt"],
  ];

  function hodnota(obj, klic) {
    return klic.split(".").reduce(function (o, k) { return o && o[k]; }, obj);
  }

  function nacti() {
    try {
      var ulozene = localStorage.getItem(KLIC);
      if (ulozene) {
        var v = A.importuj(ulozene);
        if (v.stav) return v.stav;
      }
    } catch (e) { /* soukromé okno */ }
    return A.vychoziStav({ firma: vychozi.firma, prace: vychozi.prace });
  }

  var stav = nacti();

  function uloz() {
    try { localStorage.setItem(KLIC, A.exportuj(stav)); } catch (e) { /* nevadí */ }
    vykresli();
  }

  function pole(popisek, hodnotaPole, zmena, typ) {
    var obal = document.createElement("label");
    obal.className = "admin-pole";
    var popis = document.createElement("span");
    popis.textContent = popisek;
    var vstup = document.createElement(typ === "text" ? "textarea" : "input");
    if (typ !== "text") vstup.type = "text";
    vstup.value = hodnotaPole == null ? "" : hodnotaPole;
    vstup.addEventListener("change", function () { zmena(vstup.value); });
    obal.appendChild(popis);
    obal.appendChild(vstup);
    return obal;
  }

  /* ----------------------------------------------------------- přehled */
  function vykresliPrehled() {
    var kam = $("#admin-prehled");
    if (!kam) return;
    var nove = stav.poptavky.filter(function (p) { return p.stav === "nova"; }).length;
    var dlazdice = [
      ["Prací na webu", stav.prace.length],
      ["Došlé poptávky", stav.poptavky.length],
      ["Nepřečtené", nove],
      ["Přepsané texty", Object.keys(A.textyKPrepisu(stav)).length],
    ];
    kam.innerHTML = dlazdice.map(function (d) {
      return '<div class="admin-dlazdice-kus"><strong>' + d[1] + "</strong><span>" + d[0] + "</span></div>";
    }).join("");
  }

  /* -------------------------------------------------------------- práce */
  function vykresliPrace() {
    var kam = $("#admin-prace");
    if (!kam) return;
    kam.innerHTML = "";
    stav.prace.forEach(function (p, i) {
      var karta = document.createElement("article");
      karta.className = "admin-karta";
      var hlava = document.createElement("div");
      hlava.className = "admin-radek";
      var jmeno = document.createElement("strong");
      jmeno.textContent = p.nazev || "(bez názvu)";
      hlava.appendChild(jmeno);

      var ovladani = document.createElement("div");
      ovladani.className = "admin-ovladani";
      [["↑", -1], ["↓", 1]].forEach(function (dvojice) {
        var b = document.createElement("button");
        b.className = "admin-mini";
        b.textContent = dvojice[0];
        b.title = dvojice[1] < 0 ? "Posunout nahoru" : "Posunout dolů";
        b.disabled = (dvojice[1] < 0 && i === 0) || (dvojice[1] > 0 && i === stav.prace.length - 1);
        b.addEventListener("click", function () { stav = A.presun(stav, p.slug, dvojice[1]); uloz(); });
        ovladani.appendChild(b);
      });
      var smaz = document.createElement("button");
      smaz.className = "admin-mini admin-mini--zrusit";
      smaz.textContent = "Smazat";
      smaz.addEventListener("click", function () {
        if (confirm("Opravdu smazat „" + p.nazev + "“?")) { stav = A.smazPraci(stav, p.slug); uloz(); }
      });
      ovladani.appendChild(smaz);
      hlava.appendChild(ovladani);
      karta.appendChild(hlava);

      [["nazev", "Název"], ["misto", "Místo"], ["rok", "Rok"], ["stav", "Stav"]].forEach(function (d) {
        karta.appendChild(pole(d[1], p[d[0]], function (v) {
          var zmena = {};
          zmena[d[0]] = d[0] === "rok" ? Number(v) || v : v;
          stav = A.upravPraci(stav, p.slug, zmena);
          uloz();
        }));
      });
      karta.appendChild(pole("Anotace", p.anotace, function (v) {
        stav = A.upravPraci(stav, p.slug, { anotace: v }); uloz();
      }, "text"));
      kam.appendChild(karta);
    });
  }

  /* -------------------------------------------------------------- texty */
  function vykresliTexty() {
    var kam = $("#admin-texty");
    if (!kam) return;
    kam.innerHTML = "";
    TEXTY.forEach(function (d) {
      var klic = d[0];
      var zaklad = hodnota(vychozi.texty, klic) || "";
      var ulozeny = stav.texty[klic];
      kam.appendChild(pole(d[1], ulozeny ? ulozeny.hodnota : zaklad, function (v) {
        stav = A.nastavText(stav, klic, v.trim() === "" ? zaklad : v, zaklad);
        uloz();
      }, "text"));
    });
  }

  /* ----------------------------------------------------------- poptávky */
  function vykresliPoptavky() {
    var kam = $("#admin-poptavky");
    if (!kam) return;
    naberNovePoptavky();
    kam.innerHTML = "";
    if (!stav.poptavky.length) {
      kam.innerHTML = '<p class="vedouci">Zatím nic. Odešlete poptávku na webu a objeví se tady.</p>';
      return;
    }
    stav.poptavky.forEach(function (p) {
      var karta = document.createElement("article");
      karta.className = "admin-karta admin-karta--" + p.stav;
      karta.innerHTML =
        '<div class="admin-radek"><strong>' + (p.jmeno || "(bez jména)") + "</strong>" +
        '<span class="prace-meta">' + p.id + " · " + (p.kdy ? new Date(p.kdy).toLocaleString("cs") : "") + "</span></div>" +
        "<p>" + (p.zprava || "") + "</p>" +
        '<p class="prace-meta">' + [p.email, p.telefon].filter(Boolean).join(" · ") + "</p>";
      var radek = document.createElement("div");
      radek.className = "admin-ovladani";
      [["Přečteno", "ctena"], ["Vyřízeno", "vyrizena"], ["Nová", "nova"]].forEach(function (d) {
        var b = document.createElement("button");
        b.className = "admin-mini" + (p.stav === d[1] ? " je" : "");
        b.textContent = d[0];
        b.addEventListener("click", function () { stav = A.zmenStavPoptavky(stav, p.id, d[1]); uloz(); });
        radek.appendChild(b);
      });
      karta.appendChild(radek);
      kam.appendChild(karta);
    });
  }

  /* poptávky z webu čekají ve vlastním klíči, než je administrace převezme */
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

  /* ------------------------------------------------------------ kontakt */
  function vykresliKontakt() {
    var kam = $("#admin-kontakt");
    if (!kam) return;
    kam.innerHTML = "";
    KONTAKT.forEach(function (d) {
      kam.appendChild(pole(d[1], stav.kontakt[d[0]], function (v) {
        var novy = {};
        Object.keys(stav.kontakt).forEach(function (k) { novy[k] = stav.kontakt[k]; });
        novy[d[0]] = v;
        if (d[0] === "telefon") novy.telefonHref = "+420" + v.replace(/\D/g, "").slice(-9);
        stav = Object.assign({}, stav, { kontakt: novy });
        uloz();
      }));
    });
  }

  /* ------------------------------------------------------------- záloha */
  function zaloha() {
    var ven = $("#admin-export");
    var dovnitr = $("#admin-import");
    var reset = $("#admin-reset");
    var vypis = $("#admin-vypis");

    if (ven) ven.addEventListener("click", function () {
      var text = A.exportuj(stav);
      var odkaz = document.createElement("a");
      odkaz.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      odkaz.download = "atelier-idej-obsah.json";
      odkaz.click();
      URL.revokeObjectURL(odkaz.href);
      if (vypis) vypis.textContent = text.slice(0, 1200) + (text.length > 1200 ? "\n…" : "");
    });

    if (dovnitr) dovnitr.addEventListener("change", function () {
      var soubor = dovnitr.files[0];
      if (!soubor) return;
      soubor.text().then(function (text) {
        var v = A.importuj(text);
        if (v.chyba) { alert(v.chyba); return; }
        stav = v.stav;
        uloz();
      });
    });

    if (reset) reset.addEventListener("click", function () {
      if (!confirm("Vrátit ukázku do výchozího stavu?")) return;
      try { localStorage.removeItem(KLIC); localStorage.removeItem("idej-poptavky"); } catch (e) { /* nevadí */ }
      stav = A.vychoziStav({ firma: vychozi.firma, prace: vychozi.prace });
      uloz();
    });
  }

  /* ------------------------------------------------------------ záložky */
  function zalozky() {
    $$(".admin-zalozka").forEach(function (tlacitko) {
      tlacitko.addEventListener("click", function () {
        $$(".admin-zalozka").forEach(function (t) { t.setAttribute("aria-selected", String(t === tlacitko)); });
        $$(".admin-panel").forEach(function (p) {
          p.hidden = p.dataset.panel !== tlacitko.dataset.zalozka;
        });
      });
    });
  }

  function vykresli() {
    vykresliPrehled();
    vykresliPrace();
    vykresliTexty();
    vykresliPoptavky();
    vykresliKontakt();
  }

  var pridat = $("#admin-pridat");
  if (pridat) pridat.addEventListener("click", function () {
    var nazev = prompt("Název nové práce:");
    if (!nazev) return;
    stav = A.pridejPraci(stav, {
      nazev: nazev, typ: "domy", misto: "", rok: new Date().getFullYear(),
      stav: "studie", anotace: "", popis: [], cisla: [], fotky: []
    });
    uloz();
  });

  zalozky();
  zaloha();
  vykresli();
})();
