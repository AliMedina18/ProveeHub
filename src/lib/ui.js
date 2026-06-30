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

export function stars(n) {
  const s = Number(n) || 0;
  return "★".repeat(s) + "☆".repeat(5 - s);
}

export function countryClass(codigoIso) {
  if (codigoIso === "CO") return "c-co";
  if (codigoIso === "MX") return "c-mx";
  if (codigoIso === "US") return "c-us";
  return "c-other";
}

export function countryLabel(pais, bandera, codigoIso) {
  if (!pais) return "?";
  return `${bandera || "🌐"} ${codigoIso || pais}`;
}

const FILE_ICONS = {
  pdf: "📄",
  doc: "📝",
  docx: "📝",
  xls: "📊",
  xlsx: "📊",
  ppt: "📋",
  pptx: "📋",
  jpg: "🖼",
  jpeg: "🖼",
  png: "🖼",
  gif: "🖼",
  mp4: "🎬",
  mov: "🎬",
  mp3: "🎵",
  zip: "🗜",
  rar: "🗜",
};

export function fileIcon(name, tipo) {
  if (tipo === "link") return "🔗";
  const ext = (name || "").split(".").pop().toLowerCase();
  return FILE_ICONS[ext] || "📎";
}
