/* Správa webu přes git: nastavení pro Decap/Sveltia CMS.

   Proč generovat, a ne napsat ručně: CMS chce vyjmenovat každé pole, které
   smí editovat. Texty webu jich mají přes devadesát a `site.json` k tomu
   služby, postup, skupiny a projekty. Ručně psaný config.yml by se rozešel
   s daty při první změně — takhle se schéma skládá ze stejných dat, ze
   kterých se skládá web i demo administrace. */

const POPISKY = {
  web: "Hlava stránky", uvod: "Úvod", sluzby: "Co děláme", prace: "Vybrané práce",
  postup: "Jak to probíhá", oMne: "O nás", kontakt: "Kontakt", paticka: "Patička",
  navigace: "Navigace", detail: "Listy sbírek", chyba: "Stránka nenalezena",
  vystavka: "Skicák", projekt: "Listy projektů",
  nazev: "Název", popis: "Popis", nadpis: "Nadpis", perex: "Úvodní odstavec",
  poznamka: "Poznámka na okraji", cislo: "Číslo sekce", claim: "Hlavní věta",
  text: "Text", anotace: "Úvodní věta", misto: "Místo", rok: "Rok", stav: "Stav",
  slug: "Adresa", skici: "Skici", fotky: "Fotografie", typ: "Skupina",
  trvani: "Trvání", zaver: "Závěr", bloky: "Bloky", odkazy: "Odkazy",
};

const odsad = (n) => "  ".repeat(n);
const uvozovky = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const popisek = (klic) => POPISKY[klic] || klic.charAt(0).toUpperCase() + klic.slice(1);

/** Z hodnoty v datech udělá pole pro CMS. Tvar dat je zdroj pravdy. */
function pole(klic, hodnota, uroven) {
  const o = odsad(uroven);
  const hlava = `${o}- name: ${uvozovky(klic)}\n${o}  label: ${uvozovky(popisek(klic))}`;

  if (typeof hodnota === "string") {
    const dlouhy = hodnota.length > 90;
    return `${hlava}\n${o}  widget: ${dlouhy ? '"text"' : '"string"'}\n${o}  required: false`;
  }
  if (typeof hodnota === "number") {
    return `${hlava}\n${o}  widget: "number"\n${o}  value_type: "int"\n${o}  required: false`;
  }
  if (Array.isArray(hodnota)) {
    if (!hodnota.length || typeof hodnota[0] === "string") {
      return `${hlava}\n${o}  widget: "list"\n${o}  required: false`;
    }
    const vzor = hodnota[0];
    return `${hlava}\n${o}  widget: "list"\n${o}  required: false\n${o}  fields:\n`
      + Object.entries(vzor).map(([k, v]) => pole(k, v, uroven + 2)).join("\n");
  }
  if (hodnota && typeof hodnota === "object") {
    return `${hlava}\n${o}  widget: "object"\n${o}  collapsed: true\n${o}  fields:\n`
      + Object.entries(hodnota).map(([k, v]) => pole(k, v, uroven + 2)).join("\n");
  }
  return `${hlava}\n${o}  widget: "string"\n${o}  required: false`;
}

function soubor(jmeno, nazev, cesta, data) {
  return `${odsad(2)}- name: ${uvozovky(jmeno)}
${odsad(2)}  label: ${uvozovky(nazev)}
${odsad(2)}  file: ${uvozovky(cesta)}
${odsad(2)}  fields:
${Object.entries(data).map(([k, v]) => pole(k, v, 4)).join("\n")}`;
}

/**
 * repo  – "uživatel/repozitář" na GitHubu
 * most  – adresa přihlašovacího můstku (OAuth); bez něj se dá CMS používat
 *         jen lokálně přes `npx decap-server`
 */
export function spravaNastaveni(site, t, { repo, vetev = "main", most = "" } = {}) {
  const skupiny = (site.skupiny || []).map((g) => `${odsad(4)}- { label: ${uvozovky(g.nazev)}, value: ${uvozovky(g.id)} }`).join("\n");

  return `# Vygenerováno sestavením (src/templates/sprava.mjs) — needituj ručně.
# Schéma se skládá z dat, takže nová služba, krok nebo projekt se tu objeví sami.
backend:
  name: github
  repo: ${uvozovky(repo)}
  branch: ${uvozovky(vetev)}${most ? `\n  base_url: ${uvozovky(most)}` : ""}
  commit_messages:
    create: "Správa webu: nová {{collection}}"
    update: "Správa webu: úprava {{collection}}"
    delete: "Správa webu: smazáno {{collection}}"
    uploadMedia: "Správa webu: nahráno {{path}}"
    deleteMedia: "Správa webu: smazáno {{path}}"

# Bez tohohle se dá správa zkusit i bez přihlášení: \`npx decap-server\`
local_backend: true

locale: cs
media_folder: "zdroje/skici"
public_folder: "/zdroje/skici"

collections:
  - name: "skici"
    label: "Skici"
    label_singular: "Skica"
    description: "Nová skica se po uložení sama vybílí, zprůhlední a zmenší do tří velikostí."
    folder: "zdroje/skici"
    extension: "json"
    format: "json"
    create: true
    slug: "{{year}}{{month}}{{day}}-{{slug}}"
    summary: "{{fields.popis}}"
    fields:
${odsad(3)}- { name: "popis", label: "Popis", widget: "string", hint: "Co je na skice — píše se pod ni." }
${odsad(3)}- name: "skupina"
${odsad(3)}  label: "Skupina"
${odsad(3)}  widget: "select"
${odsad(3)}  options:
${skupiny}
${odsad(3)}- { name: "soubor", label: "Obrázek skici", widget: "image", media_library: { config: { multiple: false } } }

  - name: "obsah"
    label: "Obsah webu"
    files:
${soubor("texty", "Texty webu", "data/texty.json", t)}
${soubor("site", "Služby, postup, sbírky a projekty", "data/site.json", site)}
`;
}

/** Stránka správy. Samotné CMS se bere z CDN — viz dokumenty/SPRAVA-WEBU.txt. */
export function spravaStranka(verze = "3.8.4") {
  return `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Správa webu — ateliér IDEJ</title>
</head>
<body>
<script src="https://unpkg.com/decap-cms@${verze}/dist/decap-cms.js"></script>
</body>
</html>`;
}
