"use client";
import { useMemo } from "react";
import { Loader2, SearchX } from "lucide-react";
import ProviderCard from "./ProviderCard";
import Pagination from "./Pagination";

export const PAGE_SIZE = 30;

export default function ProviderGrid({ providers, loading, onOpen, page, onPageChange }) {
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return providers.slice(start, start + PAGE_SIZE);
  }, [providers, page]);

  if (loading) {
    return (
      <div className="provider-grid">
        <div className="skeleton">
          <span className="empty-icon">
            <Loader2 size={22} className="spin" />
          </span>
          <div>Cargando proveedores…</div>
        </div>
      </div>
    );
  }
  if (!providers.length) {
    return (
      <div className="provider-grid">
        <div className="empty">
          <span className="empty-icon">
            <SearchX size={22} />
          </span>
          <div>Sin resultados con estos filtros</div>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="provider-grid">
        {pageItems.map((p, idx) => (
          <ProviderCard key={p.id} provider={p} idx={idx} onOpen={onOpen} />
        ))}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={providers.length} onPageChange={onPageChange} />
    </>
  );
}
