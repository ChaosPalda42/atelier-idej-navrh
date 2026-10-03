/* Značka ateliér IDEJ — skutečné vektory z Logo.pdf (viz tools/znacka.py).
   Kruh je tažený třikrát: sytá oranžová silnější, světlejší tenčí a černý
   přejezd přes ně. Nic se nepřekresluje, jen skládá a oživuje. */
import { ZNACKA } from "./znacka-cesty.mjs";

const K = ZNACKA.kruh.box;           // [x, y, šířka, výška] samotné kresby
const L = ZNACKA.logotyp.box;
const A = ZNACKA.aurebesh.box;
const STRED = [K[0] + K[2] / 2, K[1] + K[3] / 2];

// Kruh se otáčí, takže v rámu nezabírá svůj obdélník, ale OPSANOU KRUŽNICI.
// Rám počítaný z `K` by nejvzdálenější tah při otočení uřízl (kresba je širší
// než vyšší, 304.8 × 292.6, ale nejdál od středu je 158.8). `KR` je čtverec,
// kterým kruh projde v každé fázi otáčení.
const POLOMER = Math.ceil(
  ZNACKA.kruh.tahy.reduce((nej, tah) => {
    const cisla = tah.d.match(/-?\d*\.?\d+/g).map(Number);
    for (let i = 0; i + 1 < cisla.length; i += 2) {
      const r = Math.hypot(cisla[i] - STRED[0], cisla[i + 1] - STRED[1]) + tah.sirka / 2;
      if (r > nej) nej = r;
    }
    return nej;
  }, 0),
);
const KR = [STRED[0] - POLOMER, STRED[1] - POLOMER, 2 * POLOMER, 2 * POLOMER];

let poradi = 0;

function tahyKruhu() {
  return ZNACKA.kruh.tahy
    .map((t) => `<path d="${t.d}" stroke="${t.barva}" stroke-width="${t.sirka}"/>`)
    .join("");
}

/** Kruh i s maskou, kterou se dá „nakreslit" jedním objezdem. */
function kruh({ kresli = false }) {
  const id = `tah-${++poradi}`;
  // Maska MUSÍ mít vlastní rozsah. Bez něj se použije výchozí (-10 %/120 %
  // počítané z viewportu), který kresbu ořízne — a protože se kruh otáčí,
  // ten zářez pak putuje dokola.
  const okraj = 160;
  const maska = kresli
    ? `<mask id="${id}" maskUnits="userSpaceOnUse"
 x="${(K[0] - okraj).toFixed(0)}" y="${(K[1] - okraj).toFixed(0)}"
 width="${(K[2] + 2 * okraj).toFixed(0)}" height="${(K[3] + 2 * okraj).toFixed(0)}">
<circle class="znacka-objezd" cx="${STRED[0]}" cy="${STRED[1]}" r="100" fill="none" stroke="#fff" stroke-width="300"/>
</mask>`
    : "";
  return `${maska}<g class="znacka-kruh" fill="none" stroke-linecap="round" stroke-linejoin="round"${kresli ? ` mask="url(#${id})"` : ""}>${tahyKruhu()}</g>`;
}

/**
 * varianta: "plna" (jako předloha, i s aurebeshem) | "stohovana" | "horizontalni" | "samotna"
 * kresli:   true = při načtení se kruh objede a pak se pomalu otáčí
 */
export function znacka({ varianta = "stohovana", kresli = false, trida = "", popis = "ateliér IDEJ" } = {}) {
  const logotyp = `<path class="znacka-logotyp" d="${ZNACKA.logotyp.d}" fill="${ZNACKA.logotyp.barva}"/>`;
  const aurebesh = `<path class="znacka-aurebesh" d="${ZNACKA.aurebesh.d}" fill="${ZNACKA.aurebesh.barva}"/>`;
  const otevri = (viewBox, dalsi = "") =>
    `<svg class="znacka znacka--${varianta} ${trida}" viewBox="${viewBox}" role="img" aria-label="${popis}"${dalsi}>`;

  if (varianta === "samotna") {
    return `${otevri(`${KR[0] - 3} ${KR[1] - 3} ${KR[2] + 6} ${KR[3] + 6}`)}${kruh({ kresli })}</svg>`;
  }

  if (varianta === "plna") {
    const x = Math.min(KR[0], L[0], A[0]) - 4;
    const y = Math.min(KR[1], L[1], A[1]) - 4;
    const w = Math.max(KR[0] + KR[2], L[0] + L[2], A[0] + A[2]) - x + 4;
    const h = Math.max(KR[1] + KR[3], L[1] + L[3], A[1] + A[3]) - y + 4;
    return `${otevri(`${x} ${y} ${w} ${h}`)}${kruh({ kresli })}${logotyp}${aurebesh}</svg>`;
  }

  if (varianta === "horizontalni") {
    // kruh vlevo, logotyp vpravo, opticky na střed kruhu
    const mer = 0.56;
    const mezera = 34;
    const posunX = KR[0] + KR[2] + mezera - L[0] * mer;
    const posunY = STRED[1] - (L[1] + L[3] / 2) * mer;
    const w = KR[0] + KR[2] + mezera + L[2] * mer + 4;
    return `${otevri(`${KR[0] - 3} ${KR[1] - 3} ${w - KR[0] + 6} ${KR[3] + 6}`)}
${kruh({ kresli })}
<g transform="translate(${posunX.toFixed(2)} ${posunY.toFixed(2)}) scale(${mer})">${logotyp}</g>
</svg>`;
  }

  const x = Math.min(KR[0], L[0]) - 4;
  const y = KR[1] - 4;
  const w = Math.max(KR[0] + KR[2], L[0] + L[2]) - x + 4;
  const h = L[1] + L[3] - y + 4;
  return `${otevri(`${x} ${y} ${w} ${h}`)}${kruh({ kresli })}${logotyp}</svg>`;
}

/** Rohové razítko do patičky — jako na výkrese. */
export function razitko(firma) {
  const mer = 0.2;
  const posunX = 10 - K[0] * mer;
  const posunY = 14 - K[1] * mer;
  return `<svg class="razitko-kresba" viewBox="0 0 200 112" role="img" aria-label="Razítko ateliéru">
<g fill="none" stroke="var(--linka)" stroke-width="0.8">
<rect x="0.5" y="0.5" width="199" height="111"/>
<path d="M0.5 74h199M120.5 0.5v73.5M0.5 92h199"/>
</g>
<g transform="translate(${posunX.toFixed(2)} ${posunY.toFixed(2)}) scale(${mer})">
<g class="znacka-kruh" fill="none" stroke-linecap="round" stroke-linejoin="round">${tahyKruhu()}</g>
</g>
<g fill="var(--tuha)" font-family="var(--pismo)" font-size="9.5">
<text x="128" y="20">ateliér IDEJ</text>
</g>
<g fill="var(--tuha-3)" font-family="var(--mono)" font-size="5.6" letter-spacing="0.6">
<text x="128" y="34">${firma.architekt}</text>
<text x="128" y="45">IČO ${firma.ico}</text>
<text x="128" y="56">${firma.telefon}</text>
<text x="6" y="86">LIST 1/1</text>
<text x="62" y="86">MĚŘÍTKO 1:1</text>
<text x="128" y="86">PRAHA</text>
<text x="6" y="104">NÁVRH WEBU · UKÁZKA · NEOSTRÁ DATA</text>
</g>
</svg>`;
}
