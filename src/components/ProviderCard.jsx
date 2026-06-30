"use client";
import { avatarFor, stars, countryClass, countryLabel } from "@/lib/ui";

export default function ProviderCard({ provider, idx, onOpen }) {
  const p = provider;
  const av = avatarFor(p.nombre, idx);
  const cc = countryClass(p.codigo_iso);
  const cd = countryLabel(p.pais, p.bandera_emoji, p.codigo_iso);
  const svcs = (p.servicios || []).slice(0, 2);
  const loc = [p.region, p.ciudad].filter(Boolean).join(" · ");

  return (
    <div className="card" onClick={() => onOpen(p.id)}>
      <div className="card-top">
        <div className="avatar" style={{ background: av.bg, color: av.text }}>
          {av.init}
        </div>
        <div className="card-info">
          <div className="card-name">{p.nombre}</div>
          <div className="card-sub">
            {p.categoria}
            {loc ? " · " + loc : ""}
          </div>
        </div>
        <div className="card-score">{stars(p.score)}</div>
      </div>
      <div className="card-tags">
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
        <span>👤 {p.contacto_nombre || "—"}</span>
        <span>📞 {p.telefono || "—"}</span>
        {p.adjuntos_count > 0 ? (
          <span style={{ marginLeft: "auto" }}>📎 {p.adjuntos_count}</span>
        ) : p.notas ? (
          <span style={{ marginLeft: "auto" }}>📝</span>
        ) : null}
      </div>
    </div>
  );
}
