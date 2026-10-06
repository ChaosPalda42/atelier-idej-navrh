/* ateliér IDEJ — chování webu.
   Text je v HTML celý; tenhle skript ho jen odkrývá tak, jak by ho psala ruka.
   Logiku času a viditelnosti dodávají moduly ve window.IDEJ (src/lib). */
(function () {
  "use strict";

  var L = window.IDEJ || {};
  var $ = function (sel, kde) { return (kde || document).querySelector(sel); };
  var $$ = function (sel, kde) { return Array.prototype.slice.call((kde || document).querySelectorAll(sel)); };

  var tlumene = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var uzVidel = false;
  try { uzVidel = sessionStorage.getItem("idej-videno") === "1"; } catch (e) { uzVidel = false; }
  try { sessionStorage.setItem("idej-videno", "1"); } catch (e) { /* soukromé okno */ }

  /* Při návratu na web se nepíše celé znovu — jen se to svižně dopíše. */
  var RYCHLOST = tlumene ? 0 : (uzVidel ? 0.3 : 1);
  var psaniZapnuto = !tlumene && !!(L.pisar && L.odkryti);

  /* ------------------------------------------------------- dělení na slova */
  function rozdel(el) {
    if (el.dataset.rozdeleno) return;
    var poZnacich = el.hasAttribute("data-znaky");
    var chodec = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var uzly = [];
    while (chodec.nextNode()) uzly.push(chodec.currentNode);

    uzly.forEach(function (uzel) {
      if (!uzel.nodeValue || !uzel.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      uzel.nodeValue.split(/(\s+)/).forEach(function (kus) {
        if (!kus) return;
        if (/^\s+$/.test(kus)) { frag.appendChild(document.createTextNode(kus)); return; }
        if (!poZnacich) {
          var s = document.createElement("span");
          s.className = "s";
          s.textContent = kus;
          frag.appendChild(s);
          return;
        }
        var slovo = document.createElement("span");
        slovo.className = "sl";
        Array.prototype.forEach.call(kus, function (znak) {
          var z = document.createElement("span");
          z.className = "s";
          z.textContent = znak;
          slovo.appendChild(z);
        });
        frag.appendChild(slovo);
      });
      uzel.parentNode.replaceChild(frag, uzel);
    });
    el.dataset.rozdeleno = "1";
  }

  /* ------------------------------------------------------- příprava kreseb */
  function pripravKresbu(el) {
    if (el.dataset.pripraveno) return;
    var cary = $$("path, line, polyline, circle, rect, ellipse", el).filter(function (c) {
      var styl = getComputedStyle(c);
      return styl.stroke && styl.stroke !== "none";
    });
    var celkem = 0;
    cary.forEach(function (c) {
      var delka = 0;
      try { delka = c.getTotalLength(); } catch (e) { delka = 0; }
      if (!delka) { delka = 120; }
      c.setAttribute("data-delka", "1");
      c.style.setProperty("--delka", Math.ceil(delka) + "px");
      c.style.setProperty("--poradi", celkem);
      celkem += delka;
    });
    el.dataset.cary = cary.length;
    el.dataset.delka = Math.round(celkem);
    el.dataset.pripraveno = "1";
  }

  function rozjedKresbu(el, doba) {
    var cary = $$("[data-delka]", el);
    var soucet = Number(el.dataset.delka) || 1;
    var ubehlo = 0;
    cary.forEach(function (c) {
      var delka = parseFloat(c.style.getPropertyValue("--delka")) || 1;
      var podil = delka / soucet;
      c.style.setProperty("--doba", Math.max(140, Math.round(doba * podil)) + "ms");
      c.style.setProperty("--pauza", Math.round(doba * (ubehlo / soucet)) + "ms");
      ubehlo += delka;
    });
    $$("[data-vypln]", el).forEach(function (v) {
      v.style.setProperty("--pauza", Math.round(doba * 0.75) + "ms");
    });
    el.classList.add("kresli");
  }

  /* ------------------------------------------------------------ hrot tužky */
  var hrot = null;
  var hrotDo = 0;

  function ukazHrot(span) {
    if (!hrot || !span) return;
    var r = span.getBoundingClientRect();
    if (!r.width && !r.height) return;
    hrot.style.transform = "translate3d(" + Math.round(r.right) + "px," + Math.round(r.bottom) + "px,0) rotate(-14deg)";
    hrot.classList.add("vidno");
    hrotDo = performance.now() + 420;
  }

  function schovejHrotKdyzDopsano() {
    if (hrot && hrotDo && performance.now() > hrotDo) {
      hrot.classList.remove("vidno");
      hrotDo = 0;
    }
  }

  /* --------------------------------------------------- bloky a jejich plán */
  var poradi = 0;

  function bloky(sekce) {
    return $$(".pise, .kresba", sekce).map(function (el) {
      if (!el.id) el.id = "blok-" + ++poradi;
      var typ = "odstavec";
      if (el.classList.contains("kresba")) typ = "kresba";
      else if (el.classList.contains("poznamka")) typ = "poznamka";
      else if (/^H[1-6]$/.test(el.tagName)) typ = "nadpis";

      var polozka = { id: el.id, typ: typ };
      if (typ === "kresba") {
        pripravKresbu(el);
        polozka.trvani = Math.min(2400, Math.max(650, Number(el.dataset.delka) * 1.1));
      } else {
        rozdel(el);
        el.classList.add("ceka");
        polozka.text = el.textContent;
      }
      return polozka;
    });
  }

  function dopisBlok(el) {
    if (!el) return;
    if (el.classList.contains("kresba")) { el.classList.remove("ceka"); el.classList.add("hotovo"); return; }
    $$(".s", el).forEach(function (s) { s.classList.add("napsano"); });
    el.classList.add("dopsano");
  }

  function pisBlok(el, podil) {
    if (!el) return null;
    if (el.classList.contains("kresba")) return null;
    var spany = el.__spany || (el.__spany = $$(".s", el));
    var kolik = Math.min(spany.length, Math.ceil(podil * spany.length));
    for (var i = 0; i < spany.length; i++) {
      if (i < kolik) spany[i].classList.add("napsano");
    }
    return kolik > 0 ? spany[kolik - 1] : null;
  }

  /* ----------------------------------------------------------- psaní sekcí */
  var sekce = [];
  var bezici = [];

  function zaloz(el) {
    if (!el.id) el.id = "sekce-" + ++poradi;
    var zaznam = { el: el, polozky: null, plan: null, start: 0, hotovo: false };
    sekce.push(zaznam);
    return zaznam;
  }

  function spust(zaznam) {
    if (zaznam.plan || zaznam.hotovo) return;
    zaznam.polozky = bloky(zaznam.el);
    if (!zaznam.polozky.length) { zaznam.hotovo = true; return; }
    zaznam.plan = L.pisar.zrychli(L.pisar.plan(zaznam.polozky), RYCHLOST);
    zaznam.start = performance.now();
    zaznam.konec = L.pisar.celkem(zaznam.plan);
    zaznam.kresleno = {};
    bezici.push(zaznam);
  }

  function dopis(zaznam) {
    if (zaznam.hotovo) return;
    (zaznam.polozky || bloky(zaznam.el)).forEach(function (p) {
      var el = document.getElementById(p.id);
      if (p.typ === "kresba" && el) { el.classList.remove("ceka"); }
      dopisBlok(el);
    });
    zaznam.hotovo = true;
    zaznam.plan = null;
    bezici = bezici.filter(function (z) { return z !== zaznam; });
  }

  function krok(cas) {
    for (var i = bezici.length - 1; i >= 0; i--) {
      var z = bezici[i];
      var stav = L.pisar.stav(z.plan, cas - z.start);
      stav.hotove.forEach(function (id) {
        var el = document.getElementById(id);
        if (el && !el.dataset.hotovo) {
          if (el.classList.contains("kresba") && !z.kresleno[id]) { z.kresleno[id] = 1; rozjedKresbu(el, 300); }
          dopisBlok(el);
          el.dataset.hotovo = "1";
        }
      });
      var posledni = null;
      stav.probihajici.forEach(function (p) {
        var el = document.getElementById(p.id);
        if (!el) return;
        if (el.classList.contains("kresba")) {
          if (!z.kresleno[p.id]) {
            z.kresleno[p.id] = 1;
            var polozka = z.plan.filter(function (x) { return x.id === p.id; })[0];
            rozjedKresbu(el, polozka ? polozka.trvani : 900);
          }
          return;
        }
        var span = pisBlok(el, p.podil);
        if (span && !el.classList.contains("poznamka")) posledni = span;
      });
      if (posledni) ukazHrot(posledni);
      if (cas - z.start >= z.konec) {
        z.hotovo = true;
        bezici.splice(i, 1);
      }
    }
  }

  /* -------------------------------------------------- co je zrovna ve výřezu */
  function ramec() {
    return { vrchol: window.scrollY, vyska: window.innerHeight };
  }

  function miry() {
    return sekce.map(function (z) {
      var r = z.el.getBoundingClientRect();
      return { id: z.el.id, vrchol: r.top + window.scrollY, vyska: r.height };
    });
  }

  function podleId(id) {
    for (var i = 0; i < sekce.length; i++) if (sekce[i].el.id === id) return sekce[i];
    return null;
  }

  var pravitko = null;
  var pravitkoCislo = null;
  var navigace = null;

  function obnov(cas) {
    var r = ramec();
    var m = miry();
    var hotove = sekce.filter(function (z) { return z.plan || z.hotovo; }).map(function (z) { return z.el.id; });

    L.odkryti.dopsat(m, r, hotove).forEach(function (id) { dopis(podleId(id)); });
    L.odkryti.kSpusteni(m, r, hotove, 0.18).forEach(function (id) { spust(podleId(id)); });

    var postup = L.odkryti.postup(r, document.documentElement.scrollHeight);
    if (pravitko) {
      pravitko.style.setProperty("--postup", postup);
      pravitko.classList.toggle("vidno", r.vrchol > 140);
      if (pravitkoCislo) pravitkoCislo.textContent = Math.round(postup * 100) + " %";
    }
    if (navigace) navigace.classList.toggle("vidno", r.vrchol > 220);

    krok(cas);
    schovejHrotKdyzDopsano();
  }

  function rozjed() {
    var tik = function (cas) {
      obnov(cas);
      requestAnimationFrame(tik);
    };
    requestAnimationFrame(tik);
  }

  /* ------------------------------------------------ přeskočení na požádání */
  function dopisVse() {
    sekce.forEach(function (z) {
      if (!z.hotovo) {
        var r = z.el.getBoundingClientRect();
        if (r.top < window.innerHeight + 200) dopis(z);
      }
    });
  }

  /* ------------------------------------------------------------ filtr prací */
  function filtrPraci() {
    var mrizka = $("[data-prace]");
    if (!mrizka || !L.prace) return;
    var karty = $$("[data-typ]", mrizka);
    $$(".filtr").forEach(function (tlacitko) {
      tlacitko.addEventListener("click", function () {
        var typ = tlacitko.dataset.filtr;
        $$(".filtr").forEach(function (t) { t.setAttribute("aria-pressed", String(t === tlacitko)); });
        karty.forEach(function (karta) {
          var vidno = typ === "vse" || karta.dataset.typ === typ;
          karta.hidden = !vidno;
        });
      });
    });
  }

  /* --------------- načítání: kruh se nakreslí a odletí na své místo ------ */
  function nacitani() {
    var vrstva = $(".nacitani");
    if (!vrstva) return;
    var hotovo = function () {
      vrstva.classList.add("pryc");
      setTimeout(function () { vrstva.remove(); }, 800);
    };
    if (!psaniZapnuto) { vrstva.remove(); return; }

    var zdroj = $(".nacitani-znacka .znacka");
    var cil = $(".uvod-znacka .znacka");
    if (!zdroj || !cil) { setTimeout(hotovo, 1600); return; }

    setTimeout(function () {
      var a = zdroj.getBoundingClientRect();
      var b = cil.getBoundingClientRect();
      if (!a.width || !b.width) { hotovo(); return; }
      var mer = b.width / a.width;
      var dx = (b.left + b.width / 2) - (a.left + a.width / 2);
      var dy = (b.top + b.height / 2) - (a.top + a.height / 2);
      vrstva.classList.add("odlet");
      zdroj.style.transition = "transform 1s cubic-bezier(0.6, 0, 0.2, 1)";
      zdroj.style.transform = "translate(" + Math.round(dx) + "px," + Math.round(dy) +
                              "px) scale(" + mer.toFixed(3) + ")";
      setTimeout(hotovo, 620);
    }, 1750);
  }

  /* ------------------------------- exponát: okolí ztmavne, kresba zůstane */
  function exponaty() {
    // Skici na listu projektu mají `data-klid` — tam se nezvýrazňuje.
    var kusy = $$(".exponat:not([data-klid])");
    if (!kusy.length) return;
    var zhasnuto = null;

    /* Exponát sedí uvnitř vrstvy listu, která má vlastní pořadí vykreslování.
       Kdyby se nezvedla i ona, leželo by setmění přes samotnou kresbu. */
    function obalVListu(el) {
      var uzel = el;
      while (uzel && uzel.parentElement && !uzel.parentElement.classList.contains("list")) {
        uzel = uzel.parentElement;
      }
      return uzel && uzel.parentElement ? uzel : null;
    }

    /* Kolik zvětšit: tak, aby kresba vyplnila rozumný kus okna — malé skici
       se zvětší víc, velké skoro vůbec. Pak se dorovná, aby zůstala v okně. */
    function nastavZvetseni(el) {
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var k = Math.min(window.innerWidth * 0.52 / r.width,
                       window.innerHeight * 0.74 / r.height);
      k = Math.max(1.02, Math.min(k, 3.2));
      var sirka = r.width * k, vyska = r.height * k;
      var stredX = r.left + r.width / 2, stredY = r.top + r.height / 2;
      var okraj = 24, dx = 0, dy = 0;
      if (stredX - sirka / 2 < okraj) dx = okraj - (stredX - sirka / 2);
      if (stredX + sirka / 2 > window.innerWidth - okraj) dx = (window.innerWidth - okraj) - (stredX + sirka / 2);
      if (stredY - vyska / 2 < okraj) dy = okraj - (stredY - vyska / 2);
      if (stredY + vyska / 2 > window.innerHeight - okraj) dy = (window.innerHeight - okraj) - (stredY + vyska / 2);
      el.style.setProperty("--zvetseni", k.toFixed(3));
      el.style.setProperty("--posunX", Math.round(dx) + "px");
      el.style.setProperty("--posunY", Math.round(dy) + "px");
    }

    kusy.forEach(function (el) {
      var obal = obalVListu(el);
      var rozsvit = function () {
        nastavZvetseni(el);
        clearTimeout(zhasnuto);
        document.body.classList.add("exponat-aktivni");
        if (obal) obal.classList.add("nad-setmenim");
      };
      var zhasni = function () {
        clearTimeout(zhasnuto);
        zhasnuto = setTimeout(function () {
          document.body.classList.remove("exponat-aktivni");
          if (obal) obal.classList.remove("nad-setmenim");
        }, 90);
      };
      el.addEventListener("mouseenter", rozsvit);
      el.addEventListener("mouseleave", zhasni);
      el.addEventListener("focusin", rozsvit);
      el.addEventListener("focusout", zhasni);
    });
  }

  /* ----------------------------------------------- fotky: skica → fotografie */
  function vyvolavani() {
    var karty = $$(".prace-karta");
    if (!karty.length) return;
    if (!("IntersectionObserver" in window)) {
      karty.forEach(function (k) { k.classList.add("vyvolano"); });
      return;
    }
    var io = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        if (!z.isIntersecting) return;
        var karta = z.target;
        setTimeout(function () { karta.classList.add("vyvolano"); }, tlumene ? 0 : 420);
        io.unobserve(karta);
      });
    }, { rootMargin: "-12% 0px -12% 0px" });
    karty.forEach(function (k) { io.observe(k); });
  }

  /* ------------------------------------------------------------- formulář */
  function formular() {
    var form = $("#poptavka");
    if (!form || !L.validace) return;

    var souboryPole = $("#prilohy", form);
    var vybrane = [];

    if (souboryPole) {
      souboryPole.addEventListener("change", function () {
        vybrane = Array.prototype.map.call(souboryPole.files, function (f) {
          return { nazev: f.name, velikost: f.size };
        });
        var vypis = $("#prilohy-vypis");
        if (vypis) {
          vypis.textContent = vybrane.length
            ? vybrane.map(function (f) { return f.nazev; }).join(", ")
            : "";
        }
      });
    }

    form.addEventListener("submit", function (udalost) {
      udalost.preventDefault();
      var data = {
        jmeno: (form.jmeno || {}).value || "",
        email: (form.email || {}).value || "",
        telefon: (form.telefon || {}).value || "",
        zprava: (form.zprava || {}).value || "",
        souhlas: !!(form.souhlas && form.souhlas.checked),
        soubory: vybrane
      };
      var vysledek = L.validace.zkontroluj(data);
      $$(".pole", form).forEach(function (pole) {
        var jmeno = pole.dataset.pole;
        var zprava = vysledek.chyby[jmeno];
        pole.classList.toggle("chyba", !!zprava);
        var misto = $(".pole-chyba", pole);
        if (misto) misto.textContent = zprava || "";
      });
      if (!vysledek.platny) {
        var prvni = $(".pole.chyba input, .pole.chyba textarea", form);
        if (prvni) prvni.focus();
        return;
      }
      /* Na ostrém webu se poptávka opravdu odešle; teprve podle odpovědi
         serveru se poděkuje. Na náhledu `action` není a jede se demem. */
      var akce = form.getAttribute("action");
      if (akce) {
        odesliNaServer(form, akce, data);
        return;
      }

      var hotovo = $("#poptavka-hotovo");
      form.hidden = true;
      if (hotovo) {
        hotovo.hidden = false;
        rozdel(hotovo);
        hotovo.classList.add("pise");
        $$(".s", hotovo).forEach(function (s, i) {
          setTimeout(function () { s.classList.add("napsano"); }, i * 42);
        });
      }
      try {
        var ulozene = JSON.parse(localStorage.getItem("idej-poptavky") || "[]");
        ulozene.unshift({
          jmeno: data.jmeno, email: data.email, telefon: data.telefon,
          zprava: data.zprava, kdy: new Date().toISOString()
        });
        localStorage.setItem("idej-poptavky", JSON.stringify(ulozene.slice(0, 50)));
      } catch (e) { /* ukázka bez úložiště */ }
    });
  }

  /* ------------------------------------------- obrázky nahrané administrací */
  /* Nahrané soubory bydlí v IndexedDB (do localStorage by se nevešly).
     Web o nich ví jen tolik, že má id — obrázek si k němu došahá sám. */
  function nahranyObrazek(id) {
    return new Promise(function (hotovo) {
      var zadost = indexedDB.open("idej-obrazky", 1);
      zadost.onupgradeneeded = function () {
        if (!zadost.result.objectStoreNames.contains("soubory")) {
          zadost.result.createObjectStore("soubory", { keyPath: "id" });
        }
      };
      zadost.onerror = function () { hotovo(null); };
      zadost.onsuccess = function () {
        var db = zadost.result;
        if (!db.objectStoreNames.contains("soubory")) return hotovo(null);
        var r = db.transaction("soubory").objectStore("soubory").get(id);
        r.onsuccess = function () { hotovo(r.result || null); };
        r.onerror = function () { hotovo(null); };
      };
    });
  }

  function nastavObrazek(obraz, id, koren) {
    // Obrázek doplněný skriptem nesmí zůstat `lazy`: prohlížeč u něj už
    // jednou rozhodl, že se načítat nebude, a nová adresa ho neprobudí.
    obraz.removeAttribute("loading");
    if (String(id).indexOf("nahrane-") !== 0) {
      obraz.removeAttribute("srcset");
      obraz.src = koren + "obrazky/" + id + "-1040.jpg";
      return;
    }
    obraz.removeAttribute("srcset");
    nahranyObrazek(id).then(function (zaznam) {
      if (!zaznam) return;
      obraz.src = URL.createObjectURL(zaznam.blob);
      obraz.width = zaznam.sirka;
      obraz.height = zaznam.vyska;
    });
  }

  /* ---------------------------------- co se změnilo na projektech a skicách */
  function prepisProjekty(stav) {
    if (!Array.isArray(stav.projekty)) return;
    var koren = location.pathname.indexOf("/prace/") >= 0 ? "../" : "";
    var podle = {};
    stav.projekty.forEach(function (p) { if (p && p.slug) podle[p.slug] = p; });

    $$("[data-projekt]").forEach(function (uzel) {
      var p = podle[uzel.dataset.projekt];
      if (!p) return;

      var pole = uzel.hasAttribute("data-pole") ? [uzel] : $$("[data-pole]", uzel);
      pole.forEach(function (el) {
        var klic = el.dataset.pole;
        if (klic === "text") {
          if (!Array.isArray(p.text)) return;
          el.innerHTML = "";
          p.text.forEach(function (odstavec) {
            var o = document.createElement("p");
            o.textContent = odstavec;
            el.appendChild(o);
          });
        } else if (typeof p[klic] === "string" || typeof p[klic] === "number") {
          el.textContent = p[klic];
        }
      });

      var rada = $("[data-fotky]", uzel);
      if (rada && Array.isArray(p.fotky)) {
        var vzor = $("figure", rada);
        rada.innerHTML = "";
        p.fotky.forEach(function (id) {
          var box = vzor ? vzor.cloneNode(true) : document.createElement("figure");
          if (!vzor) box.className = "fotka";
          var obraz = $("img", box) || box.appendChild(document.createElement("img"));
          obraz.removeAttribute("data-lightbox");
          nastavObrazek(obraz, id, koren);
          rada.appendChild(box);
        });
        rada.parentElement.hidden = p.fotky.length === 0;
      }
    });
  }

  /** Čísla u filtrů se počítají při sestavení. Když administrace skicu přidá
      nebo skryje, musí se přepočítat, jinak filtr tvrdí něco jiného, než je vidět. */
  function prepocitejFiltry(mrizka) {
    var karty = $$(".skica-list", mrizka).filter(function (k) { return !k.hidden; });
    $$(".filtr").forEach(function (tlacitko) {
      var typ = tlacitko.dataset.filtr;
      var pocet = typ === "vse" ? karty.length
        : karty.filter(function (k) { return k.dataset.typ === typ; }).length;
      var cislo = $(".filtr-pocet", tlacitko);
      if (cislo) cislo.textContent = String(pocet);
      tlacitko.hidden = typ !== "vse" && pocet === 0;
    });
  }

  /** Skica nahraná administrací — do mřížky se doplní jako nová dlaždice. */
  function doplnNahraneSkici(stav) {
    var mrizka = $("[data-prace]");
    if (!mrizka || !Array.isArray(stav.prace)) return;
    var vzor = $(".skica-list", mrizka);
    if (!vzor) return;

    stav.prace.forEach(function (p) {
      if (!p || !p.obrazek || $('[data-slug="' + p.slug + '"]', mrizka)) return;
      var karta = vzor.cloneNode(true);
      karta.dataset.slug = p.slug;
      karta.dataset.typ = p.typ || "";
      karta.hidden = !!p.skryta;
      var odkaz = $("a.skica-odkaz", karta);
      if (odkaz) odkaz.replaceWith.apply(odkaz, odkaz.childNodes.length ? [].slice.call(odkaz.childNodes) : []);
      var obraz = $("img", karta);
      if (obraz) {
        obraz.removeAttribute("data-lightbox");
        nastavObrazek(obraz, p.obrazek, "");
        obraz.alt = "Skica — " + (p.nazev || "");
      }
      var popis = $(".skica-popis", karta);
      if (popis) popis.textContent = p.nazev || "";
      mrizka.appendChild(karta);
    });
  }

  /* ------------------------------------------------------------- baterie */
  /* Značka se otáčí pořád dokola. Mimo obrazovku je to jen práce pro grafiku
     a na telefonu ubraná baterie — rotace se zastaví, jakmile kruh zmizí
     z dohledu. Sleduje se obal, ne <g>: vnitřek SVG nemá vlastní rozměr. */
  function setriBaterii() {
    var kruhy = $$(".znacka-kruh");
    if (!kruhy.length || !("IntersectionObserver" in window)) return;
    var hlidac = new IntersectionObserver(function (zaznamy) {
      zaznamy.forEach(function (z) {
        (z.target.__kruhy || []).forEach(function (k) {
          k.style.animationPlayState = z.isIntersecting ? "" : "paused";
        });
      });
    }, { rootMargin: "120px" });

    kruhy.forEach(function (k) {
      var svg = k.closest("svg");
      var cil = (svg && svg.parentElement) || svg || k;
      if (!cil.__kruhy) { cil.__kruhy = []; hlidac.observe(cil); }
      cil.__kruhy.push(k);
    });
  }

  /* ------------------------------------------------- obsah bloku (telefon) */
  /* Na telefonu nahrazuje lištu: dvojtlačítko u palce a obsah přes celou
     obrazovku. Otevřený obsah zamkne rolování pod sebou, jinak se při
     zavření vrátíte někam úplně jinam. */
  function obsahBloku() {
    var tlacitko = $(".palec-obsah");
    var list = $(".obsah-list");
    if (!tlacitko || !list) return;
    var odkazy = $$("a[data-kotva]", list);
    var vracenaY = 0;

    function otevri() {
      vracenaY = window.scrollY;
      oznacAktivni();
      list.hidden = false;
      // dvě snímky, aby přechod z @starting-style opravdu naběhl
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { list.classList.add("vidno"); });
      });
      tlacitko.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      var prvni = odkazy[0];
      if (prvni) prvni.focus({ preventScroll: true });
    }

    function zavri(vratFokus) {
      list.classList.remove("vidno");
      tlacitko.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      window.setTimeout(function () { list.hidden = true; }, 260);
      if (vratFokus) tlacitko.focus({ preventScroll: true });
    }

    /* Která sekce je zrovna na obrazovce — ať je v obsahu vidět, kde člověk je. */
    function oznacAktivni() {
      var nejlepsi = null, nejmensi = Infinity;
      odkazy.forEach(function (a) {
        var cil = document.getElementById(a.dataset.kotva);
        if (!cil) return;
        var odstup = Math.abs(cil.getBoundingClientRect().top - innerHeight * 0.3);
        if (odstup < nejmensi) { nejmensi = odstup; nejlepsi = a; }
      });
      odkazy.forEach(function (a) {
        if (a === nejlepsi) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    tlacitko.addEventListener("click", function () {
      if (list.hidden) otevri(); else zavri(true);
    });
    $(".obsah-zavrit", list).addEventListener("click", function () { zavri(true); });
    list.addEventListener("click", function (e) {
      if (e.target.closest("a")) zavri(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !list.hidden) zavri(true);
    });
    void vracenaY;
  }

  /* Na telefonu by plovoucí lišta seděla na klávesnici. */
  function uhniKlavesnici() {
    $$("input, textarea, select").forEach(function (pole) {
      pole.addEventListener("focus", function () { document.body.classList.add("pise-se"); });
      pole.addEventListener("blur", function () { document.body.classList.remove("pise-se"); });
    });
  }

  /** Odeslání poptávky na server. Chyby z PHP se ukážou u polí stejně
      jako ty z prohlížeče, ať je to pro člověka jedna věc. */
  function odesliNaServer(form, akce, data) {
    var tlacitko = $("button[type=submit]", form);
    if (tlacitko) { tlacitko.disabled = true; tlacitko.dataset.puvodni = tlacitko.textContent; tlacitko.textContent = "Odesílám…"; }

    fetch(akce, { method: "POST", body: new FormData(form) })
      .then(function (odpoved) {
        return odpoved.json().catch(function () { return { ok: odpoved.ok }; });
      })
      .then(function (v) {
        if (!v || !v.ok) {
          ukazChyby(form, (v && v.chyby) || {});
          if (!v || !v.chyby) ukazSelhani(form);
          return;
        }
        podekuj(form);
        ulozDoPrehledu(data);
      })
      .catch(function () { ukazSelhani(form); })
      .then(function () {
        if (tlacitko) { tlacitko.disabled = false; tlacitko.textContent = tlacitko.dataset.puvodni || "Odeslat poptávku"; }
      });
  }

  function ukazChyby(form, chyby) {
    $$(".pole", form).forEach(function (pole) {
      var zprava = chyby[pole.dataset.pole];
      pole.classList.toggle("chyba", !!zprava);
      var misto = $(".pole-chyba", pole);
      if (misto) misto.textContent = zprava || "";
    });
    var prvni = $(".pole.chyba input, .pole.chyba textarea", form);
    if (prvni) prvni.focus();
  }

  function ukazSelhani(form) {
    var misto = $(".pole[data-pole=souhlas] .pole-chyba", form) || $(".pole-chyba", form);
    if (misto) {
      misto.textContent = "Odeslání se nepovedlo. Napište prosím rovnou na info@atelieridej.cz.";
      misto.closest(".pole").classList.add("chyba");
    }
  }

  function podekuj(form) {
    var hotovo = $("#poptavka-hotovo");
    form.hidden = true;
    if (!hotovo) return;
    hotovo.hidden = false;
    rozdel(hotovo);
    hotovo.classList.add("pise");
    $$(".s", hotovo).forEach(function (s, i) {
      setTimeout(function () { s.classList.add("napsano"); }, i * 42);
    });
  }

  function ulozDoPrehledu(data) {
    try {
      var ulozene = JSON.parse(localStorage.getItem("idej-poptavky") || "[]");
      ulozene.unshift({
        jmeno: data.jmeno, email: data.email, telefon: data.telefon,
        zprava: data.zprava, kdy: new Date().toISOString()
      });
      localStorage.setItem("idej-poptavky", JSON.stringify(ulozene.slice(0, 50)));
    } catch (e) { /* soukromé okno */ }
  }

  /* ------------------------------------------------------------- lightbox */
  function svetelnyStul() {
    var fotky = $$("[data-lightbox]");
    if (!fotky.length) return;
    var vrstva = document.createElement("div");
    vrstva.className = "svetelny-stul";
    vrstva.hidden = true;
    vrstva.innerHTML = '<button class="svetelny-zavrit" aria-label="Zavřít">×</button><img alt="">';
    document.body.appendChild(vrstva);
    var obraz = $("img", vrstva);

    function otevri(src, popis, uhel) {
      obraz.src = src;
      obraz.alt = popis || "";
      obraz.style.transform = uhel ? "rotate(" + uhel + "deg)" : "";
      vrstva.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function zavri() {
      vrstva.hidden = true;
      document.body.style.overflow = "";
    }
    fotky.forEach(function (f) {
      f.addEventListener("click", function () {
        var karta = f.closest ? f.closest("[data-otoceni]") : null;
        otevri(f.dataset.lightbox, f.getAttribute("alt"),
               karta ? Number(karta.dataset.otoceni) || 0 : 0);
      });
    });
    vrstva.addEventListener("click", zavri);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") zavri(); });
  }

  /* ------------------------------------- co se změnilo v demo administraci */
  function prepisy() {
    var stav = null;
    try { stav = JSON.parse(localStorage.getItem("idej-admin") || "null"); } catch (e) { stav = null; }
    if (!stav) return;

    if (stav.texty) {
      Object.keys(stav.texty).forEach(function (klic) {
        var zapis = stav.texty[klic];
        if (!zapis || typeof zapis.hodnota !== "string") return;
        if (klic === "web.titulek") document.title = zapis.hodnota;
        $$('[data-text="' + klic + '"]').forEach(function (el) { el.textContent = zapis.hodnota; });
      });
    }

    if (stav.kontakt) {
      Object.keys(stav.kontakt).forEach(function (klic) {
        $$('[data-udaj="' + klic + '"]').forEach(function (el) {
          el.textContent = stav.kontakt[klic];
          if (klic === "telefon" && el.tagName === "A") el.href = "tel:" + (stav.kontakt.telefonHref || stav.kontakt.telefon);
          if (klic === "email" && el.tagName === "A") el.href = "mailto:" + stav.kontakt.email;
        });
      });
    }

    prepisProjekty(stav);
    doplnNahraneSkici(stav);

    var mrizka = $("[data-prace]");
    if (mrizka && Array.isArray(stav.prace)) {
      var zive = {};
      stav.prace.forEach(function (p) { if (p && p.slug) zive[p.slug] = p; });

      // Uložený stav může být starší než web. Pak o některých položkách neví —
      // a to NESMÍ znamenat, že zmizí; smí se jen přejmenovat, přeřadit a skrýt.
      var znamych = 0;
      $$("[data-slug]", mrizka).forEach(function (karta) {
        var p = zive[karta.dataset.slug];
        if (!p) return;
        znamych += 1;
        karta.hidden = !!p.skryta;
        if (p.typ) karta.dataset.typ = p.typ;
        var uhel = ((Number(p.otoceni) || 0) % 360 + 360) % 360;
        karta.dataset.otoceni = String(uhel);
        karta.style.setProperty("--uhel", uhel + "deg");
        var nazev = $('[data-pole="nazev"]:not([data-projekt])', karta);
        if (nazev && p.nazev) nazev.textContent = p.nazev;
        var anotace = $('[data-pole="anotace"]', karta);
        if (anotace && typeof p.anotace === "string") anotace.textContent = p.anotace;
        var meta = $('[data-pole="meta"]', karta);
        if (meta && (p.misto || p.rok)) {
          meta.textContent = [p.misto, p.rok, p.stav].filter(Boolean).join(" \u00b7 ");
        }
      });

      if (znamych) {
        stav.prace.forEach(function (p) {
          var karta = $('[data-slug="' + p.slug + '"]', mrizka);
          if (karta) mrizka.appendChild(karta);
        });
      }
      prepocitejFiltry(mrizka);
    }
  }

  /* ------------------------------------------------------------------ start */
  function start() {
    hrot = $(".hrot");
    pravitko = $(".pravitko");
    pravitkoCislo = $(".pravitko-cislo");
    navigace = $(".navigace");

    prepisy();

    filtrPraci();
    exponaty();
    vyvolavani();
    formular();
    svetelnyStul();
    obsahBloku();
    uhniKlavesnici();
    setriBaterii();

    var cele = $$("[data-psat]");
    cele.forEach(zaloz);

    if (!psaniZapnuto) {
      sekce.forEach(function (z) { z.polozky = bloky(z.el); dopis(z); });
      if (pravitko) pravitko.classList.add("vidno");
      if (navigace) navigace.classList.add("vidno");
      $$(".kresba").forEach(function (k) { k.classList.remove("ceka"); });
      return;
    }

    $$(".pise").forEach(function (el) { rozdel(el); el.classList.add("ceka"); });
    $$(".kresba").forEach(pripravKresbu);

    ["click", "keydown"].forEach(function (jmeno) {
      document.addEventListener(jmeno, function (e) {
        if (jmeno === "keydown" && ["Tab", "Shift", "Meta", "Control", "Alt"].indexOf(e.key) >= 0) return;
        dopisVse();
      }, { passive: true });
    });
    var posledniY = window.scrollY;
    var rychlost = 0;
    window.addEventListener("scroll", function () {
      rychlost = Math.abs(window.scrollY - posledniY);
      posledniY = window.scrollY;
      if (rychlost > 90) dopisVse();
    }, { passive: true });

    nacitani();

    rozjed();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
