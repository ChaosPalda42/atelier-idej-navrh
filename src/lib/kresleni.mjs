// C-011 — Kreslení od ruky: rozhození čar.
// Čistý ES modul bez závislostí a bez DOM. Všechno deterministické.

/**
 * Deterministický generátor čísel v <0, 1).
 * @param {number} seed
 * @returns {() => number}
 */
export function nahodnik(seed) {
  let z = BigInt(seed * 7919 + 13);
  return () => {
    // Přesné celočíselné aritmetiku (nad 2^53 by se ztratila přesnost).
    z = (z * 1103515245n + 12345n) % 2147483648n;
    return Number(z) / 2147483648;
  };
}

/**
 * Z přesné polyčáry udělá takovou, jako by ji táhla ruka.
 * @param {number[][]} body - [[x, y], …]
 * @param {() => number} nahoda - funkce vracející 0..1
 * @param {{rozhod?: number, krok?: number, zavrit?: boolean}} [nastaveni]
 * @returns {number[][]}
 */
export function rozhozeni(body, nahoda, nastaveni = {}) {
  if (!Array.isArray(body) || body.length < 2) {
    return Array.isArray(body) ? body.map((b) => [...b]) : [];
  }
  const { rozhod = 0.7, krok = 16, zavrit = false } = nastaveni ?? {};
  const body2 = zavrit ? [...body, [...body[0]]] : body;
  const vysledek = [];
  for (let i = 0; i < body2.length - 1; i++) {
    const [x1, y1] = body2[i];
    const [x2, y2] = body2[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const delka = Math.hypot(dx, dy);
    const dilu = Math.max(1, Math.round(delka / krok));
    const nx = delka === 0 ? 0 : -dy / delka;
    const ny = delka === 0 ? 0 : dx / delka;
    const zavirejici = zavrit && i === body2.length - 2;
    const od = i === 0 || zavirejici ? 0 : 1;
    for (let k = od; k <= dilu; k++) {
      const t = k / dilu;
      const o = (nahoda() - 0.5) * 2 * rozhod * (0.35 + 0.65 * Math.sin(Math.PI * t));
      vysledek.push([x1 + dx * t + nx * o, y1 + dy * t + ny * o]);
    }
  }
  return vysledek;
}

/**
 * SVG cesta "M x y L x y L …" se souřadnicemi zaokrouhlenými na `desetinna`
 * desetinných míst. Prázdné pole -> "".
 * @param {number[][]} body
 * @param {number} [desetinna]
 * @returns {string}
 */
export function cesta(body, desetinna = 1) {
  if (!Array.isArray(body) || body.length === 0) return "";
  const cast = (v) => Number(v).toFixed(desetinna);
  const [x0, y0] = body[0];
  let text = `M ${cast(x0)} ${cast(y0)}`;
  for (let i = 1; i < body.length; i++) {
    text += ` L ${cast(body[i][0])} ${cast(body[i][1])}`;
  }
  return text;
}

/**
 * Součet délek úseků; méně než dva body -> 0.
 * @param {number[][]} body
 * @returns {number}
 */
export function delka(body) {
  if (!Array.isArray(body) || body.length < 2) return 0;
  let celkem = 0;
  for (let i = 0; i < body.length - 1; i++) {
    celkem += Math.hypot(body[i + 1][0] - body[i][0], body[i + 1][1] - body[i][1]);
  }
  return celkem;
}
