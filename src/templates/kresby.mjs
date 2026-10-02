/* Kresby — rukou, ne pravítkem.
   Každá čára se rozdělí na krátké úseky a ty se o kousek rozhodí do stran,
   takže výsledek je mírně křivý jako tužkou po papíře. Rozhození je
   deterministické (vlastní generátor), aby se web sestavil pokaždé stejně. */

const TUS = 'fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"';
const SLABA = 'fill="none" stroke="var(--linka)" stroke-width="1" stroke-linecap="round"';
const KOTA = 'fill="none" stroke="var(--oranz)" stroke-width="1.1" stroke-linecap="round"';

let zrno = 1;
function nahoda() {
  zrno = (zrno * 1103515245 + 12345) % 2147483648;
  return zrno / 2147483648;
}
function zacni(hodnota) { zrno = hodnota * 7919 + 13; }

/** Polyčára rozhozená rukou. body = [[x, y], …]; `zavrit` spojí konec se začátkem. */
export function cara(body, { zavrit = false, rozhod = 0.7, krok = 16 } = {}) {
  const pts = zavrit ? [...body, body[0]] : body;
  const ven = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const delka = Math.hypot(x2 - x1, y2 - y1);
    const dilu = Math.max(1, Math.round(delka / krok));
    const nx = -(y2 - y1) / (delka || 1);
    const ny = (x2 - x1) / (delka || 1);
    for (let k = i === 0 ? 0 : 1; k <= dilu; k++) {
      const t = k / dilu;
      const kraj = Math.sin(Math.PI * t);           // uprostřed čáry se ruka rozjede víc
      const o = (nahoda() - 0.5) * 2 * rozhod * (0.35 + 0.65 * kraj);
      ven.push([x1 + (x2 - x1) * t + nx * o, y1 + (y2 - y1) * t + ny * o]);
    }
  }
  const d = ven.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return `<path d="${d}"/>`;
}

/** Obdélník tažený rukou (čtyři tahy, rohy se nepotkají přesně). */
export function obdelnik(x, y, w, h) {
  return cara([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { zavrit: true });
}

/** Kóta s ryskami. */
function kota(x1, y, x2, popis) {
  return `<g ${KOTA}>${cara([[x1, y], [x2, y]], { rozhod: 0.35 })}${cara([[x1, y - 4], [x1, y + 4]], { rozhod: 0.2 })}${cara([[x2, y - 4], [x2, y + 4]], { rozhod: 0.2 })}</g>` +
    (popis ? `<text x="${(x1 + x2) / 2}" y="${y - 7}" text-anchor="middle" fill="var(--oranz)" font-family="var(--mono)" font-size="8" letter-spacing="0.5">${popis}</text>` : "");
}

/** Strom jako klubko čar. */
function strom(x, zem, vyska, sirka, hustota = 3) {
  const kusy = [cara([[x, zem], [x, zem - vyska * 0.42]], { rozhod: 0.5 })];
  for (let i = 0; i < hustota; i++) {
    const r = sirka * (0.62 + i * 0.16);
    const cy = zem - vyska * 0.72 + i * 1.6;
    const body = [];
    for (let k = 0; k < 11; k++) {
      const uhel = (k / 11) * Math.PI * 2;
      body.push([x + Math.cos(uhel) * r * (0.92 + nahoda() * 0.16),
                 cy + Math.sin(uhel) * r * 0.78 * (0.9 + nahoda() * 0.2)]);
    }
    kusy.push(cara(body, { zavrit: true, rozhod: 0.9, krok: 10 }));
  }
  return kusy.join("");
}

/* ------------------------------------------------------------------ hero */
export function kresbaHero() {
  zacni(7);
  const zem = 210;
  return `<svg class="kresba kresba--hero" viewBox="0 0 720 252" role="img" aria-label="Skica domu v krajině">
<g ${SLABA}>${cara([[196, 48], [196, 198]], { rozhod: 0.3 })}${cara([[470, 48], [470, 198]], { rozhod: 0.3 })}</g>
<g ${TUS}>
${cara([[8, 198], [86, 192], [150, 200], [196, 206]], { rozhod: 1.1 })}
${cara([[196, zem], [196, 124], [268, 80], [340, 124], [340, zem]], { rozhod: 0.6 })}
${cara([[340, 150], [470, 150], [470, zem]], { rozhod: 0.6 })}
${cara([[470, 150], [444, 132], [314, 132]], { rozhod: 0.6 })}
${cara([[196, zem], [512, zem]], { rozhod: 0.5 })}
${cara([[512, zem], [600, 212], [712, 202]], { rozhod: 1.1 })}
${obdelnik(208, 164, 30, 46)}
${obdelnik(262, 142, 40, 30)}
${obdelnik(360, 166, 36, 26)}
${obdelnik(412, 166, 36, 26)}
${strom(556, zem, 74, 26, 3)}
${strom(626, zem, 54, 19, 2)}
${strom(86, 198, 44, 15, 2)}
</g>
${kota(196, 234, 470, "16 400")}
<g ${KOTA}>${cara([[496, 124], [496, zem]], { rozhod: 0.3 })}${cara([[492, 124], [500, 124]], { rozhod: 0.2 })}${cara([[492, zem], [500, zem]], { rozhod: 0.2 })}</g>
<text x="504" y="170" fill="var(--oranz)" font-family="var(--mono)" font-size="8">+5,2</text>
</svg>`;
}

/* --------------------------------------------------------------- služby */
export function kresbaDum() {
  zacni(11);
  return `<svg class="kresba" viewBox="0 0 230 142" role="img" aria-label="Skica rodinného domu">
<g ${SLABA}>${cara([[6, 126], [224, 126]], { rozhod: 0.5 })}</g>
<g ${TUS}>
${cara([[40, 126], [40, 58], [100, 26], [160, 58], [160, 126]], { rozhod: 0.6 })}
${cara([[30, 62], [100, 26], [170, 62]], { rozhod: 0.5 })}
${cara([[40, 126], [160, 126]], { rozhod: 0.4 })}
${cara([[92, 126], [92, 96], [114, 96], [114, 126]], { rozhod: 0.4 })}
${obdelnik(54, 72, 26, 22)}${cara([[67, 72], [67, 94]], { rozhod: 0.3 })}
${obdelnik(124, 72, 26, 22)}${cara([[137, 72], [137, 94]], { rozhod: 0.3 })}
${strom(196, 126, 50, 17, 2)}
</g>
${kota(40, 136, 160, "")}
</svg>`;
}

export function kresbaHala() {
  zacni(23);
  return `<svg class="kresba" viewBox="0 0 230 142" role="img" aria-label="Skica haly s administrativou">
<g ${SLABA}>${cara([[6, 126], [224, 126]], { rozhod: 0.5 })}</g>
<g ${TUS}>
${cara([[20, 126], [20, 66], [82, 50], [150, 66], [150, 126]], { rozhod: 0.6 })}
${cara([[14, 68], [82, 50], [156, 68]], { rozhod: 0.5 })}
${cara([[20, 126], [150, 126]], { rozhod: 0.4 })}
${obdelnik(58, 88, 44, 38)}
${cara([[58, 98], [102, 98]], { rozhod: 0.3 })}${cara([[58, 108], [102, 108]], { rozhod: 0.3 })}${cara([[58, 118], [102, 118]], { rozhod: 0.3 })}
${obdelnik(150, 86, 56, 40)}
${cara([[158, 96], [198, 96]], { rozhod: 0.3 })}${cara([[158, 106], [198, 106]], { rozhod: 0.3 })}${cara([[158, 116], [198, 116]], { rozhod: 0.3 })}
</g>
${kota(20, 136, 206, "")}
</svg>`;
}

export function kresbaRekonstrukce() {
  zacni(31);
  return `<svg class="kresba" viewBox="0 0 230 142" role="img" aria-label="Skica přestavby">
<g ${SLABA}>${cara([[6, 126], [224, 126]], { rozhod: 0.5 })}</g>
<g fill="none" stroke="currentColor" stroke-width="1.1" stroke-dasharray="5 5" stroke-linecap="round" opacity="0.5">
${cara([[34, 126], [34, 54], [115, 24], [196, 54], [196, 126]], { rozhod: 0.6 })}
${cara([[34, 126], [196, 126]], { rozhod: 0.4 })}
</g>
<g ${TUS}>
${obdelnik(70, 74, 90, 52)}
${cara([[70, 100], [160, 100]], { rozhod: 0.4 })}
${cara([[100, 100], [100, 126]], { rozhod: 0.3 })}
${cara([[70, 74], [115, 58], [160, 74]], { rozhod: 0.5 })}
</g>
<g ${KOTA}>${cara([[115, 46], [115, 26]], { rozhod: 0.3 })}${cara([[110, 32], [115, 26], [120, 32]], { rozhod: 0.25 })}</g>
</svg>`;
}

export function kresbaStudie() {
  zacni(47);
  return `<svg class="kresba" viewBox="0 0 230 142" role="img" aria-label="Skica ověřovací studie">
<g fill="none" stroke="currentColor" stroke-width="1.1" stroke-dasharray="6 5" stroke-linecap="round" opacity="0.55">
${cara([[20, 118], [20, 40], [80, 22], [192, 36], [192, 118]], { zavrit: true, rozhod: 0.8 })}
</g>
<g ${SLABA}>${cara([[20, 96], [192, 96]], { rozhod: 0.4 })}${cara([[96, 24], [96, 118]], { rozhod: 0.4 })}</g>
<g ${TUS}>
${obdelnik(38, 88, 36, 22)}
${obdelnik(86, 56, 40, 26)}
${obdelnik(140, 72, 40, 34)}
</g>
<g ${KOTA}>
${cara([[200, 40], [200, 20]], { rozhod: 0.3 })}${cara([[196, 25], [200, 20], [204, 25]], { rozhod: 0.2 })}
</g>
<text x="200" y="54" text-anchor="middle" fill="var(--oranz)" font-family="var(--mono)" font-size="7">S</text>
</svg>`;
}

export const KRESBY = {
  dum: kresbaDum,
  hala: kresbaHala,
  rekonstrukce: kresbaRekonstrukce,
  studie: kresbaStudie,
};

/* ------------------------------------------- zástupná skica místo fotky */
/** Dokud nejsou fotky od klienta, kreslí se místo nich hmotová skica. */
export function zastupnaSkica(seed = 1) {
  zacni(100 + seed * 13);
  const kusy = [];
  let x = 20;
  for (let i = 0; i < 6; i++) {
    const w = 38 + Math.round(nahoda() * 58);
    const h = 28 + Math.round(nahoda() * 52);
    const y = 118 - h;
    kusy.push(obdelnik(x, y, w, h));
    if (nahoda() > 0.45) {
      const hreben = 12 + Math.round(nahoda() * 16);
      kusy.push(cara([[x - 3, y], [x + w / 2, y - hreben], [x + w + 3, y]], { rozhod: 0.5 }));
    }
    x += w + 5;
    if (x > 268) break;
  }
  return `<svg class="skica-zastupna" viewBox="0 0 300 140" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Místo fotografie zatím skica">
<g ${SLABA}>${cara([[0, 118], [300, 118]], { rozhod: 0.5 })}</g>
<g ${TUS} opacity="0.85">${kusy.join("")}</g>
</svg>`;
}
