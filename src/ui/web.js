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
    return $$(".pise, .kresba, .polozit", sekce).map(function (el) {
      if (!el.id) el.id = "blok-" + ++poradi;
      var typ = "odstavec";
      if (el.classList.contains("kresba")) typ = "kresba";
      else if (el.classList.contains("polozit")) typ = "foto";
      else if (el.classList.contains("poznamka")) typ = "poznamka";
      else if (/^H[1-6]$/.test(el.tagName)) typ = "nadpis";

      var polozka = { id: el.id, typ: typ };
      if (typ === "kresba") {
        pripravKresbu(el);
        polozka.trvani = Math.min(2400, Math.max(650, Number(el.dataset.delka) * 1.1));
      } else if (typ === "foto") {
        polozka.trvani = 700;
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
    if (el.classList.contains("polozit")) { el.classList.add("lezi"); return; }
    $$(".s", el).forEach(function (s) { s.classList.add("napsano"); });
    el.classList.add("dopsano");
  }

  function pisBlok(el, podil) {
    if (!el) return null;
    if (el.classList.contains("kresba") || el.classList.contains("polozit")) return null;
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
        if (el.classList.contains("polozit")) { el.classList.add("lezi"); return; }
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

  function smyckа() {}

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

    function otevri(src, popis) {
      obraz.src = src;
      obraz.alt = popis || "";
      vrstva.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function zavri() {
      vrstva.hidden = true;
      document.body.style.overflow = "";
    }
    fotky.forEach(function (f) {
      f.addEventListener("click", function () {
        otevri(f.dataset.lightbox, f.getAttribute("alt"));
      });
    });
    vrstva.addEventListener("click", zavri);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") zavri(); });
  }

  /* ------------------------------------------------------------------ start */
  function start() {
    hrot = $(".hrot");
    pravitko = $(".pravitko");
    pravitkoCislo = $(".pravitko-cislo");
    navigace = $(".navigace");

    filtrPraci();
    vyvolavani();
    formular();
    svetelnyStul();

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

    var zavoj = $(".zavoj");
    if (zavoj) {
      requestAnimationFrame(function () {
        zavoj.classList.add("pryc");
        setTimeout(function () { zavoj.remove(); }, 900);
      });
    }

    rozjed();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
