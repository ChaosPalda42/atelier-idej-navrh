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

/* --------------------------------------------------------------- služby */

/* ------------------------------------------- zástupná skica místo fotky */
/** Dokud nejsou fotky od klienta, kreslí se místo nich hmotová skica. */

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

/* ----------------------------------------------- další kresby ke službám */

/* ------------------------------------------------- nářadí na rýsovacím prkně */
/* Tužky, pravítko, kružítko a guma odložené po listech. Kreslí se stejnou
   rukou jako výkresy na pozadí, jen o něco zřetelněji — neleží pod papírem
   jako vodoznak, leží na něm. Každý kus má svislou osu nahoru; natočení
   a umístění dělá CSS, aby se daly přehazovat bez překreslování. */

/** Tužka. `delka` je celá délka i s tuhou a gumou. */
export function kresbaTuzka(delka = 180, { seed = 21, guma = true } = {}) {
  zacni(seed);
  const s = 13;                       // šířka těla
  const hrot = 22;                    // kuželová špička
  const objimka = guma ? 16 : 0;      // kovová objímka
  const konec = delka - objimka - (guma ? 12 : 0);
  const kusy = [
    // tělo
    cara([[-s / 2, hrot], [-s / 2, konec]], { rozhod: 0.4 }),
    cara([[s / 2, hrot], [s / 2, konec]], { rozhod: 0.4 }),
    // hrana šestihranu, aby to nebyla jen trubka
    cara([[0, hrot + 4], [0, konec - 4]], { rozhod: 0.5 }),
    // ořezaná špička a tuha
    cara([[-s / 2, hrot], [0, 0], [s / 2, hrot]], { rozhod: 0.35, krok: 10 }),
    cara([[-s / 6, hrot * 0.3], [0, 0], [s / 6, hrot * 0.3]], { rozhod: 0.25, krok: 8 }),
    cara([[-s / 2 + 1.5, hrot], [s / 2 - 1.5, hrot]], { rozhod: 0.3 }),
  ];
  if (guma) {
    kusy.push(
      cara([[-s / 2, konec], [s / 2, konec]], { rozhod: 0.3 }),
      cara([[-s / 2, konec + objimka], [s / 2, konec + objimka]], { rozhod: 0.3 }),
      cara([[-s / 2, konec], [-s / 2, delka - 6]], { rozhod: 0.4 }),
      cara([[s / 2, konec], [s / 2, delka - 6]], { rozhod: 0.4 }),
      // kroužky na objímce
      cara([[-s / 2, konec + 5], [s / 2, konec + 5]], { rozhod: 0.25 }),
      cara([[-s / 2, konec + 10], [s / 2, konec + 10]], { rozhod: 0.25 }),
      // zakulacená guma
      cara([[-s / 2, delka - 6], [-s / 2 + 1, delka - 2], [0, delka], [s / 2 - 1, delka - 2], [s / 2, delka - 6]],
           { rozhod: 0.3, krok: 8 }),
    );
  } else {
    kusy.push(cara([[-s / 2, konec], [s / 2, konec]], { rozhod: 0.3 }));
  }
  return `<svg class="naradi-kresba" viewBox="${-s} -6 ${s * 2} ${delka + 14}" role="img" aria-label="Tužka">
<g ${TUS}>${kusy.join("")}</g></svg>`;
}

/** Pravítko s dělením. */
export function kresbaPravitko(delka = 300, { seed = 22 } = {}) {
  zacni(seed);
  const v = 34;
  const kusy = [obdelnik(0, 0, delka, v)];
  const krok = delka / 30;
  for (let i = 0; i <= 30; i++) {
    const dlouha = i % 5 === 0;
    kusy.push(cara([[i * krok, 0], [i * krok, dlouha ? 13 : 7]], { rozhod: 0.18, krok: 6 }));
  }
  // zkosená hrana, po které se rýsuje
  kusy.push(cara([[2, v - 7], [delka - 2, v - 7]], { rozhod: 0.3 }));
  return `<svg class="naradi-kresba" viewBox="-4 -4 ${delka + 8} ${v + 8}" role="img" aria-label="Pravítko">
<g ${TUS}>${kusy.join("")}</g>
<g fill="currentColor" font-family="var(--mono)" font-size="7" letter-spacing="0.4" opacity="0.8">
${[0, 10, 20, 30].map((i) => `<text x="${i * krok + 2}" y="22">${i}</text>`).join("")}
</g></svg>`;
}

/** Kružítko rozevřené na poloměr. Ramena jsou plochá, ne čáry — teprve
    tloušťka z toho udělá nástroj a ne dvě čárky do špičky. */
export function kresbaKruzitko(vyska = 190, { seed = 23 } = {}) {
  zacni(seed);
  const r = 46;                 // rozevření
  const dno = vyska - 16;
  const kusy = [
    // hlavice, za kterou se kružítko drží
    cara([[-4, -2], [-4, 9]], { rozhod: 0.3 }),
    cara([[4, -2], [4, 9]], { rozhod: 0.3 }),
    cara([[-4, -2], [0, -8], [4, -2]], { rozhod: 0.3, krok: 8 }),
    cara([[-4, 2], [4, 2]], { rozhod: 0.2 }),
    cara([[-4, 5], [4, 5]], { rozhod: 0.2 }),
    // rameno s jehlou
    cara([[-4, 10], [-r, dno], [-r + 7, dno], [2, 12]], { zavrit: true, rozhod: 0.45, krok: 16 }),
    // rameno s tuhou
    cara([[4, 10], [r, dno], [r - 7, dno], [-2, 12]], { zavrit: true, rozhod: 0.45, krok: 16 }),
    // kloub
    cara(oblouk(0, 11, 7, 0, 360, 12), { zavrit: true, rozhod: 0.35, krok: 7 }),
    // jehla
    cara([[-r + 3.5, dno], [-r + 1, vyska]], { rozhod: 0.2, krok: 7 }),
    cara([[-r - 1, dno + 3], [-r + 8, dno + 3]], { rozhod: 0.25 }),
    // držák tuhy a tuha
    obdelnik(r - 8, dno, 9, 9),
    cara([[r - 3.5, dno + 9], [r - 2, vyska]], { rozhod: 0.2, krok: 7 }),
  ];
  return `<svg class="naradi-kresba" viewBox="${-r - 10} -14 ${r * 2 + 20} ${vyska + 24}" role="img" aria-label="Kružítko">
<g ${TUS}>${kusy.join("")}</g></svg>`;
}

/** Guma — kvádr v lehké perspektivě, jinak je to jen obdélník. */
export function kresbaGuma(sirka = 74, { seed = 24 } = {}) {
  zacni(seed);
  const v = 34, h = 11;        // výška čelní stěny a hloubka horní
  const kusy = [
    // čelo
    cara([[0, h], [sirka, h], [sirka, v + h], [0, v + h]], { zavrit: true, rozhod: 0.4, krok: 14 }),
    // horní plocha
    cara([[0, h], [h, 0], [sirka + h, 0], [sirka, h]], { zavrit: true, rozhod: 0.4, krok: 14 }),
    // bok
    cara([[sirka, h], [sirka + h, 0], [sirka + h, v], [sirka, v + h]], { zavrit: true, rozhod: 0.4, krok: 14 }),
    // papírová manžeta
    cara([[sirka * 0.26, h], [sirka * 0.26, v + h]], { rozhod: 0.3 }),
    cara([[sirka * 0.62, h], [sirka * 0.62, v + h]], { rozhod: 0.3 }),
    cara([[sirka * 0.26 + h, 0], [sirka * 0.26, h]], { rozhod: 0.25 }),
    cara([[sirka * 0.62 + h, 0], [sirka * 0.62, h]], { rozhod: 0.25 }),
    cara([[sirka * 0.32, h + 11], [sirka * 0.56, h + 11]], { rozhod: 0.3 }),
    cara([[sirka * 0.32, h + 18], [sirka * 0.52, h + 18]], { rozhod: 0.3 }),
  ];
  return `<svg class="naradi-kresba" viewBox="-5 -5 ${sirka + h + 10} ${v + h + 10}" role="img" aria-label="Guma">
<g ${TUS}>${kusy.join("")}</g></svg>`;
}

/** Trojúhelník s úhloměrem. */
export function kresbaTrojuhelnik(odvesna = 170, { seed = 25 } = {}) {
  zacni(seed);
  const o = odvesna;
  const kusy = [
    cara([[0, o], [o, o], [0, 0]], { zavrit: true, rozhod: 0.5, krok: 18 }),
    // vnitřní výřez
    cara([[16, o - 14], [o - 26, o - 14], [16, 22]], { zavrit: true, rozhod: 0.45, krok: 16 }),
  ];
  const krok = (o - 30) / 10;
  for (let i = 0; i <= 10; i++) {
    kusy.push(cara([[14 + i * krok, o], [14 + i * krok, o - (i % 5 === 0 ? 10 : 5)]], { rozhod: 0.18, krok: 6 }));
  }
  return `<svg class="naradi-kresba" viewBox="-6 -6 ${o + 12} ${o + 12}" role="img" aria-label="Trojúhelník">
<g ${TUS}>${kusy.join("")}</g></svg>`;
}

/** Nářadí odložené na listu — `kde` je dvojice CSS vlastností. */
export function naradi(co, { kde = "", natoceni = "0deg", sirka = "120px", trida = "" } = {}) {
  return `<div class="naradi ${trida}" aria-hidden="true"
 style="${kde};--natoceni:${natoceni};--sirka:${sirka}">${co}</div>`;
}
