/* Kresby — všechno jsou čáry, aby se daly před očima narýsovat.
   Tenká tuš, žádné výplně kromě papíru; oranžová jen na kóty a zvýraznění. */

const TUS = 'fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"';
const SLABA = 'fill="none" stroke="var(--modra, #a9bccd)" stroke-width="0.8" stroke-linecap="round"';
const KOTA = 'fill="none" stroke="var(--oranz, #ef7d1c)" stroke-width="1" stroke-linecap="round"';

/** Kóta s koncovými ryskami. */
function kota(x1, y, x2, popis) {
  return `<g ${KOTA}>
<path d="M${x1} ${y}h${x2 - x1}"/><path d="M${x1} ${y - 4}v8"/><path d="M${x2} ${y - 4}v8"/>
</g>${popis ? `<text x="${(x1 + x2) / 2}" y="${y - 7}" text-anchor="middle" fill="var(--oranz, #ef7d1c)" font-family="var(--mono)" font-size="8" letter-spacing="0.5">${popis}</text>` : ""}`;
}

/* ------------------------------------------------------------------ hero */
export function kresbaHero() {
  return `<svg class="kresba kresba--hero" viewBox="0 0 720 250" role="img" aria-label="Skica domu v krajině">
  <g ${SLABA}>
    <path d="M60 232h600"/>
    <path d="M196 44v150"/><path d="M470 44v150"/>
  </g>
  <g ${TUS}>
    <path d="M8 196c58-4 92-2 126 4 40 7 58 10 74 10"/>
    <path d="M196 210V124"/>
    <path d="M196 124l72-44 72 44"/>
    <path d="M340 124v86"/>
    <path d="M340 150h130v60H340"/>
    <path d="M470 150l-26-18H314"/>
    <path d="M208 210v-46h30v46"/>
    <path d="M262 142h40v30h-40z"/>
    <path d="M360 166h36v26h-36z"/>
    <path d="M412 166h36v26h-36z"/>
    <path d="M196 210h316"/>
    <path d="M512 210c42 2 116 0 200-8"/>
    <path d="M556 210v-30"/>
    <path d="M556 180c-16-2-24-12-22-24 2-13 14-19 26-17 10-12 30-10 36 2 14 0 20 12 16 22-4 11-16 17-26 15-8 6-22 6-30 2z"/>
    <path d="M626 210v-22"/>
    <path d="M626 188c-12-2-18-10-16-19 2-9 11-14 19-12 8-9 23-8 27 2 10 0 15 9 12 17-3 8-12 12-19 11-6 4-17 4-23 1z"/>
    <path d="M86 196v-18"/>
    <path d="M86 178c-10-2-15-9-13-16 2-8 9-12 16-10 7-8 19-7 23 2 8 0 13 7 10 14-3 7-10 11-16 10-5 3-14 3-20 0z"/>
  </g>
  ${kota(196, 232, 470, "16 400")}
  <g ${KOTA}><path d="M496 124v86"/><path d="M492 124h8"/><path d="M492 210h8"/></g>
  <text x="502" y="170" fill="var(--oranz, #ef7d1c)" font-family="var(--mono)" font-size="8">+5,2</text>
</svg>`;
}

/* --------------------------------------------------------------- služby */
export function kresbaDum() {
  return `<svg class="kresba" viewBox="0 0 230 142" role="img" aria-label="Skica rodinného domu">
  <g ${SLABA}><path d="M6 126h218"/></g>
  <g ${TUS}>
    <path d="M40 126V58"/><path d="M160 126V58"/>
    <path d="M30 60l70-34 70 34"/>
    <path d="M40 126h120"/>
    <path d="M92 126V96h22v30"/>
    <path d="M54 72h26v22H54z"/><path d="M67 72v22"/>
    <path d="M124 72h26v22h-26z"/><path d="M137 72v22"/>
    <path d="M196 126v-26"/>
    <path d="M196 100c-14-2-21-12-18-22 3-11 13-16 23-14 9-10 26-9 31 2 12 0 17 10 14 19-4 9-14 15-23 13-7 5-20 5-27 2z"/>
  </g>
  ${kota(40, 136, 160, "")}
</svg>`;
}

export function kresbaHala() {
  return `<svg class="kresba" viewBox="0 0 230 142" role="img" aria-label="Skica haly s administrativou">
  <g ${SLABA}><path d="M6 126h218"/></g>
  <g ${TUS}>
    <path d="M20 126V66"/><path d="M150 126V66"/>
    <path d="M14 68l68-18 74 18"/>
    <path d="M20 126h130"/>
    <path d="M58 126V88h44v38"/>
    <path d="M58 98h44M58 108h44M58 118h44"/>
    <path d="M150 126V86h56v40z"/>
    <path d="M158 94h40M158 104h40M158 114h40"/>
    <path d="M150 86h56"/>
  </g>
  ${kota(20, 136, 206, "")}
</svg>`;
}

export function kresbaRekonstrukce() {
  return `<svg class="kresba" viewBox="0 0 230 142" role="img" aria-label="Skica přestavby">
  <g ${SLABA}><path d="M6 126h218"/></g>
  <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-dasharray="5 5" stroke-linecap="round" opacity="0.55">
    <path d="M34 126V54"/><path d="M196 126V54"/><path d="M26 56l89-32 89 32"/><path d="M34 126h162"/>
  </g>
  <g ${TUS}>
    <path d="M70 126V74h90v52z"/>
    <path d="M70 100h90"/>
    <path d="M100 126V100"/>
    <path d="M70 74l45-16 45 16"/>
  </g>
  <g ${KOTA}><path d="M115 44v-18"/><path d="M110 32l5-6 5 6"/></g>
</svg>`;
}

export function kresbaStudie() {
  return `<svg class="kresba" viewBox="0 0 230 142" role="img" aria-label="Skica ověřovací studie">
  <g fill="none" stroke="currentColor" stroke-width="1.1" stroke-dasharray="6 5" stroke-linecap="round" opacity="0.6">
    <path d="M20 118V40l60-18 112 14v82z"/>
  </g>
  <g ${SLABA}><path d="M20 96h172"/><path d="M96 22v96"/></g>
  <g ${TUS}>
    <path d="M38 88h36v22H38z"/>
    <path d="M86 56h40v26H86z"/>
    <path d="M140 72h40v34h-40z"/>
  </g>
  <g ${KOTA}>
    <circle cx="200" cy="30" r="10"/>
    <path d="M200 40V20"/><path d="M196 25l4-5 4 5"/>
  </g>
  <text x="200" y="54" text-anchor="middle" fill="var(--oranz, #ef7d1c)" font-family="var(--mono)" font-size="7">S</text>
</svg>`;
}

export const KRESBY = {
  dum: kresbaDum,
  hala: kresbaHala,
  rekonstrukce: kresbaRekonstrukce,
  studie: kresbaStudie,
};

/* ------------------------------------------- zástupná skica místo fotky */
/** Dokud nejsou fotky od klienta, kreslí se místo nich půdorysná skica. */
export function zastupnaSkica(seed = 1) {
  const r = (n) => {
    const x = Math.sin(seed * 97.13 + n * 31.7) * 10000;
    return x - Math.floor(x);
  };
  const cary = [];
  let x = 24;
  for (let i = 0; i < 5; i++) {
    const w = 40 + Math.round(r(i) * 60);
    const h = 30 + Math.round(r(i + 10) * 50);
    const y = 118 - h;
    cary.push(`<path d="M${x} 118V${y}h${w}v${h}"/>`);
    if (r(i + 20) > 0.5) cary.push(`<path d="M${x} ${y}l${w / 2} -${14 + Math.round(r(i) * 16)} ${w / 2} ${14 + Math.round(r(i) * 16)}"/>`);
    x += w + 6;
    if (x > 260) break;
  }
  return `<svg class="skica-zastupna" viewBox="0 0 300 140" role="img" aria-label="Místo fotografie zatím skica">
  <g ${SLABA}><path d="M0 118h300"/><path d="M0 92h300"/></g>
  <g ${TUS} opacity="0.8">${cary.join("")}</g>
</svg>`;
}
