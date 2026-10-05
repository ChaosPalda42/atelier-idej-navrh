// C-012 — Kroužková vazba: rozmístění kroužků drátěné vazby podél horní
// hrany listu. Čistý ES modul bez závislostí a bez DOM.

/**
 * Deterministický generátor (LCG) nasazený `seedem`. Každé volání vrátí
 * číslo v <0, 1); stejné seed dává stejnou řadu, jiný seed jinou.
 */
function lcg(seed) {
  let stav = (Math.trunc(seed) >>> 0) || 1;
  return function () {
    stav = (stav * 1664525 + 1013904223) >>> 0;
    return stav / 4294967296;
  };
}

/**
 * Rozmístí kroužky drátěné vazby podél horní hrany listu širokého `sirka`.
 *
 * Vrací pole objektů { x, naklon, lesk, stin } — jeden za každý kroužek.
 * Poloha je čistě geometrická (nezávisí na seedu): první kroužek sedí na
 * `okraj`, poslední na `sirka - okraj` a mezera mezi sousedy nikdy
 * nepřeroste `rozestup`. Naklon, lesk a stín se počítají z deterministického
 * generátoru nasazeného `seedem`, aby vazba nevypadala jako tapeta.
 */
export function krouzky(sirka, { rozestup = 56, okraj = 30, seed = 1, naklonMax = 1.6 } = {}) {
  if (typeof sirka !== "number" || !Number.isFinite(sirka)) {
    return [];
  }
  const L = sirka - 2 * okraj;
  if (L < 0) {
    return [];
  }

  const nahod = lcg(seed);
  const rozhozeni = () => ({
    naklon: (nahod() * 2 - 1) * naklonMax,
    lesk: 0.3 + nahod() * 0.4,
    stin: 0.8 + nahod() * 0.4,
  });

  if (L === 0) {
    return [{ x: sirka / 2, ...rozhozeni() }];
  }

  const n = Math.ceil(L / rozestup);
  const krok = L / n;
  const vysledek = [];
  for (let i = 0; i <= n; i++) {
    vysledek.push({ x: okraj + i * krok, ...rozhozeni() });
  }
  return vysledek;
}
