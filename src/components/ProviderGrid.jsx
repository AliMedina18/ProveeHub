"use client";
import ProviderCard from "./ProviderCard";

export default function ProviderGrid({ providers, loading, onOpen }) {
  if (loading) {
    return (
      <div className="provider-grid">
        <div className="skeleton">
          <div className="empty-icon spin">⏳</div>
          <div>Cargando proveedores…</div>
        </div>
      </div>
    );
  }
  if (!providers.length) {
    return (
      <div className="provider-grid">
        <div className="empty">
          <div className="empty-icon">🔍</div>
          <div>Sin resultados con estos filtros</div>
        </div>
      </div>
    );
  }
  return (
    <div className="provider-grid">
      {providers.map((p, idx) => (
        <ProviderCard key={p.id} provider={p} idx={idx} onOpen={onOpen} />
      ))}
    </div>
  );
}
