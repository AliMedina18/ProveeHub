"use client";

export default function Header({ subtitle, onExportCSV, onAdd }) {
  return (
    <header>
      <div className="logo">Proveedores <span>XP</span></div>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{subtitle}</div>
      <div className="header-actions">
        <button className="btn btn-ghost" onClick={onExportCSV}>⬇ CSV</button>
        <button className="btn btn-primary" onClick={onAdd}>+ Agregar</button>
      </div>
    </header>
  );
}
