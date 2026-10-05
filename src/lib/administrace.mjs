// Stav demo administrace — práce, projekty, texty, poptávky.
// Čistý ES modul bez závislostí a bez DOM. Všechny funkce, které mění stav,
// vrací NOVÝ objekt a původní nechávají beze změny.

const CHYBA_IMPORT = "Tohle nevypadá jako záloha administrace.";
const POPTAVKOVE_STAVY = new Set(["nova", "ctena", "vyrizena"]);

// Stejné pravidlo jako v src/lib/prace.mjs: diakritika pryč, znaky mimo
// [a-z0-9] -> pomlčka, pomlčky na krajích oříznout.
function slug(nazev) {
  if (typeof nazev !== "string") return "";
  return (
    nazev
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

function jeObjekt(x) {
  return x !== null && typeof x === "object" && !Array.isArray(x);
}

function kopiePole(pole) {
  return Array.isArray(pole) ? [...pole] : [];
}

function kopieObjektu(obj) {
  return jeObjekt(obj) ? { ...obj } : {};
}

export function vychoziStav(site) {
  const v = jeObjekt(site) ? site : {};
  return {
    prace: kopiePole(v.prace),
    projekty: kopiePole(v.projekty),
    texty: {},
    poptavky: [],
    kontakt: kopieObjektu(v.firma),
  };
}

export function unikatniSlug(seznam, navrh) {
  const sluggy = new Set(
    (Array.isArray(seznam) ? seznam : []).map((x) => x && x.slug)
  );
  if (!sluggy.has(navrh)) return navrh;
  let i = 2;
  while (sluggy.has(`${navrh}-${i}`)) i += 1;
  return `${navrh}-${i}`;
}

export function pridejPraci(stav, prace) {
  const pole = kopiePole(stav.prace);
  let nova = { ...prace };
  if (!nova.slug) nova.slug = unikatniSlug(pole, slug(nova.nazev));
  pole.unshift(nova);
  return { ...stav, prace: pole };
}

export function upravPraci(stav, slug, zmeny) {
  const pole = kopiePole(stav.prace).map((p) =>
    p.slug === slug ? { ...p, ...zmeny } : p
  );
  return { ...stav, prace: pole };
}

export function smazPraci(stav, slug) {
  return { ...stav, prace: kopiePole(stav.prace).filter((p) => p.slug !== slug) };
}

export function presun(stav, slug, smer) {
  const pole = kopiePole(stav.prace);
  const i = pole.findIndex((p) => p.slug === slug);
  const j = i + smer;
  if (i === -1 || j < 0 || j >= pole.length) return { ...stav, prace: pole };
  [pole[i], pole[j]] = [pole[j], pole[i]];
  return { ...stav, prace: pole };
}

export function nastavText(stav, klic, hodnota, zaklad) {
  const texty = { ...stav.texty };
  const predchozi = texty[klic];
  const platnyZaklad = predchozi ? predchozi._zaklad : zaklad;
  if (typeof hodnota === "string" && hodnota.trim() === platnyZaklad) {
    delete texty[klic];
  } else {
    texty[klic] = { hodnota, _zaklad: platnyZaklad };
  }
  return { ...stav, texty };
}

export function textyKPrepisu(stav) {
  const res = {};
  for (const [klic, t] of Object.entries(stav.texty ?? {})) res[klic] = t.hodnota;
  return res;
}

function nejvyssiCisloPoptavky(poptavky) {
  let max = 0;
  for (const p of poptavky ?? []) {
    const m = /^P-(\d+)$/.exec(String(p.id ?? ""));
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

export function prijmiPoptavku(stav, poptavka) {
  const pole = kopiePole(stav.poptavky);
  const nova = { ...poptavka, stav: "nova" };
  if (!nova.id) nova.id = `P-${String(nejvyssiCisloPoptavky(pole) + 1).padStart(3, "0")}`;
  pole.unshift(nova);
  return { ...stav, poptavky: pole };
}

export function zmenStavPoptavky(stav, id, novyStav) {
  if (!POPTAVKOVE_STAVY.has(novyStav)) return { ...stav, poptavky: kopiePole(stav.poptavky) };
  const pole = kopiePole(stav.poptavky).map((p) =>
    p.id === id ? { ...p, stav: novyStav } : p
  );
  return { ...stav, poptavky: pole };
}

export function exportuj(stav) {
  return JSON.stringify(stav, null, 2);
}

export function importuj(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { stav: null, chyba: CHYBA_IMPORT };
  }
  if (!jeObjekt(data) || !Array.isArray(data.prace)) {
    return { stav: null, chyba: CHYBA_IMPORT };
  }
  const stav = { ...data };
  if (!jeObjekt(stav.texty)) stav.texty = {};
  if (!Array.isArray(stav.poptavky)) stav.poptavky = [];
  if (!jeObjekt(stav.kontakt)) stav.kontakt = {};
  return { stav, chyba: null };
}

// --------------------------------------------------------------- projekty

export function pridejProjekt(stav, projekt) {
  const pole = kopiePole(stav.projekty);
  let novy = { ...projekt };
  if (!novy.slug) novy.slug = unikatniSlug(pole, slug(novy.nazev));
  pole.unshift(novy);
  return { ...stav, projekty: pole };
}

export function upravProjekt(stav, slug, zmeny) {
  const pole = kopiePole(stav.projekty).map((p) =>
    p.slug === slug ? { ...p, ...zmeny } : p
  );
  return { ...stav, projekty: pole };
}

export function smazProjekt(stav, slug) {
  return { ...stav, projekty: kopiePole(stav.projekty).filter((p) => p.slug !== slug) };
}

export function presunProjekt(stav, slug, smer) {
  const pole = kopiePole(stav.projekty);
  const i = pole.findIndex((p) => p.slug === slug);
  const j = i + smer;
  if (i === -1 || j < 0 || j >= pole.length) return { ...stav, projekty: pole };
  [pole[i], pole[j]] = [pole[j], pole[i]];
  return { ...stav, projekty: pole };
}

export function srovnejSeznam(ulozene, zeSouboru) {
  const soubor = Array.isArray(zeSouboru) ? zeSouboru : [];
  if (!Array.isArray(ulozene)) {
    return soubor.map((p) => ({ ...p }));
  }
  const sluggySouboru = new Set(soubor.map((p) => p && p.slug));
  const sluggyUlozene = new Set(ulozene.map((p) => p && p.slug));
  const vysledek = [];
  for (const ulozena of ulozene) {
    if (ulozena && ulozena.smazano) continue;
    const souborova = soubor.find((p) => p && p.slug === ulozena.slug);
    if (souborova) {
      vysledek.push({ ...souborova, ...ulozena });
    } else {
      vysledek.push({ ...ulozena, vlastni: true });
    }
  }
  for (const p of soubor) {
    if (!p || p.smazano) continue;
    if (!sluggyUlozene.has(p.slug)) vysledek.push({ ...p });
  }
  return vysledek;
}
