/* Demo administrace — ukazuje, co by šlo spravovat bez programátora.
   Data si drží prohlížeč (localStorage), nic se nikam neodesílá. */
import { stranka } from "./layout.mjs";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ZALOZKY = [
  ["prehled", "Přehled"],
  ["prace", "Práce"],
  ["texty", "Texty"],
  ["poptavky", "Poptávky"],
  ["kontakt", "Kontakt"],
  ["zaloha", "Záloha"],
];

export function administrace(site, t) {
  const telo = `<div class="list">
<header class="admin-hlava">
<div>
<p class="stitek">Demo administrace</p>
<h1>Co si ateliér spravuje sám</h1>
<p class="vedouci">Všechno níž je živé: co tady změníte, to se projeví na webu. Data si drží jen tenhle prohlížeč — ukázka nikam nic neodesílá.</p>
</div>
<a class="tlacitko lehke" href="index.html">Zpátky na web</a>
</header>
<div class="admin-telo">
<nav class="admin-zalozky" role="tablist">
${ZALOZKY.map(([id, popis], i) => `<button class="admin-zalozka" role="tab" data-zalozka="${id}" aria-selected="${i === 0}">${popis}</button>`).join("\n")}
</nav>

<section class="admin-panel" data-panel="prehled">
<div class="admin-dlazdice" id="admin-prehled"></div>
<p class="rukou tuzkou">Čísla v přehledu jsou z ukázkových dat — v ostrém provozu by se brala ze skutečných poptávek a návštěvnosti.</p>
</section>

<section class="admin-panel" data-panel="prace" hidden>
<div class="admin-radek">
<h2>Práce</h2>
<button class="tlacitko" id="admin-pridat">Přidat práci</button>
</div>
<div id="admin-prace" class="admin-seznam"></div>
</section>

<section class="admin-panel" data-panel="texty" hidden>
<h2>Texty na webu</h2>
<p class="vedouci">Přepište, co chcete. Prázdné pole vrátí původní znění.</p>
<div id="admin-texty" class="admin-seznam"></div>
</section>

<section class="admin-panel" data-panel="poptavky" hidden>
<h2>Došlé poptávky</h2>
<p class="vedouci">Sem padá, co lidé pošlou formulářem na webu. Vyzkoušejte si to — poptávka se objeví tady.</p>
<div id="admin-poptavky" class="admin-seznam"></div>
</section>

<section class="admin-panel" data-panel="kontakt" hidden>
<h2>Kontaktní údaje</h2>
<p class="vedouci">Telefon, e-mail a adresa se propíšou do patičky i do kontaktní sekce.</p>
<div id="admin-kontakt" class="admin-seznam"></div>
</section>

<section class="admin-panel" data-panel="zaloha" hidden>
<h2>Záloha a obnovení</h2>
<p class="vedouci">Celý obsah se dá vyvézt do souboru a zase načíst zpátky.</p>
<div class="admin-radek">
<button class="tlacitko lehke" id="admin-export">Vyvézt do souboru</button>
<label class="tlacitko lehke" for="admin-import">Načíst ze souboru</label>
<input id="admin-import" type="file" accept="application/json" hidden>
<button class="tlacitko lehke" id="admin-reset">Vrátit ukázku do výchozího stavu</button>
</div>
<pre id="admin-vypis" class="admin-vypis"></pre>
</section>
</div>
</div>
<script type="application/json" id="admin-vychozi">${JSON.stringify({ firma: site.firma, prace: site.prace, texty: t }).replace(/</g, "\\u003c")}</script>`;

  return stranka({
    titulek: "Demo administrace — ateliér IDEJ",
    popis: "Ukázka, co si ateliér spravuje sám.",
    telo,
    trida: "admin",
    t,
    firma: site.firma,
    aktivni: "",
    skripty: ["admin.js"],
  });
}

export const _esc = esc;
