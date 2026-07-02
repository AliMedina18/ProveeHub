"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageList(current, total) {
  const pages = [];
  const add = (p) => pages.push(p);
  const window = 1;
  add(1);
  if (current - window > 2) add("…");
  for (let p = Math.max(2, current - window); p <= Math.min(total - 1, current + window); p++) {
    add(p);
  }
  if (current + window < total - 1) add("…");
  if (total > 1) add(total);
  return pages;
}

export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="pagination">
      <div className="pagination-info">
        Mostrando <strong>{start}–{end}</strong> de <strong>{total}</strong> proveedores
      </div>
      <div className="pagination-controls">
        <button
          className="page-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={15} />
        </button>
        {pageList(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`dots-${i}`} className="page-dots">
              …
            </span>
          ) : (
            <button
              key={p}
              className={`page-btn${p === page ? " active" : ""}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="page-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Página siguiente"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
