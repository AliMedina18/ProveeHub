"use client";
import { avatarFor, stars, countryClass, countryLabel } from "@/lib/ui";
import AttachmentsSection from "./AttachmentsSection";

export default function DetailPanel({
  open,
  provider,
  idx,
  onClose,
  onEdit,
  onDelete,
  adjuntos,
  adjuntosLoading,
  onAddLink,
  onUploadFiles,
  onRemoveAdjunto,
}) {
  return (
    <div
      className={`detail-overlay${open ? " open" : ""}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="detail-panel">
        {provider && (
          <DetailContent
            p={provider}
            idx={idx}
            onClose={onClose}
            onEdit={onEdit}
            onDelete={onDelete}
            adjuntos={adjuntos}
            adjuntosLoading={adjuntosLoading}
            onAddLink={onAddLink}
            onUploadFiles={onUploadFiles}
            onRemoveAdjunto={onRemoveAdjunto}
          />
        )}
      </div>
    </div>
  );
}

function DetailContent({
  p,
  idx,
  onClose,
  onEdit,
  onDelete,
  adjuntos,
  adjuntosLoading,
  onAddLink,
  onUploadFiles,
  onRemoveAdjunto,
}) {
  const av = avatarFor(p.nombre, idx);
  const cc = countryClass(p.codigo_iso);

  async function copyContact(e) {
    const txt = `${p.nombre}\n${p.contacto_nombre || ""}\n${p.telefono || ""}\n${p.email || ""}`;
    try {
      await navigator.clipboard.writeText(txt);
      const btn = e.currentTarget;
      const original = btn.textContent;
      btn.textContent = "✓ Copiado";
      setTimeout(() => (btn.textContent = original), 1500);
    } catch {
      alert("No se pudo copiar al portapapeles");
    }
  }

  return (
    <>
      <div className="detail-head">
        <div className="detail-avatar" style={{ background: av.bg, color: av.text }}>
          {av.init}
        </div>
        <div>
          <div className="detail-name">{p.nombre}</div>
          <div className="detail-cat">{p.categoria}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
            <span className="tag" style={{ background: p.color_bg, color: p.color_fg }}>
              {p.estado}
            </span>
            {p.pais && (
              <span className={`tag ${cc}`}>
                {countryLabel(p.pais, p.bandera_emoji, p.codigo_iso)}
              </span>
            )}
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="detail-body">
        <div className="section-title"><span>Evaluación</span></div>
        <div className="stars-big">{stars(p.score)}</div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>
          {p.score}/5 {p.presupuesto ? "· " + p.presupuesto : ""} {p.cobertura ? "· " + p.cobertura : ""}
        </div>

        <div className="section-title"><span>Ubicación</span></div>
        <div className="kv"><span className="k">País</span><span>{p.pais || "—"}</span></div>
        <div className="kv"><span className="k">Departamento</span><span>{p.region || "—"}</span></div>
        <div className="kv"><span className="k">Ciudad</span><span>{p.ciudad || "—"}</span></div>

        <div className="section-title"><span>Contacto</span></div>
        <div className="kv"><span className="k">Nombre</span><span>{p.contacto_nombre || "—"}</span></div>
        <div className="kv"><span className="k">Teléfono</span><span>{p.telefono || "—"}</span></div>
        <div className="kv"><span className="k">Email</span><span style={{ color: "var(--blue)" }}>{p.email || "—"}</span></div>

        <div className="section-title"><span>Servicios</span></div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {(p.servicios || []).map((s) => (
            <span
              key={s}
              className="tag"
              style={{ background: "var(--gray-light)", color: "var(--text-2)", marginRight: 4, marginBottom: 4 }}
            >
              {s}
            </span>
          ))}
        </div>

        {p.notas && (
          <>
            <div className="section-title"><span>Notas internas</span></div>
            <div className="note-box">{p.notas}</div>
          </>
        )}

        <AttachmentsSection
          adjuntos={adjuntos}
          loading={adjuntosLoading}
          onAddLink={onAddLink}
          onUploadFiles={onUploadFiles}
          onRemove={onRemoveAdjunto}
        />
      </div>
      <div className="detail-actions">
        <button className="btn btn-ghost" onClick={() => onEdit(p)}>✏ Editar</button>
        <button className="btn btn-ghost" onClick={copyContact}>📋 Copiar contacto</button>
        <button className="btn btn-danger" onClick={() => onDelete(p.id)}>🗑 Eliminar</button>
      </div>
    </>
  );
}
