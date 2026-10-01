// Stav demo administrace — práce, texty, poptávky.
// Čistý ES modul bez závislostí a bez DOM.
// Všechny funkce, které mění stav, vrací nový objekt; původní zůstává beze změny.

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

export function vychoziStav(site) {
  const s = site && typeof site === "object" ? site : {};
  return {
    prace: Array.isArray(s.prace) ? [...s.prace] : [],
    texty: {},
    poptavky: [],
    kontakt: s.firma && typeof s.firma === "object" ? { ...s.firma } : {},
  };
}

export function unikatniSlug(prace, navrh) {
  const existujici = new Set((prace ?? []).map((p) => p.slug));
  if (!existujici.has(navrh)) return navrh;
  let i = 2;
  while (existujici.has(`${navrh}-${i}`)) i += 1;
  return `${navrh}-${i}`;
}

export function pridejPraci(stav, prace) {
  const nova = { ...prace };
  if (!nova.slug) nova.slug = slug(nova.nazev);
  nova.slug = unikatniSlug(stav.prace, nova.slug);
  return { ...stav, prace: [nova, ...stav.prace] };
}

export function upravPraci(stav, slug, zmeny) {
  const i = stav.prace.findIndex((p) => p.slug === slug);
  if (i === -1) return { ...stav, prace: [...stav.prace] };
  const prace = [...stav.prace];
  prace[i] = { ...prace[i], ...zmeny };
  return { ...stav, prace };
}

export function smazPraci(stav, slug) {
  return { ...stav, prace: stav.prace.filter((p) => p.slug !== slug) };
}

export function presun(stav, slug, smer) {
  const i = stav.prace.findIndex((p) => p.slug === slug);
  const j = i + smer;
  if (i === -1 || j < 0 || j >= stav.prace.length) {
    return { ...stav, prace: [...stav.prace] };
  }
  const prace = [...stav.prace];
  [prace[i], prace[j]] = [prace[j], prace[i]];
  return { ...stav, prace };
}

export function nastavText(stav, klic, hodnota, zaklad) {
  const texty = { ...stav.texty };
  const platnyZaklad = texty[klic] ? texty[klic]._zaklad : zaklad;
  if (String(hodnota).trim() === platnyZaklad) {
    delete texty[klic];
  } else {
    texty[klic] = { hodnota, _zaklad: platnyZaklad };
  }
  return { ...stav, texty };
}

export function textyKPrepisu(stav) {
  const res = {};
  for (const [klic, t] of Object.entries(stav.texty)) res[klic] = t.hodnota;
  return res;
}

function nejvyssiCislo(poptavky) {
  let max = 0;
  for (const p of poptavky) {
    const m = /^P-(\d+)$/.exec(p.id ?? "");
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

export function prijmiPoptavku(stav, poptavka) {
  const nova = { ...poptavka, stav: "nova" };
  if (!nova.id) nova.id = `P-${String(nejvyssiCislo(stav.poptavky) + 1).padStart(3, "0")}`;
  return { ...stav, poptavky: [nova, ...stav.poptavky] };
}

const POPTAVKOVE_STAVY = new Set(["nova", "ctena", "vyrizena"]);

export function zmenStavPoptavky(stav, id, novyStav) {
  if (!POPTAVKOVE_STAVY.has(novyStav)) return { ...stav, poptavky: [...stav.poptavky] };
  return {
    ...stav,
    poptavky: stav.poptavky.map((p) => (p.id === id ? { ...p, stav: novyStav } : p)),
  };
}

export function exportuj(stav) {
  return JSON.stringify(stav, null, 2);
}

export function importuj(text) {
  const chyba = "Tohle nevypadá jako záloha administrace.";
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { stav: null, chyba };
  }
  if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.prace)) {
    return { stav: null, chyba };
  }
  return {
    stav: {
      prace: data.prace,
      texty: data.texty && typeof data.texty === "object" ? data.texty : {},
      poptavky: Array.isArray(data.poptavky) ? data.poptavky : [],
      kontakt: data.kontakt && typeof data.kontakt === "object" ? data.kontakt : {},
    },
    chyba: null,
  };
}
