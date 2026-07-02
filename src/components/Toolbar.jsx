"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X, ChevronDown, SlidersHorizontal, Check } from "lucide-react";

const RATING_LABELS = { 4: "4+ estrellas", 3: "3+ estrellas" };

function FilterSelect({ value, placeholder, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((option) => option.value === value);
  const label = selected?.label || placeholder;
  const allOptions = [{ value: "", label: placeholder }, ...options];

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function pick(nextValue) {
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div className="filter-select" ref={ref}>
      <button
        type="button"
        className={`filter-select-trigger${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{label}</span>
        <ChevronDown size={14} className="filter-select-chevron" />
      </button>
      <div className={`filter-select-menu${open ? " open" : ""}`} role="listbox">
        {allOptions.map((option) => {
          const active = option.value === value;
          return (
            <button
              type="button"
              key={`${placeholder}-${option.value || "all"}`}
              className={`filter-select-option${active ? " active" : ""}`}
              onClick={() => pick(option.value)}
              role="option"
              aria-selected={active}
            >
              <span>{option.label}</span>
              {active && <Check size={14} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

  function clearOne(field) {
    update(field, "");
  }

  function clearAll() {
    setFilters({ search: "", pais: "", region: "", categoria: "", estado: "", rating: "" });
  }

  const activeChips = [
    filters.pais && { field: "pais", label: filters.pais },
    filters.region && { field: "region", label: filters.region },
    filters.categoria && { field: "categoria", label: filters.categoria },
    filters.estado && { field: "estado", label: filters.estado },
    filters.rating && { field: "rating", label: RATING_LABELS[filters.rating] },
  ].filter(Boolean);

  const paisOptions = paisesDisponibles.map((p) => ({ value: p, label: p }));
  const regionOptions = regionesDisponibles.map((r) => ({ value: r, label: r }));
  const categoriaOptions = categoriasDisponibles.map((c) => ({ value: c, label: c }));
  const estadoOptions = estadosDisponibles.map((s) => ({ value: s, label: s }));
  const ratingOptions = [
    { value: "4", label: "4+ estrellas" },
    { value: "3", label: "3+ estrellas" },
  ];

  return (
    <div className="toolbar-card">
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar proveedor, servicio, ciudad…"
            value={filters.search}
            onChange={(e) => update("search", e.target.value)}
          />
          {filters.search && (
            <button className="search-clear" onClick={() => update("search", "")} aria-label="Limpiar búsqueda">
              <X size={13} />
            </button>
          )}
        </div>

        <FilterSelect value={filters.pais} placeholder="Todos los países" options={paisOptions} onChange={(v) => update("pais", v)} />
        <FilterSelect value={filters.region} placeholder="Departamento / estado" options={regionOptions} onChange={(v) => update("region", v)} />
        <FilterSelect value={filters.categoria} placeholder="Todas las categorías" options={categoriaOptions} onChange={(v) => update("categoria", v)} />
        <FilterSelect value={filters.estado} placeholder="Todos los estados" options={estadoOptions} onChange={(v) => update("estado", v)} />
        <FilterSelect value={filters.rating} placeholder="Cualquier score" options={ratingOptions} onChange={(v) => update("rating", v)} />

        {activeChips.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>
            <SlidersHorizontal size={13} />
            Limpiar filtros
          </button>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="filter-chips">
          {activeChips.map((chip) => (
            <span className="filter-chip" key={chip.field}>
              {chip.label}
              <button onClick={() => clearOne(chip.field)} aria-label={`Quitar filtro ${chip.label}`}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
