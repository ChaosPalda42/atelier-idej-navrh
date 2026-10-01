// C-001 — Plánovač psaní: časování, kdy se co píše.
// Čistý ES modul bez závislostí a bez DOM.

export const TEMPO = {
  znakyZaSekundu: 42,
  pauzaVeta: 180,
  pauzaPoPolozce: 160,
  minTrvani: 120,
  maxTrvani: 4000,
};

/** Počet ukončených vět v textu. */
export function vety(text) {
  if (typeof text !== "string" || text.length === 0) return 0;
  const shody = text.match(/[.!?…]+(\s|$)/g);
  return shody ? shody.length : 0;
}

/** Doba psaní textu v milisekundách (oříznutá a zaokrouhlená). */
export function trvaniTextu(text, tempo = TEMPO) {
  if (typeof text !== "string" || text.trim().length === 0) return 0;
  const zaklad = (text.trim().length / tempo.znakyZaSekundu) * 1000;
  const celkem = zaklad + vety(text) * tempo.pauzaVeta;
  const orezeno = Math.min(Math.max(celkem, tempo.minTrvani), tempo.maxTrvani);
  return Math.round(orezeno);
}

/** Sestaví časovou osu psaní položek. */
export function plan(polozky, tempo = TEMPO) {
  const vysledek = [];
  let kurzor = 0;
  let posledniStart = 0; // start poslední položky jiného typu než "poznamka"
  for (const polozka of polozky ?? []) {
    if (!polozka || !polozka.id) continue;
    let trvani;
    if (typeof polozka.trvani === "number" && Number.isFinite(polozka.trvani) && polozka.trvani >= 0) {
      trvani = Math.round(polozka.trvani);
    } else {
      trvani = trvaniTextu(polozka.text ?? "", tempo);
    }
    let start;
    if (polozka.typ === "poznamka") {
      start = posledniStart;
    } else {
      start = kurzor;
      posledniStart = start;
      kurzor = start + trvani + tempo.pauzaPoPolozce;
    }
    vysledek.push({ id: polozka.id, typ: polozka.typ, start, trvani, konec: start + trvani });
  }
  return vysledek;
}

/** Největší konec v plánu; prázdný plán -> 0. */
export function celkem(plan) {
  let max = 0;
  for (const polozka of plan ?? []) {
    if (polozka.konec > max) max = polozka.konec;
  }
  return max;
}

/** Stav plánu v daném okamžiku. */
export function stav(plan, cas) {
  const hotove = [];
  const probihajici = [];
  const cekajici = [];
  for (const polozka of plan ?? []) {
    if (cas >= polozka.konec) {
      hotove.push(polozka.id);
    } else if (cas >= polozka.start) {
      const podil = polozka.trvani === 0 ? 1 : Math.round(((cas - polozka.start) / polozka.trvani) * 1e4) / 1e4;
      probihajici.push({ id: polozka.id, podil });
    } else {
      cekajici.push(polozka.id);
    }
  }
  return { hotove, probihajici, cekajici };
}

/** Nový plán s časovými hodnotami vynásobenými nasobkem (původní se nemění). */
export function zrychli(plan, nasobek) {
  const validni = typeof nasobek === "number" && Number.isFinite(nasobek) && nasobek > 0;
  const k = validni ? nasobek : 0;
  return (plan ?? []).map((polozka) => ({
    id: polozka.id,
    typ: polozka.typ,
    start: Math.round(polozka.start * k),
    trvani: Math.round(polozka.trvani * k),
    konec: Math.round(polozka.konec * k),
  }));
}
