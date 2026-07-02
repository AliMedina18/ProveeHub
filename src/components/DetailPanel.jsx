"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { sileo } from "sileo";
import {
  X,
  Pencil,
  Copy,
  Check,
  Archive,
  ArchiveRestore,
  Clock,
  Star,
  MapPin,
  User,
  Phone,
  Mail,
  Layers,
  StickyNote,
} from "lucide-react";
import { avatarFor, countryClass, countryLabel, daysUntilPurge, fmtDate, purgeDate } from "@/lib/ui";
import StarRating from "./StarRating";
import AttachmentsSection from "./AttachmentsSection";
import ConfirmDialog from "./ConfirmDialog";

export default function DetailPanel({
  open,
  provider,
  idx,
  onClose,
  onEdit,
  onDeactivate,
  onReactivate,
  onUpdateScore,
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
            onDeactivate={onDeactivate}
            onReactivate={onReactivate}
            onUpdateScore={onUpdateScore}
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
  onDeactivate,
  onReactivate,
  onUpdateScore,
  adjuntos,
  adjuntosLoading,
  onAddLink,
  onUploadFiles,
  onRemoveAdjunto,
}) {
  const av = avatarFor(p.nombre, idx);
  const cc = countryClass(p.codigo_iso);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [scoreBusy, setScoreBusy] = useState(false);

  const isDeactivated = !!p.desactivado_en;
  const daysLeft = isDeactivated ? daysUntilPurge(p.desactivado_en) : null;
  const purgeAt = isDeactivated ? purgeDate(p.desactivado_en) : null;

  async function rateScore(n) {
    if (n === p.score || scoreBusy) return;
    setScoreBusy(true);
    try {
      await onUpdateScore(p.id, n);
    } finally {
      setScoreBusy(false);
    }
  }

  async function copyContact() {
    const txt = `${p.nombre}\n${p.contacto_nombre || ""}\n${p.telefono || ""}\n${p.email || ""}`;
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      sileo.error({ title: "No se pudo copiar", description: "El portapapeles no está disponible." });
    }
  }

  async function confirmDeactivate() {
    setDeactivating(true);
    try {
      await onDeactivate(p.id);
    } finally {
      setDeactivating(false);
      setConfirmOpen(false);
    }
  }

  async function handleReactivate() {
    setReactivating(true);
    try {
      await onReactivate(p.id);
    } finally {
      setReactivating(false);
    }
  }

  return (
    <>
      <div className="detail-head">
        <div className="detail-avatar" style={{ background: av.bg, color: av.text }}>
          {av.init}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="detail-name">{p.nombre}</div>
          <div className="detail-cat">{p.categoria}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
            <span className="tag" style={{ background: p.color_bg, color: p.color_fg }}>
              {p.estado}
            </span>
            {p.pais && (
              <span className={`tag ${cc}`}>
                <MapPin size={10} />
                {countryLabel(p.pais, p.codigo_iso)}
              </span>
            )}
          </div>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
      </div>
      <div className="detail-body">
        {isDeactivated && (
          <div className="deactivated-banner">
            <span className="deactivated-banner-icon">
              <Clock size={16} />
            </span>
            <div className="deactivated-banner-text">
              <strong>Proveedor desactivado</strong>
              <span>
                Se eliminará definitivamente el {fmtDate(purgeAt)}
                {daysLeft !== null && ` (en ${daysLeft} día${daysLeft === 1 ? "" : "s"})`} si nadie lo reactiva.
              </span>
            </div>
            <button
              className="btn btn-primary btn-sm deactivated-banner-btn"
              onClick={handleReactivate}
              disabled={reactivating}
            >
              <ArchiveRestore size={13} />
              {reactivating ? "Reactivando…" : "Reactivar"}
            </button>
          </div>
        )}

        <div className="section-title">
          <span className="stt-left">
            <Star size={12} />
            Evaluación
          </span>
        </div>
        <div className="eval-card">
          <div>
            <StarRating
              score={p.score}
              size={22}
              interactive
              busy={scoreBusy}
              onRate={rateScore}
            />
            <div className="eval-card-hint">Toca una estrella para calificar</div>
          </div>
          {(p.presupuesto || p.cobertura) && (
            <div className="eval-meta">
              <div className="eval-meta-tags">
                {p.presupuesto && (
                  <span className="tag" style={{ background: "var(--surface)", color: "var(--text-2)" }}>
                    {p.presupuesto}
                  </span>
                )}
                {p.cobertura && (
                  <span className="tag" style={{ background: "var(--surface)", color: "var(--text-2)" }}>
                    {p.cobertura}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="section-title">
          <span className="stt-left">
            <MapPin size={12} />
            Ubicación
          </span>
        </div>
        <div className="kv"><span className="k">País</span><span>{p.pais || "—"}</span></div>
        <div className="kv"><span className="k">Departamento</span><span>{p.region || "—"}</span></div>
        <div className="kv"><span className="k">Ciudad</span><span>{p.ciudad || "—"}</span></div>

        <div className="section-title">
          <span className="stt-left">
            <User size={12} />
            Contacto
          </span>
        </div>
        <div className="kv"><span className="k"><User size={12} />Nombre</span><span>{p.contacto_nombre || "—"}</span></div>
        <div className="kv"><span className="k"><Phone size={12} />Teléfono</span><span>{p.telefono || "—"}</span></div>
        <div className="kv"><span className="k"><Mail size={12} />Email</span><span style={{ color: "var(--blue)" }}>{p.email || "—"}</span></div>

        <div className="section-title">
          <span className="stt-left">
            <Layers size={12} />
            Servicios
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {(p.servicios || []).length ? (
            p.servicios.map((s) => (
              <span key={s} className="tag" style={{ background: "var(--gray-light)", color: "var(--text-2)" }}>
                {s}
              </span>
            ))
          ) : (
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>Sin servicios registrados</span>
          )}
        </div>

        {p.notas && (
          <>
            <div className="section-title">
              <span className="stt-left">
                <StickyNote size={12} />
                Notas internas
              </span>
            </div>
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
        <div className="detail-actions-group">
          <button className="btn btn-ghost" onClick={() => onEdit(p)}>
            <Pencil size={14} />
            Editar
          </button>
          <button className="btn btn-ghost" onClick={copyContact}>
            {copied ? <Check size={14} color="var(--teal-mid)" /> : <Copy size={14} />}
            {copied ? "Copiado" : "Copiar contacto"}
          </button>
        </div>
        <span className="spacer" />
        {isDeactivated ? (
          <button className="btn btn-ghost" onClick={handleReactivate} disabled={reactivating}>
            <ArchiveRestore size={14} />
            {reactivating ? "Reactivando…" : "Reactivar"}
          </button>
        ) : (
          <button className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
            <Archive size={14} />
            Desactivar
          </button>
        )}
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <ConfirmDialog
            open={confirmOpen}
            title={`¿Desactivar a ${p.nombre}?`}
            description="Se marcará como inactivo y se eliminará definitivamente en 30 días si nadie lo reactiva antes. Puedes reactivarlo en cualquier momento desde este panel o editándolo."
            confirmLabel="Desactivar proveedor"
            busy={deactivating}
            onConfirm={confirmDeactivate}
            onCancel={() => setConfirmOpen(false)}
          />,
          document.body
        )}
    </>
  );
}
