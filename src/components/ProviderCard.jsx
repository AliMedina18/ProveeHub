"use client";
import { MapPin, User, Phone, Paperclip, StickyNote, Clock } from "lucide-react";
import { avatarFor, countryClass, countryLabel, daysUntilPurge } from "@/lib/ui";
import StarRating from "./StarRating";

export default function ProviderCard({ provider, idx, onOpen }) {
  const p = provider;
  const av = avatarFor(p.nombre, idx);
  const cc = countryClass(p.codigo_iso);
  const cd = countryLabel(p.pais, p.codigo_iso);
  const svcs = (p.servicios || []).slice(0, 2);
  const loc = [p.region, p.ciudad].filter(Boolean).join(" · ");
  const isDeactivated = !!p.desactivado_en;
  const daysLeft = isDeactivated ? daysUntilPurge(p.desactivado_en) : null;

  return (
    <div className={`card${isDeactivated ? " card-deactivated" : ""}`} onClick={() => onOpen(p.id)}>
      <div className="card-top">
        <div className="avatar" style={{ background: av.bg, color: av.text }}>
          {av.init}
        </div>
        <div className="card-info">
          <div className="card-name">{p.nombre}</div>
          <div className="card-sub">
            {p.categoria}
            {loc && (
              <>
                <span>·</span>
                <MapPin size={11} />
                {loc}
              </>
            )}
          </div>
        </div>
        <div className="card-score">
          <StarRating score={p.score} size={13} />
        </div>
      </div>
      <div className="card-tags">
        {isDeactivated && (
          <span className="tag tag-pending-delete">
            <Clock size={10} />
            Se elimina en {daysLeft}d
          </span>
        )}
        <span className="tag" style={{ background: p.color_bg, color: p.color_fg }}>
          {p.estado}
        </span>
        {p.pais && <span className={`tag ${cc}`}>{cd}</span>}
        {p.presupuesto && (
          <span className="tag" style={{ background: "var(--gray-light)", color: "var(--text-2)" }}>
            {p.presupuesto}
          </span>
        )}
        {svcs.map((s) => (
          <span key={s} className="tag" style={{ background: "var(--gray-light)", color: "var(--text-2)" }}>
            {s}
          </span>
        ))}
      </div>
      <div className="card-footer">
        <span className="fi">
          <User size={12} />
          {p.contacto_nombre || "—"}
        </span>
        <span className="fi">
          <Phone size={12} />
          {p.telefono || "—"}
        </span>
        {p.adjuntos_count > 0 ? (
          <span className="fi" style={{ marginLeft: "auto" }}>
            <Paperclip size={12} />
            {p.adjuntos_count}
          </span>
        ) : p.notas ? (
          <span className="fi" style={{ marginLeft: "auto" }}>
            <StickyNote size={12} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
