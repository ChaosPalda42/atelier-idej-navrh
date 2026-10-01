// C-004 — Validace poptávky a příloh. Čistý ES modul, bez závislostí a bez DOM.

export const PRIPONY = ["pdf", "jpg", "jpeg", "png", "heic", "webp", "dwg", "dxf", "doc", "docx", "xls", "xlsx"];
export const LIMIT_SOUBOR = 15 * 1024 * 1024;
export const LIMIT_CELKEM = 40 * 1024 * 1024;

export function pripona(nazev) {
  if (typeof nazev !== "string" || nazev === "") return "";
  const i = nazev.lastIndexOf(".");
  if (i <= 0) return "";
  return nazev.slice(i + 1).toLowerCase();
}

export function jeEmail(x) {
  if (typeof x !== "string" || x === "" || x.includes(" ")) return false;
  if (x.split("@").length !== 2) return false;
  const [pred, za] = x.split("@");
  if (pred.length < 1) return false;
  // doména: aspoň jedna tečka, před poslední tečkou aspoň jeden znak,
  // koncovka aspoň dvě písmena
  if (!/^[A-Za-z0-9.-]*[A-Za-z0-9]\.[A-Za-z]{2,}$/.test(za)) return false;
  return true;
}

export function normalizujTelefon(x) {
  if (typeof x !== "string" || x === "") return "";
  return x.replace(/[ ()\-/]/g, "");
}

export function jeTelefon(x) {
  const n = normalizujTelefon(x);
  return /^(?:\d{9}|\+\d{12}|00\d{12})$/.test(n);
}

export function souborChyba(soubor) {
  const nazev = soubor && typeof soubor.nazev === "string" ? soubor.nazev : "";
  const velikost = soubor && typeof soubor.velikost === "number" ? soubor.velikost : 0;
  const p = pripona(nazev);
  if (!PRIPONY.includes(p)) {
    return `Soubor ${nazev} nemůžu přijmout (povolené: ${PRIPONY.join(", ")}).`;
  }
  if (velikost > LIMIT_SOUBOR) {
    return `Soubor ${nazev} je větší než 15 MB.`;
  }
  return null;
}

export function souboryChyby(soubory) {
  if (!Array.isArray(soubory)) return [];
  const chyby = [];
  let celkem = 0;
  for (const s of soubory) {
    const c = souborChyba(s);
    if (c) chyby.push(c);
    if (s && typeof s.velikost === "number") celkem += s.velikost;
  }
  if (celkem > LIMIT_CELKEM) {
    chyby.push("Přílohy dohromady přesahují 40 MB.");
  }
  return chyby;
}

export function zkontroluj(data) {
  const d = data && typeof data === "object" ? data : {};
  const chyby = {};

  const jmeno = typeof d.jmeno === "string" ? d.jmeno.trim() : "";
  if (jmeno.length < 2) chyby.jmeno = "Napište prosím jméno.";

  const email = typeof d.email === "string" ? d.email : "";
  const telefon = typeof d.telefon === "string" ? d.telefon : "";
  if (email.trim() === "" && telefon.trim() === "") {
    chyby.email = "Nechte na sebe e-mail nebo telefon.";
  } else {
    if (email.trim() !== "" && !jeEmail(email)) chyby.email = "Zkontrolujte e-mail.";
    if (telefon.trim() !== "" && !jeTelefon(telefon)) chyby.telefon = "Zkontrolujte telefon.";
  }

  const zprava = typeof d.zprava === "string" ? d.zprava.trim() : "";
  if (zprava.length < 10) chyby.zprava = "Napište pár vět o tom, co řešíte.";

  if (d.souhlas !== true) chyby.souhlas = "Bez souhlasu se zpracováním to nemůžu odeslat.";

  const souboryChybyList = souboryChyby(d.soubory);
  if (souboryChybyList.length > 0) chyby.soubory = souboryChybyList.join(" ");

  return { platny: Object.keys(chyby).length === 0, chyby };
}
