// C-002 — Co je ve výřezu a co se má začít psát.
// Čistý ES modul bez závislostí a bez DOM; souřadnice jsou čísla v pixelech
// od začátku dokumentu. Výřez i prvek jsou objekty { vrchol, vyska }.

function zaokrouhli(x) {
  return Math.round(x * 1e4) / 1e4;
}

function orecni(x) {
  return Math.min(1, Math.max(0, x));
}

/** Délka průniku dvou svislých intervalů; nepřekrývají-li se, 0. Záporná výška -> 0. */
export function prunik(a, b) {
  const dolni = Math.max(a.vrchol, b.vrchol);
  const horni = Math.min(a.vrchol + a.vyska, b.vrchol + b.vyska);
  const p = horni - dolni;
  return p > 0 ? p : 0;
}

/** Podíl prvku ve výřezu, oříznutý do <0, 1> a zaokrouhlený na 4 desetinná místa. */
export function viditelnost(ramec, prvek) {
  if (!prvek || !(prvek.vyska > 0)) {
    return 0;
  }
  return zaokrouhli(orecni(prunik(ramec, prvek) / prvek.vyska));
}

/** true, když je prvek celý nad výřezem. */
export function minulo(ramec, prvek) {
  return prvek.vrchol + prvek.vyska <= ramec.vrchol;
}

/** Kolik z výřezu prvek zabírá, oříznutý do <0, 1> a zaokrouhlený na 4 desetinná místa. */
export function podilVyrezu(ramec, prvek) {
  if (!(ramec.vyska > 0)) {
    return 0;
  }
  return zaokrouhli(orecni(prunik(ramec, prvek) / ramec.vyska));
}

/**
 * Id prvků v pořadí vstupu, která se mají spustit: nejsou v hotove, neprošla
 * minulo() a platí viditelnost >= prah NEBO podilVyrezu >= prah.
 */
export function kSpusteni(prvky, ramec, hotove, prah = 0.35) {
  const hotoveMnozina = new Set(hotove);
  const vysledek = [];
  for (const prvek of prvky) {
    if (hotoveMnozina.has(prvek.id)) {
      continue;
    }
    if (minulo(ramec, prvek)) {
      continue;
    }
    if (viditelnost(ramec, prvek) >= prah || podilVyrezu(ramec, prvek) >= prah) {
      vysledek.push(prvek.id);
    }
  }
  return vysledek;
}

/** Id prvků v pořadí vstupu, které nejsou v hotove a prošly minulo(). */
export function dopsat(prvky, ramec, hotove) {
  const hotoveMnozina = new Set(hotove);
  const vysledek = [];
  for (const prvek of prvky) {
    if (hotoveMnozina.has(prvek.id)) {
      continue;
    }
    if (minulo(ramec, prvek)) {
      vysledek.push(prvek.id);
    }
  }
  return vysledek;
}

/** Podíl přečteného dokumentu, oříznutý do <0, 1> a zaokrouhlený na 4 desetinná místa. */
export function postup(ramec, vyskaDokumentu) {
  const jmenovatel = vyskaDokumentu - ramec.vyska;
  if (jmenovatel <= 0) {
    return 1;
  }
  return zaokrouhli(orecni(ramec.vrchol / jmenovatel));
}
