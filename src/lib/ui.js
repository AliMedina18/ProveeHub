export const AVATAR_COLORS = [
  { bg: "#E1F5EE", text: "#085041" },
  { bg: "#E6F1FB", text: "#0C447C" },
  { bg: "#EEEDFE", text: "#26215C" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#FAECE7", text: "#712B13" },
  { bg: "#FBEAF0", text: "#72243E" },
  { bg: "#EAF3DE", text: "#27500A" },
  { bg: "#F1EFE8", text: "#444441" },
];

export function avatarFor(nombre, idx) {
  const c = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const init = (nombre || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  return { ...c, init };
}

export function countryClass(codigoIso) {
  if (codigoIso === "CO") return "c-co";
  if (codigoIso === "MX") return "c-mx";
  if (codigoIso === "US") return "c-us";
  return "c-other";
}

export function countryLabel(pais, codigoIso) {
  if (!pais) return "";
  return codigoIso || pais;
}

export function isPdfFile(file) {
  if (!file) return false;
  const name = (file.name || "").toLowerCase();
  return file.type === "application/pdf" || name.endsWith(".pdf");
}

export function fmtDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export const PURGE_GRACE_DAYS = 30;

// Un proveedor desactivado se elimina definitivamente a los 30 días de
// `desactivado_en`. Estas funciones calculan esa fecha y cuántos días faltan
// para mostrarlo en la UI (tarjeta, panel de detalle).
export function purgeDate(desactivadoEn, graceDays = PURGE_GRACE_DAYS) {
  if (!desactivadoEn) return null;
  const d = new Date(desactivadoEn);
  d.setDate(d.getDate() + graceDays);
  return d;
}

export function daysUntilPurge(desactivadoEn, graceDays = PURGE_GRACE_DAYS) {
  const target = purgeDate(desactivadoEn, graceDays);
  if (!target) return null;
  const ms = target.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
