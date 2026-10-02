import { nahodnik, rozhozeni, cesta } from "../lib/kresleni.mjs";

/* Kresby — rukou, ne pravítkem.
   Každá čára se rozdělí na krátké úseky a ty se o kousek rozhodí do stran,
   takže výsledek je mírně křivý jako tužkou po papíře. Rozhození je
   deterministické (vlastní generátor), aby se web sestavil pokaždé stejně. */

const TUS = 'fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"';
const SLABA = 'fill="none" stroke="var(--linka)" stroke-width="1" stroke-linecap="round"';
const KOTA = 'fill="none" stroke="var(--oranz)" stroke-width="1.1" stroke-linecap="round"';

let nahoda = nahodnik(1);
function zacni(hodnota) { nahoda = nahodnik(hodnota); }

/** Polyčára rozhozená rukou. body = [[x, y], …]; `zavrit` spojí konec se začátkem. */
export function cara(body, { zavrit = false, rozhod = 0.7, krok = 16 } = {}) {
  return `<path d="${cesta(rozhozeni(body, nahoda, { rozhod, krok, zavrit }))}"/>`;
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

/* ------------------------------------------------- velké kresby na pozadí */

/** Oblouk rozsekaný na body, aby se dal táhnout rukou. */
export function oblouk(cx, cy, r, od, kam, dilu = 14) {
  const body = [];
  for (let i = 0; i <= dilu; i++) {
    const u = ((od + (kam - od) * (i / dilu)) * Math.PI) / 180;
    body.push([cx + Math.cos(u) * r, cy + Math.sin(u) * r]);
  }
  return body;
}

/** Šrafura pod terénem nebo v řezu. */
function srafy(x1, y, x2, delka = 9, rozestup = 13) {
  const kusy = [];
  for (let x = x1; x <= x2; x += rozestup) {
    kusy.push(cara([[x, y], [x - delka * 0.6, y + delka]], { rozhod: 0.35, krok: 20 }));
  }
  return kusy.join("");
}

/** Půdorys — na pozadí sekce i jako samostatná kresba. */
export function kresbaPudorys() {
  zacni(61);
  const zed = 9;
  const kusy = [
    obdelnik(20, 20, 420, 270),
    obdelnik(20 + zed, 20 + zed, 420 - 2 * zed, 270 - 2 * zed),
    // vnitřní příčky
    cara([[196, 29], [196, 150]], { rozhod: 0.4 }),
    cara([[205, 29], [205, 150]], { rozhod: 0.4 }),
    cara([[29, 150], [196, 150]], { rozhod: 0.4 }),
    cara([[29, 159], [196, 159]], { rozhod: 0.4 }),
    cara([[300, 159], [431, 159]], { rozhod: 0.4 }),
    cara([[300, 150], [431, 150]], { rozhod: 0.4 }),
    cara([[300, 159], [300, 281]], { rozhod: 0.4 }),
    cara([[309, 159], [309, 281]], { rozhod: 0.4 }),
  ];
  // dveře s otočením křídla
  kusy.push(cara([[196, 96], [196, 64]], { rozhod: 0.3 }));
  kusy.push(cara(oblouk(205, 64, 32, 180, 90), { rozhod: 0.4, krok: 22 }));
  kusy.push(cara([[300, 210], [300, 242]], { rozhod: 0.3 }));
  kusy.push(cara(oblouk(309, 242, 32, 180, 270), { rozhod: 0.4, krok: 22 }));
  // okna (přerušení ve zdi)
  [[70, 130], [250, 330], [360, 420]].forEach(([a, b]) => {
    kusy.push(cara([[a, 24.5], [b, 24.5]], { rozhod: 0.25 }));
  });
  // schodiště
  for (let i = 0; i < 9; i++) {
    kusy.push(cara([[220, 180 + i * 11], [284, 180 + i * 11]], { rozhod: 0.3 }));
  }
  kusy.push(cara([[252, 178], [252, 278]], { rozhod: 0.3 }));
  // nábytek
  kusy.push(cara(oblouk(100, 90, 26, 0, 360, 22), { zavrit: true, rozhod: 0.5, krok: 14 }));
  kusy.push(obdelnik(44, 200, 78, 36));
  kusy.push(obdelnik(360, 190, 60, 82));

  return `<svg class="kresba kresba--velka" viewBox="0 0 460 310" role="img" aria-label="Půdorys rodinného domu">
<g ${TUS}>${kusy.join("")}</g>
<g font-family="var(--rukou)" font-size="19" fill="var(--oranz)">
<text x="60" y="130">obývací</text>
<text x="330" y="130">ložnice</text>
</g>
</svg>`;
}

/** Řez domem i s terénem a kótami. */
export function kresbaRez() {
  zacni(73);
  const zem = 250;
  const kusy = [
    cara([[10, zem + 6], [180, zem], [430, zem - 4], [700, zem + 10], [750, zem + 8]], { rozhod: 1.2 }),
    // základ a deska
    cara([[210, zem + 26], [210, 150]], { rozhod: 0.5 }),
    cara([[540, zem + 26], [540, 150]], { rozhod: 0.5 }),
    cara([[210, zem + 26], [540, zem + 26]], { rozhod: 0.5 }),
    cara([[210, 198], [540, 198]], { rozhod: 0.4 }),
    cara([[210, 190], [540, 190]], { rozhod: 0.4 }),
    cara([[210, 150], [375, 78], [540, 150]], { rozhod: 0.6 }),
    cara([[204, 154], [375, 70], [546, 154]], { rozhod: 0.6 }),
    // vnitřní příčka a strop podkroví
    cara([[375, 150], [375, 78]], { rozhod: 0.4 }),
    cara([[250, 126], [500, 126]], { rozhod: 0.4 }),
    // okna v řezu
    obdelnik(236, 212, 44, 30),
    obdelnik(466, 212, 44, 30),
    obdelnik(330, 104, 44, 22),
  ];
  return `<svg class="kresba kresba--velka" viewBox="0 0 760 300" role="img" aria-label="Řez domem">
<g ${SLABA}>${srafy(10, zem + 8, 750)}</g>
<g ${TUS}>${kusy.join("")}</g>
<g ${KOTA}>
${cara([[600, 78], [600, zem]], { rozhod: 0.3 })}
${cara([[594, 78], [606, 78]], { rozhod: 0.2 })}
${cara([[594, 198], [606, 198]], { rozhod: 0.2 })}
${cara([[594, zem], [606, zem]], { rozhod: 0.2 })}
</g>
<g font-family="var(--mono)" font-size="10" fill="var(--oranz)">
<text x="614" y="82">+6,400</text>
<text x="614" y="202">+2,900</text>
<text x="614" y="254">±0,000</text>
</g>
</svg>`;
}

/** Situace — pozemek, vrstevnice, hmoty. */
export function kresbaSituace() {
  zacni(89);
  const vrstevnice = [];
  for (let i = 0; i < 5; i++) {
    const y = 90 + i * 46;
    const body = [];
    for (let x = 10; x <= 510; x += 50) {
      body.push([x, y + Math.sin((x + i * 60) / 90) * 16]);
    }
    vrstevnice.push(cara(body, { rozhod: 1.0, krok: 26 }));
  }
  return `<svg class="kresba kresba--velka" viewBox="0 0 520 340" role="img" aria-label="Situace pozemku">
<g ${SLABA}>${vrstevnice.join("")}</g>
<g fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="8 6" stroke-linecap="round" opacity="0.6">
${cara([[40, 300], [40, 70], [230, 40], [470, 86], [460, 300]], { zavrit: true, rozhod: 1.0 })}
</g>
<g ${TUS}>
${obdelnik(110, 140, 130, 84)}
${cara([[110, 140], [175, 108], [240, 140]], { rozhod: 0.5 })}
${obdelnik(286, 180, 96, 60)}
${cara([[70, 300], [120, 232], [180, 224]], { rozhod: 0.9 })}
${strom(400, 150, 54, 20, 2)}
${strom(436, 268, 44, 16, 2)}
</g>
<g ${KOTA}>
${cara([[486, 66], [486, 28]], { rozhod: 0.3 })}
${cara([[480, 38], [486, 28], [492, 38]], { rozhod: 0.25 })}
</g>
<text x="486" y="84" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--oranz)">S</text>
</svg>`;
}


/* ------------------------------------------- kresba ze skutečného výkresu */
/** Data z `tools/vykres.py` (PDF nebo DXF z Revitu) nakreslí stejnou rukou. */
export function kresbaZDat(data, { trida = "", seed = 3 } = {}) {
  if (!data || !data.sirka) return "";
  zacni(seed);
  const slabe = (data.slabe || []).map((b) => cara(b, { rozhod: 0.45, krok: 24 })).join("");
  const silne = (data.silne || []).map((b) => cara(b, { rozhod: 0.6, krok: 20 })).join("");
  return `<svg class="kresba kresba--vykres ${trida}" viewBox="0 0 ${data.sirka} ${data.vyska}" role="img" aria-label="${(data.popis || "Výkres").replace(/"/g, "&quot;")}">
${slabe ? `<g ${SLABA}>${slabe}</g>` : ""}
<g ${TUS}>${silne}</g>
</svg>`;
}
