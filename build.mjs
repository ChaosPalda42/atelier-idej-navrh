/* Sestavení webu: data + šablony -> out/.
   Spouští se `node build.mjs`. Žádné závislosti, jen Node. */
import { readFile, writeFile, readdir, mkdir, rm, copyFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { index, detail, projekt, chyba404, presmerovani } from "./src/templates/stranky.mjs";
import { spravaNastaveni, spravaStranka } from "./src/templates/sprava.mjs";
import { administrace } from "./src/templates/administrace.mjs";
import { znacka } from "./src/templates/znacka.mjs";
import { nastavOtisk } from "./src/templates/layout.mjs";

const KOREN = path.dirname(fileURLToPath(import.meta.url));
const VEN = path.join(KOREN, "out");

/** Moduly z src/lib se sesypou do jednoho klasického skriptu pod globální IDEJ.<modul>. */
function nazvyExportu(zdroj) {
  const jmena = new Set();
  const re = /export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = re.exec(zdroj))) jmena.add(m[1]);
  return [...jmena];
}

async function svazekKnihoven() {
  const dir = path.join(KOREN, "src", "lib");
  const soubory = (await readdir(dir)).filter((f) => f.endsWith(".mjs")).sort();
  const kusy = [];
  for (const soubor of soubory) {
    const zdroj = await readFile(path.join(dir, soubor), "utf8");
    const jmena = nazvyExportu(zdroj);
    const telo = zdroj.replace(/^\s*export\s+(?=(?:async\s+)?(?:function|const|let|var|class)\s)/gm, "");
    kusy.push(`IDEJ.${soubor.replace(/\.mjs$/, "")} = (function () {\n${telo}\nreturn { ${jmena.join(", ")} };\n})();`);
  }
  return `(function (global) {\n"use strict";\nvar IDEJ = global.IDEJ = global.IDEJ || {};\n${kusy.join("\n")}\n})(typeof window !== "undefined" ? window : globalThis);\n`;
}

async function zkopirujStrom(odkud, kam) {
  await mkdir(kam, { recursive: true });
  for (const polozka of await readdir(odkud, { withFileTypes: true })) {
    const z = path.join(odkud, polozka.name);
    const do_ = path.join(kam, polozka.name);
    if (polozka.isDirectory()) await zkopirujStrom(z, do_);
    else await copyFile(z, do_);
  }
}

async function existuje(cesta) {
  try { await stat(cesta); return true; } catch { return false; }
}

async function main() {
  const site = JSON.parse(await readFile(path.join(KOREN, "data/site.json"), "utf8"));
  const t = JSON.parse(await readFile(path.join(KOREN, "data/texty.json"), "utf8"));

  // skici architekta (tools/skici.py)
  const seznamSkic = path.join(KOREN, "data", "obrazky", "seznam.json");
  const skici = (await existuje(seznamSkic)) ? JSON.parse(await readFile(seznamSkic, "utf8")) : [];

  // zástupné fotografie projektů (tools/ukazky.py)
  const seznamUkazek = path.join(KOREN, "data", "obrazky", "ukazky.json");
  const ukazky = (await existuje(seznamUkazek)) ? JSON.parse(await readFile(seznamUkazek, "utf8")) : [];

  // kresby vytažené ze skutečných výkresů (tools/vykres.py)
  const kresby = {};
  const slozkaKreseb = path.join(KOREN, "data", "kresby");
  if (await existuje(slozkaKreseb)) {
    for (const soubor of (await readdir(slozkaKreseb)).filter((f) => f.endsWith(".json"))) {
      kresby[soubor.replace(/\.json$/, "")] = JSON.parse(await readFile(path.join(slozkaKreseb, soubor), "utf8"));
    }
  }

  await rm(VEN, { recursive: true, force: true });
  await mkdir(path.join(VEN, "assets"), { recursive: true });
  await mkdir(path.join(VEN, "prace"), { recursive: true });

  // statika — celá složka assets, ať se nemůže stát, že se na něco zapomene
  await zkopirujStrom(path.join(KOREN, "src/assets"), path.join(VEN, "assets"));
  await copyFile(path.join(KOREN, "src/ui/web.js"), path.join(VEN, "assets/web.js"));
  await copyFile(path.join(KOREN, "src/ui/admin.js"), path.join(VEN, "assets/admin.js"));
  await writeFile(path.join(VEN, "assets/lib.js"), await svazekKnihoven());
  await writeFile(path.join(VEN, "assets/favicon.svg"),
    znacka({ varianta: "samotna" }).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
      .replace(/var\(--oranz, (#\w+)\)/g, "$1"));

  // fotky a skici, pokud už dorazily podklady
  for (const slozka of ["fotky", "skici", "obrazky"]) {
    const zdroj = path.join(KOREN, "data", slozka);
    if (await existuje(zdroj)) await zkopirujStrom(zdroj, path.join(VEN, slozka));
  }

  // otisk statiky -> adresy stylů a skriptů
  const soucet = createHash("sha1");
  for (const soubor of ["assets/style.css", "assets/web.js", "assets/lib.js", "assets/admin.js"]) {
    soucet.update(await readFile(path.join(VEN, soubor)));
  }
  nastavOtisk(soucet.digest("hex").slice(0, 8));

  // stránky
  const razitko = (await existuje(path.join(KOREN, "data", "obrazky", "razitko.png"))) ? "razitko.png" : "";
  await writeFile(path.join(VEN, "index.html"), index(site, t, skici, razitko));
  for (const skupina of site.skupiny) {
    if (!skici.some((s) => s.skupina === skupina.id)) continue;
    await writeFile(path.join(VEN, "prace", `${skupina.id}.html`), detail(site, t, skupina.id, kresby, skici));
  }
  for (const p of site.projekty || []) {
    await writeFile(path.join(VEN, "prace", `${p.slug}.html`), projekt(site, t, p, skici, ukazky));
  }
  await writeFile(path.join(VEN, "404.html"), chyba404(site, t));

  // správa webu přes git (Decap/Sveltia) — schéma se skládá z dat
  await mkdir(path.join(VEN, "sprava"), { recursive: true });
  await writeFile(path.join(VEN, "sprava", "index.html"), spravaStranka());
  await writeFile(path.join(VEN, "sprava", "config.yml"),
    spravaNastaveni(site, t, {
      repo: process.env.SPRAVA_REPO || "ChaosPalda42/atelier-idej-navrh",
      vetev: process.env.SPRAVA_VETEV || "main",
      most: process.env.SPRAVA_MOST || "",
    }));

  // adresy z dřívější verze ukázky (vymyšlené zakázky) — ať nekončí na 404
  const stareAdresy = {
    "dum-nad-sadem": "rodinne-domy",
    "stodola-u-lipy": "rodinne-domy",
    "byt-v-cihlovem-dome": "interiery",
    "pekarna-v-podloubi": "bytove-domy",
    "hala-s-kancelari": "bytove-domy",
    "overovaci-studie-navsi": "rodinne-domy",
  };
  for (const [stara, nova] of Object.entries(stareAdresy)) {
    await writeFile(path.join(VEN, "prace", `${stara}.html`),
      presmerovani(`${nova}.html`, "ukázka teď stojí na skutečných skicích"));
  }

  await mkdir(path.join(VEN, "administrace"), { recursive: true });
  for (const list of administrace(site, t, skici)) {
    await writeFile(path.join(VEN, list.soubor), list.html);
  }

  const otisk = createHash("sha1").update(await readFile(path.join(VEN, "index.html"))).digest("hex").slice(0, 8);
  console.log(`hotovo: ${site.skupiny.length + 2} stránek, ${skici.length} skic, otisk ${otisk}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
