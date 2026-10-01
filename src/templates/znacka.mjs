/* Značka ateliér IDEJ — tři tahy kruhu a logotyp v křivkách.
   Cesty jsou vygenerované (tools/znacka.py), tady se jen skládají. */
import { ZNACKA } from "./znacka-cesty.mjs";

const SIRKY = [2.6, 2.1, 1.8];

/** Tahy kruhu v poli 0 0 100 100; `tloustka` je v jednotkách cílového viewBoxu. */
function tahy(merítko, tloustka) {
  return ZNACKA.kruh
    .map((d, i) => {
      const w = (SIRKY[i] / 2.6) * tloustka;
      return `<path class="tah tah-${i + 1}" stroke-width="${w.toFixed(2)}" d="${d}"/>`;
    })
    .join("");
}

/**
 * varianta: "horizontalni" | "stohovana" | "samotna"
 * barva:    "plna" (kruh oranžový, text tuha) | "oranzova" | "jedna" (vše currentColor)
 */
export function znacka({ varianta = "horizontalni", barva = "plna", trida = "", popis = "ateliér IDEJ" } = {}) {
  const oranz = barva === "jedna" ? "currentColor" : "var(--oranz, #ef7d1c)";
  const tuha = barva === "plna" ? "var(--tuha, #1c1a17)" : oranz;

  if (varianta === "samotna") {
    return `<svg class="znacka znacka--samotna ${trida}" viewBox="0 0 100 100" role="img" aria-label="${popis}">
<g class="znacka-kruh" fill="none" stroke="${oranz}" stroke-linecap="round" stroke-linejoin="round">${tahy(1, 2.6)}</g>
</svg>`;
  }

  if (varianta === "stohovana") {
    const F = 26;
    const m = F / 100;
    const sirkaA = ZNACKA["ateliér"].sirka * m;
    const sirkaI = ZNACKA.idej.sirka * m;
    const mezera = 11;
    const celkem = sirkaA + mezera + sirkaI;
    const x0 = (100 - celkem) / 2;
    return `<svg class="znacka znacka--stohovana ${trida}" viewBox="0 0 100 136" role="img" aria-label="${popis}">
<g class="znacka-kruh" fill="none" stroke="${oranz}" stroke-linecap="round" stroke-linejoin="round">${tahy(1, 2.6)}</g>
<g class="znacka-text" fill="${tuha}">
<path class="znacka-slovo" transform="translate(${x0.toFixed(2)} 128) scale(${m})" d="${ZNACKA["ateliér"].d}"/>
<path class="znacka-slovo" transform="translate(${(x0 + sirkaA + mezera).toFixed(2)} 128) scale(${m})" d="${ZNACKA.idej.d}"/>
</g>
</svg>`;
  }

  const S = 0.72;            // kruh zabírá 72 % výšky
  const F = 30;              // velikost logotypu
  const m = F / 100;
  const okrajKruhu = 65.5;   // pravý okraj kruhu po zmenšení
  const x0 = okrajKruhu + 20;
  const sirkaA = ZNACKA["ateliér"].sirka * m;
  const sirkaI = ZNACKA.idej.sirka * m;
  const mezera = 12;
  const sirka = Math.round(x0 + sirkaA + mezera + sirkaI + 2);
  return `<svg class="znacka znacka--horizontalni ${trida}" viewBox="0 0 ${sirka} 100" role="img" aria-label="${popis}">
<g class="znacka-kruh" fill="none" stroke="${oranz}" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 14) scale(${S})">${tahy(S, 2.6 / S)}</g>
<g class="znacka-text" fill="${tuha}">
<path class="znacka-slovo" transform="translate(${x0.toFixed(2)} 60.9) scale(${m})" d="${ZNACKA["ateliér"].d}"/>
<path class="znacka-slovo" transform="translate(${(x0 + sirkaA + mezera).toFixed(2)} 60.9) scale(${m})" d="${ZNACKA.idej.d}"/>
</g>
</svg>`;
}

/** Razítko do patičky — jako rohové razítko na výkrese. */
export function razitko(firma) {
  return `<svg class="razitko-kresba" viewBox="0 0 200 112" role="img" aria-label="Razítko ateliéru">
<g fill="none" stroke="var(--tuha-3, #857d70)" stroke-width="0.8">
<rect x="0.5" y="0.5" width="199" height="111"/>
<path d="M0.5 74h199M120.5 0.5v73.5M0.5 92h199"/>
</g>
<g class="razitko-znacka" fill="none" stroke="var(--oranz, #ef7d1c)" stroke-linecap="round" stroke-linejoin="round" transform="translate(12 10) scale(0.52)">${tahy(0.52, 5)}</g>
<g fill="var(--tuha, #1c1a17)" font-family="var(--pismo)" font-size="9.5">
<text x="128" y="20">ateliér IDEJ</text>
</g>
<g fill="var(--tuha-3, #857d70)" font-family="var(--mono)" font-size="5.6" letter-spacing="0.6">
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
