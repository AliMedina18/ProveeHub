"use client";
import { Users, CheckCircle2, Star, Globe2 } from "lucide-react";

export default function StatsRow({ providers }) {
  const total = providers.length;
  const activos = providers.filter((p) => p.estado === "Activo").length;
  const avg = total
    ? (providers.reduce((a, b) => a + (b.score || 0), 0) / total).toFixed(1)
    : "—";
  const paises = [...new Set(providers.map((p) => p.pais).filter(Boolean))];

  return (
    <div className="stats">
      <div className="stat">
        <span className="stat-icon" style={{ background: "var(--teal-light)", color: "var(--teal)" }}>
          <Users size={17} />
        </span>
        <div>
          <div className="stat-n">{total}</div>
          <div className="stat-l">Proveedores totales</div>
        </div>
      </div>
      <div className="stat">
        <span className="stat-icon" style={{ background: "var(--teal-light)", color: "var(--teal-mid)" }}>
          <CheckCircle2 size={17} />
        </span>
        <div>
          <div className="stat-n">{activos}</div>
          <div className="stat-l">Activos</div>
        </div>
      </div>
      <div className="stat">
        <span
          className="stat-icon"
          style={{ background: "color-mix(in srgb, var(--amber-star) 18%, transparent)", color: "var(--amber-star)" }}
        >
          <Star size={17} />
        </span>
        <div>
          <div className="stat-n">{avg}</div>
          <div className="stat-l">Score promedio</div>
        </div>
      </div>
      <div className="stat">
        <span className="stat-icon" style={{ background: "var(--blue-light)", color: "var(--blue)" }}>
          <Globe2 size={17} />
        </span>
        <div>
          <div className="stat-n">{paises.length}</div>
          <div className="stat-l">País{paises.length !== 1 ? "es" : ""} cubiertos</div>
        </div>
      </div>
    </div>
  );
}
