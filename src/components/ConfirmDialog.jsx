"use client";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className={`confirm-overlay${open ? " open" : ""}`}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="confirm-card">
        <div className="confirm-icon">
          <AlertTriangle size={24} strokeWidth={2} />
        </div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-desc">{description}</div>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button className="btn btn-danger-solid" onClick={onConfirm} disabled={busy}>
            {busy ? "Eliminando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
