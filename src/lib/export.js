const EXPORT_COLUMNS = [
  ["nombre", "Empresa"],
  ["categoria", "Categoría"],
  ["estado", "Estado"],
  ["pais", "País"],
  ["region", "Departamento / Estado"],
  ["ciudad", "Ciudad"],
  ["contacto_nombre", "Contacto"],
  ["telefono", "Teléfono"],
  ["email", "Email"],
  ["score", "Score"],
  ["presupuesto", "Presupuesto"],
  ["cobertura", "Cobertura"],
  ["notas", "Notas"],
];

function serviciosTexto(p) {
  return (p.servicios || []).join(", ");
}

function rowValue(p, key) {
  if (key === "servicios") return serviciosTexto(p);
  return p[key] ?? "";
}

export async function exportExcel(providers, filename = "proveedores.xlsx") {
  const XLSX = await import("xlsx");
  const rows = providers.map((p) =>
    Object.fromEntries(EXPORT_COLUMNS.map(([key, label]) => [label, rowValue(p, key)]))
  );
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = EXPORT_COLUMNS.map(([, label]) => ({ wch: Math.max(label.length + 3, 16) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Proveedores");
  XLSX.writeFile(wb, filename);
}

export async function exportPDF(providers, filename = "proveedores.pdf") {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(28, 27, 23);
  doc.text("Proveedores XP", 32, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 116, 105);
  const fecha = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(`Generado el ${fecha} · ${providers.length} proveedor${providers.length === 1 ? "" : "es"}`, 32, 50);

  autoTable(doc, {
    startY: 62,
    margin: { left: 32, right: 32 },
    head: [EXPORT_COLUMNS.map(([, label]) => label)],
    body: providers.map((p) => EXPORT_COLUMNS.map(([key]) => String(rowValue(p, key)))),
    styles: { fontSize: 7.5, cellPadding: 5, textColor: [28, 27, 23], lineColor: [230, 227, 218] },
    headStyles: { fillColor: [15, 110, 86], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 246, 243] },
    theme: "grid",
  });

  doc.save(filename);
}
