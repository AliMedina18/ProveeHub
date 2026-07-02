"use client";
import { FileText, Download, X } from "lucide-react";

export default function PdfPreviewModal({ open, adjunto, onClose }) {
  return (
    <div
      className={`preview-overlay${open ? " open" : ""}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="preview-card">
        <div className="preview-head">
          <FileText size={16} color="var(--red)" />
          <div className="preview-head-name">{adjunto?.nombre || "Documento"}</div>
          {adjunto?.url && (
            <a
              className="btn btn-ghost btn-sm btn-icon"
              href={adjunto.url}
              target="_blank"
              rel="noreferrer"
              title="Descargar"
            >
              <Download size={15} />
            </a>
          )}
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={17} />
          </button>
        </div>
        <div className="preview-frame-wrap">
          {open && adjunto?.url && (
            <iframe className="preview-frame" src={adjunto.url} title={adjunto.nombre} />
          )}
        </div>
      </div>
    </div>
  );
}
