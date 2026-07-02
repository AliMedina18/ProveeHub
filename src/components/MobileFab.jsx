"use client";
import { Plus } from "lucide-react";

export default function MobileFab({ onClick }) {
  return (
    <button
      type="button"
      className="mobile-fab"
      onClick={onClick}
      aria-label="Agregar proveedor"
    >
      <Plus size={22} strokeWidth={2.4} />
    </button>
  );
}
