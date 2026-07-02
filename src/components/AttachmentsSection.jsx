"use client";
import { useRef, useState } from "react";
import { sileo } from "sileo";
import { FileText, Link2, Download, ExternalLink, X, UploadCloud, Paperclip, Plus } from "lucide-react";
import { isPdfFile, fmtDate } from "@/lib/ui";
import PdfPreviewModal from "./PdfPreviewModal";

export default function AttachmentsSection({
  adjuntos,
  loading,
  onAddLink,
  onUploadFiles,
  onRemove,
}) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  async function submitLink() {
    if (!linkUrl.trim()) return;
    setBusy(true);
    try {
      await onAddLink(linkUrl.trim(), linkName.trim());
      setLinkUrl("");
      setLinkName("");
    } finally {
      setBusy(false);
    }
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const pdfs = files.filter(isPdfFile);
    const rejected = files.filter((f) => !isPdfFile(f));
    if (rejected.length) {
      sileo.error({
        title: "Solo se permiten archivos PDF",
        description: rejected.map((f) => f.name).join(", "),
      });
    }
    if (!pdfs.length) return;
    setBusy(true);
    try {
      await onUploadFiles(pdfs);
      sileo.success({ title: `${pdfs.length} PDF${pdfs.length > 1 ? "s" : ""} agregado${pdfs.length > 1 ? "s" : ""}` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="section-title">
        <span className="stt-left">
          <Paperclip size={12} />
          Archivos y links
          <span style={{ fontWeight: 400, color: "var(--text-3)", textTransform: "none", letterSpacing: 0 }}>
            ({adjuntos.length})
          </span>
        </span>
      </div>
      {loading ? (
        <div className="attach-empty">Cargando…</div>
      ) : adjuntos.length ? (
        <div className="attach-list">
          {adjuntos.map((a) => (
            <div
              className="attach-item"
              key={a.id}
              onClick={() => (a.tipo === "file" ? setPreview(a) : window.open(a.url, "_blank"))}
            >
              <span className={`attach-thumb${a.tipo === "link" ? " link" : ""}`}>
                {a.tipo === "link" ? <Link2 size={16} /> : <FileText size={16} />}
              </span>
              <div className="attach-item-info">
                <div className="attach-item-name">{a.nombre}</div>
                <div className="attach-item-meta">
                  <span>{a.tipo === "link" ? "Link" : "PDF"}</span>
                  {a.meta && <span>· {a.meta}</span>}
                  {a.creado_en && <span>· {fmtDate(a.creado_en)}</span>}
                </div>
              </div>
              <div className="attach-item-actions">
                {a.tipo === "file" && a.url && (
                  <a
                    className="attach-btn"
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Descargar"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={14} />
                  </a>
                )}
                {a.tipo === "link" && (
                  <button
                    className="attach-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(a.url, "_blank");
                    }}
                    title="Abrir"
                  >
                    <ExternalLink size={14} />
                  </button>
                )}
                <button
                  className="attach-btn del"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(a);
                  }}
                  title="Eliminar"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="attach-empty">Sin archivos ni links adjuntos aún</div>
      )}

      <div className="attach-add-grid">
        <div className="attach-add-card">
          <span className="attach-add-label">
            <Link2 size={12} />
            Agregar link
          </span>
          <div className="attach-link-row">
            <input
              type="text"
              placeholder="Pegar link (Drive, Dropbox, web…)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitLink()}
            />
            <input
              type="text"
              placeholder="Nombre (opcional)"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitLink()}
            />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={submitLink} disabled={busy || !linkUrl.trim()}>
            <Plus size={13} />
            Agregar link
          </button>
        </div>

        <div className="attach-add-card">
          <span className="attach-add-label">
            <FileText size={12} />
            Subir PDF
          </span>
          <div
            className={`attach-zone${dragOver ? " drag-over" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <span className="attach-zone-icon">
              <UploadCloud size={16} />
            </span>
            <span className="attach-zone-text">
              {busy ? "Subiendo…" : "Arrastra o haz clic"}
              <small>Solo PDF</small>
            </span>
          </div>
        </div>
      </div>

      <PdfPreviewModal open={!!preview} adjunto={preview} onClose={() => setPreview(null)} />
    </>
  );
}
