// C-005 — Větvený poptávkový formulář.
// Čistý ES modul bez závislostí a bez DOM. Kroky i odpovědi chodí parametrem.

/**
 * @param {{pole: string, je: Array<*>}|null|undefined} podminka
 * @param {Record<string, *>} odpovedi
 * @returns {boolean}
 */
export function splnuje(podminka, odpovedi) {
  if (podminka == null) return true;
  const hodnota = odpovedi[podminka.pole];
  return Array.isArray(podminka.je) && podminka.je.includes(hodnota);
}

/**
 * @param {Array<object>} kroky
 * @param {Record<string, *>} odpovedi
 * @returns {Array<object>}
 */
export function viditelneKroky(kroky, odpovedi) {
  return kroky.filter((krok) => splnuje(krok.podminka, odpovedi));
}

/**
 * @param {Array<object>} kroky
 * @param {Record<string, *>} odpovedi
 * @param {string|null} aktualniId
 * @returns {string|null}
 */
export function dalsi(kroky, odpovedi, aktualniId) {
  const viditelne = viditelneKroky(kroky, odpovedi);
  const index = viditelne.findIndex((krok) => krok.id === aktualniId);
  if (index === -1) {
    return viditelne.length ? viditelne[0].id : null;
  }
  const dalsiKrok = viditelne[index + 1];
  return dalsiKrok ? dalsiKrok.id : null;
}

/**
 * @param {Array<object>} kroky
 * @param {Record<string, *>} odpovedi
 * @param {string|null} aktualniId
 * @returns {string|null}
 */
export function predchozi(kroky, odpovedi, aktualniId) {
  const viditelne = viditelneKroky(kroky, odpovedi);
  const index = viditelne.findIndex((krok) => krok.id === aktualniId);
  if (index <= 0) return null;
  return viditelne[index - 1].id;
}

/**
 * Je hodnota „bez odpovědi"? undefined, null, prázdný/whitespace řetězec, prázdné pole.
 * @param {*} hodnota
 * @returns {boolean}
 */
function jeBezOdpovedi(hodnota) {
  if (hodnota === undefined || hodnota === null) return true;
  if (typeof hodnota === "string") return hodnota.trim() === "";
  if (Array.isArray(hodnota)) return hodnota.length === 0;
  return false;
}

/**
 * @param {Array<object>} kroky
 * @param {Record<string, *>} odpovedi
 * @returns {Array<string>}
 */
export function chybejici(kroky, odpovedi) {
  return viditelneKroky(kroky, odpovedi)
    .filter((krok) => krok.povinny === true && jeBezOdpovedi(odpovedi[krok.id]))
    .map((krok) => krok.id);
}

/**
 * @param {Array<object>} kroky
 * @param {Record<string, *>} odpovedi
 * @returns {boolean}
 */
export function hotovo(kroky, odpovedi) {
  return chybejici(kroky, odpovedi).length === 0;
}

/**
 * @param {Array<object>} kroky
 * @param {Record<string, *>} odpovedi
 * @returns {Array<{id: string, otazka: string, odpoved: *}>}
 */
export function shrnuti(kroky, odpovedi) {
  return viditelneKroky(kroky, odpovedi)
    .filter((krok) => !jeBezOdpovedi(odpovedi[krok.id]))
    .map((krok) => {
      const hodnota = odpovedi[krok.id];
      let odpoved = hodnota;
      if (krok.typ === "volba") {
        const moznost = (krok.moznosti || []).find((m) => m.id === hodnota);
        odpoved = moznost ? moznost.popis : hodnota;
      } else if (krok.typ === "soubory") {
        odpoved = Array.isArray(hodnota) ? hodnota.length : Number(hodnota) || 0;
      }
      return { id: krok.id, otazka: krok.otazka, odpoved };
    });
}

/**
 * @param {Array<object>} kroky
 * @param {Record<string, *>} odpovedi
 * @param {string|null} aktualniId
 * @returns {{index: number, celkem: number}}
 */
export function postup(kroky, odpovedi, aktualniId) {
  const viditelne = viditelneKroky(kroky, odpovedi);
  const index = viditelne.findIndex((krok) => krok.id === aktualniId);
  return { index: index === -1 ? 0 : index + 1, celkem: viditelne.length };
}
