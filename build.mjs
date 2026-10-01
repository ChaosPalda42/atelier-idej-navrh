/* Sestavení webu: data + šablony -> out/.
   Spouští se `node build.mjs`. Žádné závislosti, jen Node. */
import { readFile, writeFile, readdir, mkdir, rm, copyFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { index, detail } from "./src/templates/stranky.mjs";
import { administrace } from "./src/templates/administrace.mjs";
import { znacka } from "./src/templates/znacka.mjs";

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

  await rm(VEN, { recursive: true, force: true });
  await mkdir(path.join(VEN, "assets"), { recursive: true });
  await mkdir(path.join(VEN, "prace"), { recursive: true });

  // statika
  await zkopirujStrom(path.join(KOREN, "src/assets/fonts"), path.join(VEN, "assets/fonts"));
  await copyFile(path.join(KOREN, "src/assets/style.css"), path.join(VEN, "assets/style.css"));
  await copyFile(path.join(KOREN, "src/ui/web.js"), path.join(VEN, "assets/web.js"));
  await copyFile(path.join(KOREN, "src/ui/admin.js"), path.join(VEN, "assets/admin.js"));
  await writeFile(path.join(VEN, "assets/lib.js"), await svazekKnihoven());
  await writeFile(path.join(VEN, "assets/favicon.svg"),
    znacka({ varianta: "samotna" }).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
      .replace(/var\(--oranz, (#\w+)\)/g, "$1"));

  // fotky a skici, pokud už dorazily podklady
  for (const slozka of ["fotky", "skici"]) {
    const zdroj = path.join(KOREN, "data", slozka);
    if (await existuje(zdroj)) await zkopirujStrom(zdroj, path.join(VEN, slozka));
  }

  // stránky
  await writeFile(path.join(VEN, "index.html"), index(site, t));
  for (const prace of site.prace) {
    await writeFile(path.join(VEN, "prace", `${prace.slug}.html`), detail(site, t, prace.slug));
  }
  await writeFile(path.join(VEN, "administrace.html"), administrace(site, t));

  const otisk = createHash("sha1").update(await readFile(path.join(VEN, "index.html"))).digest("hex").slice(0, 8);
  console.log(`hotovo: ${site.prace.length + 2} stránek, otisk ${otisk}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
