"use client";

export default function StatsRow({ providers }) {
  const total = providers.length;
  const activos = providers.filter((p) => p.estado === "Activo").length;
  const avg = total
    ? (providers.reduce((a, b) => a + (b.score || 0), 0) / total).toFixed(1)
    : "—";
  const paises = [...new Set(providers.map((p) => p.pais).filter(Boolean))];
  const banderas = [
    ...new Set(providers.map((p) => p.bandera_emoji).filter(Boolean)),
  ].join(" ");

  return (
    <div className="stats">
      <div className="stat">
        <div className="stat-n">{total}</div>
        <div className="stat-l">Proveedores totales</div>
      </div>
      <div className="stat">
        <div className="stat-n" style={{ color: "var(--teal-mid)" }}>{activos}</div>
        <div className="stat-l">Activos</div>
      </div>
      <div className="stat">
        <div className="stat-n">{avg}</div>
        <div className="stat-l">Score promedio</div>
      </div>
      <div className="stat">
        <div className="stat-n" style={{ fontSize: 20 }}>{banderas || "🌐"}</div>
        <div className="stat-l">{paises.length} país{paises.length !== 1 ? "es" : ""}</div>
      </div>
    </div>
  );
}
