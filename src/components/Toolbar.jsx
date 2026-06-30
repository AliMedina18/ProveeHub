"use client";

export default function Toolbar({
  filters,
  setFilters,
  paisesDisponibles,
  regionesDisponibles,
  categoriasDisponibles,
  estadosDisponibles,
}) {
  function update(field, value) {
    setFilters((f) => {
      const next = { ...f, [field]: value };
      if (field === "pais") next.region = "";
      return next;
    });
  }

  return (
    <div className="toolbar">
      <div className="search-wrap">
        <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          placeholder="Buscar proveedor, servicio, ciudad…"
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
        />
      </div>
      <select value={filters.pais} onChange={(e) => update("pais", e.target.value)}>
        <option value="">Todos los países</option>
        {paisesDisponibles.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <select value={filters.region} onChange={(e) => update("region", e.target.value)}>
        <option value="">Todos los departamentos/estados</option>
        {regionesDisponibles.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <select value={filters.categoria} onChange={(e) => update("categoria", e.target.value)}>
        <option value="">Todas las categorías</option>
        {categoriasDisponibles.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select value={filters.estado} onChange={(e) => update("estado", e.target.value)}>
        <option value="">Todos los estados</option>
        {estadosDisponibles.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select value={filters.rating} onChange={(e) => update("rating", e.target.value)}>
        <option value="">Cualquier score</option>
        <option value="4">4+ ★</option>
        <option value="3">3+ ★</option>
      </select>
    </div>
  );
}
