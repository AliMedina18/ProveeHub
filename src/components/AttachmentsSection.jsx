"use client";
import { useRef, useState } from "react";
import { fileIcon } from "@/lib/ui";

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
    setBusy(true);
    try {
      await onUploadFiles(files);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="section-title">
        <span>
          📎 Archivos y links{" "}
          <span style={{ fontWeight: 400, color: "var(--text-3)" }}>
            ({adjuntos.length})
          </span>
        </span>
      </div>
      <div className="attach-list">
        {loading ? (
          <div className="attach-empty">Cargando…</div>
        ) : adjuntos.length ? (
          adjuntos.map((a) => (
            <div className="attach-item" key={a.id}>
              <span className="attach-item-icon">{fileIcon(a.nombre, a.tipo)}</span>
              <div className="attach-item-info">
                {a.tipo === "link" ? (
                  <a
                    className="attach-item-name"
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--blue)", textDecoration: "none" }}
                  >
                    {a.nombre}
                  </a>
                ) : (
                  <div className="attach-item-name">{a.nombre}</div>
                )}
                <div className="attach-item-meta">
                  {a.meta || ""} {a.creado_en ? "· " + a.creado_en.slice(0, 10) : ""}
                </div>
              </div>
              <div className="attach-item-actions">
                {a.tipo === "file" && a.url && (
                  <a className="attach-btn" href={a.url} target="_blank" rel="noreferrer" title="Abrir/Descargar">
                    ⬇
                  </a>
                )}
                {a.tipo === "link" && (
                  <button className="attach-btn" onClick={() => window.open(a.url, "_blank")}>
                    ↗
                  </button>
                )}
                <button className="attach-btn del" onClick={() => onRemove(a)}>✕</button>
              </div>
            </div>
          ))
        ) : (
          <div className="attach-empty">Sin archivos adjuntos aún</div>
        )}
      </div>
      <div style={{ marginTop: 10 }}>
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
            placeholder="Nombre"
            style={{ maxWidth: 130 }}
            value={linkName}
            onChange={(e) => setLinkName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitLink()}
          />
          <button className="btn btn-ghost btn-sm" onClick={submitLink} disabled={busy}>
            + Link
          </button>
        </div>
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
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <span className="attach-zone-icon">☁</span>
          <span className="attach-zone-text">
            {busy ? "Subiendo…" : "Arrastra archivos aquí o haz clic"}
            <br />
            <span style={{ fontSize: 11 }}>PDF, Word, Excel, imágenes, videos…</span>
          </span>
        </div>
      </div>
    </>
  );
}
