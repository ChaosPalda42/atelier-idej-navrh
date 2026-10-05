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
    return A.vychoziStav({ firma: D.firma, prace: D.skici, projekty: D.site.projekty });
  }

  /** Uložený stav může být starší než web. Srovnání (C-006) nikdy nic nezahodí:
      co je jen v souboru, přibyde; co si uživatel přidal sám, zůstane. */
  function srovnej(ulozeny) {
    return Object.assign({}, ulozeny, {
      prace: A.srovnejSeznam(ulozeny.prace, D.skici),
      projekty: A.srovnejSeznam(ulozeny.projekty, D.site.projekty || []),
    });
  }

  function nacti() {
    try {
      var ulozene = localStorage.getItem(KLIC);
      if (ulozene) {
        var v = A.importuj(ulozene);
        if (v.stav) return srovnej(v.stav);
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
    var skupiny = D.site.skupiny.map(function (s) { return { id: s.id, nazev: s.nazev }; });

    stav.prace.forEach(function (p, i) {
      var karta = prvek("article", "admin-karta" + (p.skryta ? " admin-karta--skryta" : ""));
      var hlava = prvek("div", "admin-radek");
      hlava.appendChild(prvek("strong", "", (p.nazev || "(bez názvu)") +
        (p.otoceni ? "  ·  otočeno o " + p.otoceni + "°" : "")));

      var ovladani = prvek("div", "admin-ovladani");
      [["↑", -1], ["↓", 1]].forEach(function (d) {
        var b = prvek("button", "admin-mini", d[0]);
        b.title = d[1] < 0 ? "Posunout nahoru" : "Posunout dolů";
        b.disabled = (d[1] < 0 && i === 0) || (d[1] > 0 && i === stav.prace.length - 1);
        b.addEventListener("click", function () { stav = A.presun(stav, p.slug, d[1]); uloz(); });
        ovladani.appendChild(b);
      });
      [["↶", -90], ["↷", 90]].forEach(function (d) {
        var b = prvek("button", "admin-mini", d[0]);
        b.title = d[1] < 0 ? "Otočit doleva" : "Otočit doprava";
        b.addEventListener("click", function () {
          var uhel = (((Number(p.otoceni) || 0) + d[1]) % 360 + 360) % 360;
          stav = A.upravPraci(stav, p.slug, { otoceni: uhel });
          uloz();
        });
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

      if (p.obrazek) karta.appendChild(nahled(p.obrazek));
      karta.appendChild(jakToDopadlo(p));
      kam.appendChild(karta);
    });

    kam.appendChild(nahravani("+ Nahrát novou skicu", function (id, rozmery) {
      stav = A.pridejPraci(stav, {
        nazev: "Nová skica", typ: (D.site.skupiny[0] || {}).id || "",
        obrazek: id, sirka: rozmery.sirka, vyska: rozmery.vyska, vlastni: true,
      });
      uloz();
    }));
  }

  /* ------------------------------------------- jak to dopadlo (u skici) */
  /* Architekt má nejdřív skicu a teprve později hotovou stavbu. Výsledek se
     proto zadává od skici, ne od projektu: fotky a text se zapisují do
     projektu, pod který skica patří, a když žádný není, vyrobí se. */
  function projektKeSkice(slugSkici) {
    return (stav.projekty || []).find(function (pr) {
      return (pr.skici || []).indexOf(slugSkici) >= 0;
    }) || null;
  }

  function jakToDopadlo(skica) {
    var obal = prvek("div", "admin-vysledek");
    var projekt = projektKeSkice(skica.slug);

    var hlavicka = prvek("div", "admin-radek");
    hlavicka.appendChild(prvek("span", "admin-pole-popis", "Jak to dopadlo"));
    if (projekt) {
      var odkaz = document.createElement("a");
      odkaz.className = "admin-mini";
      odkaz.href = D.korenAdmin + "prace/" + projekt.slug + ".html";
      odkaz.textContent = "Otevřít list projektu";
      hlavicka.appendChild(odkaz);
    }
    obal.appendChild(hlavicka);

    if (!projekt) {
      var zalozit = prvek("button", "tlacitko lehke", "+ Doplnit, jak to dopadlo");
      zalozit.addEventListener("click", function () {
        stav = A.pridejProjekt(stav, {
          nazev: skica.nazev || "Nový projekt", typ: skica.typ || "",
          misto: "", rok: new Date().getFullYear(), anotace: "",
          text: [""], skici: [skica.slug], fotky: [], vlastni: true,
        });
        uloz();
      });
      obal.appendChild(zalozit);
      return obal;
    }

    var popis = prvek("label", "admin-pole");
    popis.appendChild(prvek("span", "admin-pole-popis", "Text k realizaci"));
    var plocha = document.createElement("textarea");
    plocha.value = (projekt.text || []).join("\n\n");
    plocha.placeholder = "Co z návrhu nakonec vzniklo.";
    plocha.addEventListener("change", function () {
      var odstavce = plocha.value.split(/\n\s*\n/).map(function (o) { return o.trim(); })
        .filter(function (o) { return o.length; });
      stav = A.upravProjekt(stav, projekt.slug, { text: odstavce.length ? odstavce : [""] });
      uloz();
    });
    popis.appendChild(plocha);
    obal.appendChild(popis);

    var fotky = prvek("div", "admin-pole");
    fotky.appendChild(prvek("span", "admin-pole-popis", "Fotografie realizace"));
    var rada = prvek("div", "admin-fotky");
    (projekt.fotky || []).forEach(function (id) {
      var box = prvek("figure", "admin-fotka");
      if (String(id).indexOf("nahrane-") === 0) box.appendChild(nahled(id));
      else {
        var obraz = document.createElement("img");
        obraz.className = "admin-nahled";
        obraz.src = D.korenAdmin + "obrazky/" + id + "-520.jpg";
        obraz.alt = "";
        box.appendChild(obraz);
      }
      var pryc = prvek("button", "admin-mini", "×");
      pryc.title = "Odebrat fotografii";
      pryc.addEventListener("click", function () {
        stav = A.upravProjekt(stav, projekt.slug, {
          fotky: (projekt.fotky || []).filter(function (x) { return x !== id; }),
        });
        if (String(id).indexOf("nahrane-") === 0) OBRAZKY.smaz(id);
        uloz();
      });
      box.appendChild(pryc);
      rada.appendChild(box);
    });
    rada.appendChild(nahravani("+ Nahrát fotografii", function (id) {
      stav = A.upravProjekt(stav, projekt.slug, { fotky: (projekt.fotky || []).concat([id]) });
      uloz();
    }));
    fotky.appendChild(rada);
    obal.appendChild(fotky);
    return obal;
  }

  /* ------------------------------------------------------------- obrázky */
  /* Nahrané obrázky nemůžou do localStorage — jedna skica v base64 má přes
     půl mega a úložiště má kolem pěti. Jdou proto do IndexedDB, kde je
     místa dost, a ve stavu zůstane jen jejich id. */
  var OBRAZKY = (function () {
    var DB = "idej-obrazky", SKLAD = "soubory", spojeni = null;

    function otevri() {
      if (spojeni) return spojeni;
      spojeni = new Promise(function (hotovo, chyba) {
        var zadost = indexedDB.open(DB, 1);
        zadost.onupgradeneeded = function () {
          if (!zadost.result.objectStoreNames.contains(SKLAD)) {
            zadost.result.createObjectStore(SKLAD, { keyPath: "id" });
          }
        };
        zadost.onsuccess = function () { hotovo(zadost.result); };
        zadost.onerror = function () { chyba(zadost.error); };
      });
      return spojeni;
    }

    function prikaz(rezim, co) {
      return otevri().then(function (db) {
        return new Promise(function (hotovo, chyba) {
          var t = db.transaction(SKLAD, rezim);
          var v = co(t.objectStore(SKLAD));
          t.oncomplete = function () { hotovo(v && v.result); };
          t.onerror = function () { chyba(t.error); };
        });
      });
    }

    /* Zmenšení v prohlížeči: fotka z mobilu má klidně 4000 px a do ukázky
       je to zbytečné. Poměr stran se nemění.

       PNG zůstává PNG: skici mají průhledné pozadí, aby ležely přímo na
       papíře listu. Převod na JPEG by z průhledna udělal ČERNOU. */
    function zmensi(soubor, maxSirka) {
      return new Promise(function (hotovo, chyba) {
        var cteni = new FileReader();
        cteni.onerror = function () { chyba(cteni.error); };
        cteni.onload = function () {
          var obraz = new Image();
          obraz.onerror = function () { chyba(new Error("obrázek nejde přečíst")); };
          obraz.onload = function () {
            var mer = Math.min(1, maxSirka / obraz.naturalWidth);
            var w = Math.round(obraz.naturalWidth * mer);
            var h = Math.round(obraz.naturalHeight * mer);
            var platno = document.createElement("canvas");
            platno.width = w; platno.height = h;
            platno.getContext("2d").drawImage(obraz, 0, 0, w, h);
            var pruhledne = soubor.type === "image/png" || soubor.type === "image/webp";
            platno.toBlob(function (blob) {
              hotovo({ blob: blob, sirka: w, vyska: h });
            }, pruhledne ? "image/png" : "image/jpeg", 0.86);
          };
          obraz.src = cteni.result;
        };
        cteni.readAsDataURL(soubor);
      });
    }

    return {
      uloz: function (soubor) {
        return zmensi(soubor, 1600).then(function (v) {
          var id = "nahrane-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
          return prikaz("readwrite", function (sklad) {
            sklad.put({ id: id, blob: v.blob, sirka: v.sirka, vyska: v.vyska, nazev: soubor.name });
          }).then(function () { return { id: id, sirka: v.sirka, vyska: v.vyska }; });
        });
      },
      nacti: function (id) {
        return prikaz("readonly", function (sklad) { return sklad.get(id); });
      },
      smaz: function (id) {
        return prikaz("readwrite", function (sklad) { sklad.delete(id); });
      },
    };
  })();

  /** Náhled nahraného obrázku; vrátí <img>, který se doplní, až se načte. */
  function nahled(id, trida) {
    var obraz = document.createElement("img");
    obraz.className = trida || "admin-nahled";
    obraz.alt = "";
    OBRAZKY.nacti(id).then(function (zaznam) {
      if (zaznam) obraz.src = URL.createObjectURL(zaznam.blob);
    });
    return obraz;
  }

  /** Tlačítko pro výběr souboru. `hotovo(id, rozmery)` po uložení. */
  function nahravani(popisek, hotovo) {
    var obal = prvek("label", "admin-nahrat");
    obal.appendChild(prvek("span", "", popisek));
    var vstup = document.createElement("input");
    vstup.type = "file";
    vstup.accept = "image/*";
    vstup.hidden = true;
    vstup.addEventListener("change", function () {
      var soubor = vstup.files && vstup.files[0];
      if (!soubor) return;
      obal.classList.add("admin-nahrat--pracuje");
      OBRAZKY.uloz(soubor).then(function (v) {
        obal.classList.remove("admin-nahrat--pracuje");
        vstup.value = "";
        hotovo(v.id, v);
      }).catch(function () {
        obal.classList.remove("admin-nahrat--pracuje");
        obal.classList.add("admin-nahrat--chyba");
      });
    });
    obal.appendChild(vstup);
    return obal;
  }

  /* ------------------------------------------------------------ projekty */
  function vykresliProjekty() {
    var kam = $("#admin-projekty");
    if (!kam) return;
    kam.innerHTML = "";

    var skupiny = D.site.skupiny.map(function (s) { return { id: s.id, nazev: s.nazev }; });
    var vsechnySkici = (stav.prace || []).map(function (p) {
      return { slug: p.slug, nazev: p.nazev || p.slug };
    });

    function pole(karta, popis, hodnota, zapis, druh) {
      var l = prvek("label", "admin-pole");
      l.appendChild(prvek("span", "admin-pole-popis", popis));
      var vstup = document.createElement(druh === "text" ? "textarea" : "input");
      if (druh && druh !== "text") vstup.type = druh;
      vstup.value = hodnota == null ? "" : hodnota;
      vstup.addEventListener("change", function () { zapis(vstup.value); });
      l.appendChild(vstup);
      karta.appendChild(l);
      return vstup;
    }

    (stav.projekty || []).forEach(function (p, i) {
      var karta = prvek("article", "admin-karta" + (p.skryty ? " admin-karta--skryta" : ""));

      var hlava = prvek("div", "admin-radek");
      hlava.appendChild(prvek("strong", "", p.nazev || "(bez názvu)"));
      var ovladani = prvek("div", "admin-ovladani");
      [["↑", -1], ["↓", 1]].forEach(function (d) {
        var b = prvek("button", "admin-mini", d[0]);
        b.title = d[1] < 0 ? "Posunout nahoru" : "Posunout dolů";
        b.disabled = (d[1] < 0 && i === 0) || (d[1] > 0 && i === stav.projekty.length - 1);
        b.addEventListener("click", function () { stav = A.presunProjekt(stav, p.slug, d[1]); uloz(); });
        ovladani.appendChild(b);
      });
      var schovat = prvek("button", "admin-mini", p.skryty ? "Zobrazit" : "Skrýt");
      schovat.addEventListener("click", function () {
        stav = A.upravProjekt(stav, p.slug, { skryty: !p.skryty }); uloz();
      });
      ovladani.appendChild(schovat);
      var smazat = prvek("button", "admin-mini", "Smazat");
      smazat.addEventListener("click", function () {
        if (p.vlastni) stav = A.smazProjekt(stav, p.slug);
        else stav = A.upravProjekt(stav, p.slug, { smazano: true });
        uloz();
      });
      ovladani.appendChild(smazat);
      hlava.appendChild(ovladani);
      karta.appendChild(hlava);

      pole(karta, "Název", p.nazev, function (v) { stav = A.upravProjekt(stav, p.slug, { nazev: v }); uloz(); });
      var radek = prvek("div", "admin-dvojice");
      karta.appendChild(radek);
      pole(radek, "Místo", p.misto, function (v) { stav = A.upravProjekt(stav, p.slug, { misto: v }); uloz(); });
      pole(radek, "Rok", p.rok, function (v) { stav = A.upravProjekt(stav, p.slug, { rok: Number(v) || v }); uloz(); }, "number");

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
        stav = A.upravProjekt(stav, p.slug, { typ: vyber.value }); uloz();
      });
      skupina.appendChild(vyber);
      karta.appendChild(skupina);

      pole(karta, "Úvodní věta", p.anotace, function (v) {
        stav = A.upravProjekt(stav, p.slug, { anotace: v }); uloz();
      }, "text");
      (p.text || []).forEach(function (odstavec, j) {
        pole(karta, "Odstavec " + (j + 1), odstavec, function (v) {
          var novy = (p.text || []).slice();
          novy[j] = v;
          stav = A.upravProjekt(stav, p.slug, { text: novy }); uloz();
        }, "text");
      });
      var pridatOdstavec = prvek("button", "admin-mini", "+ odstavec");
      pridatOdstavec.addEventListener("click", function () {
        stav = A.upravProjekt(stav, p.slug, { text: (p.text || []).concat([""]) }); uloz();
      });
      karta.appendChild(pridatOdstavec);

      /* skici projektu */
      var skiciPole = prvek("div", "admin-pole");
      skiciPole.appendChild(prvek("span", "admin-pole-popis", "Skici projektu"));
      var seznam = prvek("div", "admin-volby");
      vsechnySkici.forEach(function (s) {
        var l = prvek("label", "admin-volba");
        var z = document.createElement("input");
        z.type = "checkbox";
        z.checked = (p.skici || []).indexOf(s.slug) >= 0;
        z.addEventListener("change", function () {
          var vybrane = (p.skici || []).filter(function (x) { return x !== s.slug; });
          if (z.checked) vybrane.push(s.slug);
          stav = A.upravProjekt(stav, p.slug, { skici: vybrane }); uloz();
        });
        l.appendChild(z);
        l.appendChild(prvek("span", "", s.nazev));
        seznam.appendChild(l);
      });
      skiciPole.appendChild(seznam);
      karta.appendChild(skiciPole);

      /* fotografie */
      var fotky = prvek("div", "admin-pole");
      fotky.appendChild(prvek("span", "admin-pole-popis", "Fotografie"));
      var rada = prvek("div", "admin-fotky");
      (p.fotky || []).forEach(function (id) {
        var box = prvek("figure", "admin-fotka");
        if (id.indexOf("nahrane-") === 0) box.appendChild(nahled(id));
        else {
          var obraz = document.createElement("img");
          obraz.className = "admin-nahled";
          obraz.src = D.korenAdmin + "obrazky/" + id + "-520.jpg";
          obraz.alt = "";
          box.appendChild(obraz);
        }
        var pryc = prvek("button", "admin-mini", "×");
        pryc.title = "Odebrat fotografii";
        pryc.addEventListener("click", function () {
          stav = A.upravProjekt(stav, p.slug, {
            fotky: (p.fotky || []).filter(function (x) { return x !== id; }),
          });
          if (id.indexOf("nahrane-") === 0) OBRAZKY.smaz(id);
          uloz();
        });
        box.appendChild(pryc);
        rada.appendChild(box);
      });
      rada.appendChild(nahravani("+ Nahrát fotografii", function (id) {
        stav = A.upravProjekt(stav, p.slug, { fotky: (p.fotky || []).concat([id]) });
        uloz();
      }));
      fotky.appendChild(rada);
      karta.appendChild(fotky);

      kam.appendChild(karta);
    });

    var pridat = prvek("button", "tlacitko lehke", "+ Nový projekt");
    pridat.addEventListener("click", function () {
      stav = A.pridejProjekt(stav, {
        nazev: "Nový projekt", misto: "", rok: new Date().getFullYear(),
        typ: (D.site.skupiny[0] || {}).id || "", anotace: "", text: [""],
        skici: [], fotky: [], vlastni: true,
      });
      uloz();
    });
    kam.appendChild(pridat);
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
    if (stranka === "projekty") vykresliProjekty();
    if (stranka === "poptavky") vykresliPoptavky();
    if (stranka === "kontakt") vykresliKontakt();
  }

  zaloha();
  vykresli();
})();
