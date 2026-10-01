// Práce ateliéru — řazení, filtr, sousedé, slug.
// Čistý ES modul bez závislostí a bez DOM.

export function slug(nazev) {
  if (typeof nazev !== "string") return "";
  return (
    nazev
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

export function serad(prace) {
  return [...prace].sort((a, b) => {
    if (b.rok !== a.rok) return b.rok - a.rok;
    return a.nazev.localeCompare(b.nazev, "cs");
  });
}

export function filtr(prace, typ) {
  if (!typ || typ === "vse") return [...prace];
  return prace.filter((p) => p.typ === typ);
}

export function podleSlugu(prace, slug) {
  return prace.find((p) => p.slug === slug) ?? null;
}

export function sousedi(prace, slug) {
  const nic = { predchozi: null, dalsi: null };
  if (!Array.isArray(prace) || prace.length < 2) return nic;
  const i = prace.findIndex((p) => p.slug === slug);
  if (i === -1) return nic;
  return {
    predchozi: prace[(i - 1 + prace.length) % prace.length],
    dalsi: prace[(i + 1) % prace.length],
  };
}

export function pocty(prace) {
  const res = { vse: prace.length };
  for (const p of prace) {
    if (p.typ == null) continue;
    res[p.typ] = (res[p.typ] ?? 0) + 1;
  }
  return res;
}
