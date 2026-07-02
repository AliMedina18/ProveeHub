"use client";
import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";

export default function ExportMenu({ count, onExportExcel, onExportPDF }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function pick(fn) {
    setOpen(false);
    fn();
  }

  return (
    <div className="export-menu-wrap" ref={ref}>
      <button className="btn btn-ghost" onClick={() => setOpen((o) => !o)}>
        <Download size={15} />
        <span className="export-btn-label">Exportar</span>
        <ChevronDown size={13} className="export-btn-chevron" />
      </button>
      <div className={`export-menu${open ? " open" : ""}`} role="menu">
        <button className="export-menu-item" onClick={() => pick(onExportExcel)}>
          <span className="icon-badge" style={{ background: "var(--teal-light)", color: "var(--teal)" }}>
            <FileSpreadsheet size={15} />
          </span>
          <span className="export-menu-item-label">
            Excel (.xlsx)
            <small>{count} proveedor{count === 1 ? "" : "es"} visibles</small>
          </span>
        </button>
        <button className="export-menu-item" onClick={() => pick(onExportPDF)}>
          <span className="icon-badge" style={{ background: "var(--red-light)", color: "var(--red)" }}>
            <FileText size={15} />
          </span>
          <span className="export-menu-item-label">
            PDF
            <small>Listo para imprimir</small>
          </span>
        </button>
      </div>
    </div>
  );
}
