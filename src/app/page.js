"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import StatsRow from "@/components/StatsRow";
import Toolbar from "@/components/Toolbar";
import ProviderGrid from "@/components/ProviderGrid";
import ProviderModal from "@/components/ProviderModal";
import DetailPanel from "@/components/DetailPanel";
import Toast from "@/components/Toast";
import {
  fetchCatalogos,
  fetchGeoTree,
  fetchProveedores,
  fetchAdjuntos,
  guardarProveedor,
  eliminarProveedor,
  agregarLink,
  subirArchivo,
  eliminarAdjunto,
} from "@/lib/api";

const emptyCatalogos = { categorias: [], estados: [], presupuestos: [], coberturas: [] };
const emptyGeo = { paises: [], regionesPorPais: {}, ciudadesPorRegion: {} };
const emptyFilters = { search: "", pais: "", region: "", categoria: "", estado: "", rating: "" };

export default function Page() {
  const [providers, setProviders] = useState([]);
  const [catalogos, setCatalogos] = useState(emptyCatalogos);
  const [geo, setGeo] = useState(emptyGeo);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [saving, setSaving] = useState(false);

  const [detailId, setDetailId] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [adjuntosLoading, setAdjuntosLoading] = useState(false);

  const [toast, setToast] = useState("");

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [cat, geoTree, provs] = await Promise.all([
        fetchCatalogos(),
        fetchGeoTree(),
        fetchProveedores(),
      ]);
      setCatalogos(cat);
      setGeo(geoTree);
      setProviders(provs);
    } catch (err) {
      console.error(err);
      setLoadError(
        err?.message ||
          "No se pudo conectar con Supabase. Revisa las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    loadAll();
  }, [loadAll]);

  const refreshProviders = useCallback(async () => {
    const provs = await fetchProveedores();
    setProviders(provs);
  }, []);

  const refreshGeo = useCallback(async () => {
    const geoTree = await fetchGeoTree();
    setGeo(geoTree);
  }, []);

  /* ── Filtros ── */
  const filteredProviders = useMemo(() => {
    const s = filters.search.toLowerCase();
    return providers.filter((p) => {
      const haystack = [
        p.nombre,
        p.contacto_nombre,
        (p.servicios || []).join(", "),
        p.categoria,
        p.ciudad,
        p.region,
        p.pais,
        p.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchSearch = !s || haystack.includes(s);
      return (
        matchSearch &&
        (!filters.pais || p.pais === filters.pais) &&
        (!filters.region || p.region === filters.region) &&
        (!filters.categoria || p.categoria === filters.categoria) &&
        (!filters.estado || p.estado === filters.estado) &&
        (!filters.rating || (p.score || 0) >= parseInt(filters.rating, 10))
      );
    });
  }, [providers, filters]);

  const paisesDisponibles = useMemo(
    () => geo.paises.map((p) => p.nombre),
    [geo.paises]
  );
  const regionesDisponibles = useMemo(() => {
    if (!filters.pais) return [];
    const paisObj = geo.paises.find((p) => p.nombre === filters.pais);
    if (!paisObj) return [];
    return (geo.regionesPorPais[paisObj.id] || []).map((r) => r.nombre);
  }, [geo, filters.pais]);
  const categoriasDisponibles = useMemo(
    () => catalogos.categorias.map((c) => c.nombre),
    [catalogos.categorias]
  );
  const estadosDisponibles = useMemo(
    () => catalogos.estados.map((e) => e.nombre),
    [catalogos.estados]
  );

  /* ── Modal alta/edición ── */
  function openAdd() {
    setEditingProvider(null);
    setModalOpen(true);
  }
  function openEdit(provider) {
    setEditingProvider(provider);
    setDetailId(null);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setEditingProvider(null);
  }

  async function handleSave(payload) {
    setSaving(true);
    try {
      await guardarProveedor(payload);
      await Promise.all([refreshProviders(), refreshGeo()]);
      closeModal();
      notify(payload.id ? "Proveedor actualizado" : "Proveedor agregado");
    } catch (err) {
      console.error(err);
      alert("Error al guardar: " + (err?.message || "desconocido"));
    } finally {
      setSaving(false);
    }
  }

  /* ── Detalle ── */
  const detailProvider = useMemo(
    () => providers.find((p) => p.id === detailId) || null,
    [providers, detailId]
  );
  const detailIdx = useMemo(
    () => providers.findIndex((p) => p.id === detailId),
    [providers, detailId]
  );

  async function openDetail(id) {
    setDetailId(id);
    setAdjuntosLoading(true);
    try {
      const data = await fetchAdjuntos(id);
      setAdjuntos(data);
    } catch (err) {
      console.error(err);
      setAdjuntos([]);
    } finally {
      setAdjuntosLoading(false);
    }
  }
  function closeDetail() {
    setDetailId(null);
    setAdjuntos([]);
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este proveedor? No se puede deshacer.")) return;
    try {
      await eliminarProveedor(id);
      await refreshProviders();
      closeDetail();
      notify("Proveedor eliminado");
    } catch (err) {
      console.error(err);
      alert("Error al eliminar: " + (err?.message || "desconocido"));
    }
  }

  async function handleAddLink(url, nombre) {
    try {
      await agregarLink(detailId, { url, nombre });
      const data = await fetchAdjuntos(detailId);
      setAdjuntos(data);
      await refreshProviders();
    } catch (err) {
      console.error(err);
      alert("Error al agregar link: " + (err?.message || "desconocido"));
    }
  }

  async function handleUploadFiles(files) {
    try {
      for (const file of files) {
        await subirArchivo(detailId, file);
      }
      const data = await fetchAdjuntos(detailId);
      setAdjuntos(data);
      await refreshProviders();
    } catch (err) {
      console.error(err);
      alert("Error al subir archivo: " + (err?.message || "desconocido"));
    }
  }

  async function handleRemoveAdjunto(adjunto) {
    try {
      await eliminarAdjunto(adjunto);
      const data = await fetchAdjuntos(detailId);
      setAdjuntos(data);
      await refreshProviders();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar adjunto: " + (err?.message || "desconocido"));
    }
  }

  /* ── Export CSV ── */
  function exportCSV() {
    const cols = [
      ["nombre", "Empresa"],
      ["pais", "País"],
      ["region", "Departamento/Estado"],
      ["ciudad", "Ciudad"],
      ["categoria", "Categoría"],
      ["estado", "Estado"],
      ["contacto_nombre", "Contacto"],
      ["telefono", "Teléfono"],
      ["email", "Email"],
      ["score", "Score"],
      ["presupuesto", "Presupuesto"],
      ["cobertura", "Cobertura"],
      ["notas", "Notas"],
    ];
    const head = cols.map((c) => c[1]);
    const rows = providers.map((p) =>
      cols.map(([key]) => `"${String(p[key] ?? "").replace(/"/g, '""')}"`)
    );
    const csv = [head, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,﻿" + encodeURIComponent(csv);
    a.download = "proveedores-xp.csv";
    a.click();
  }

  /* ── Atajo Escape ── */
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        closeDetail();
        closeModal();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const paisesTexto = [...new Set(providers.map((p) => p.pais).filter(Boolean))].join(" · ");

  return (
    <div className="app">
      <Header
        subtitle={paisesTexto || "Sin proveedores aún"}
        onExportCSV={exportCSV}
        onAdd={openAdd}
      />
      <main>
        {loadError ? (
          <div className="empty">
            <div className="empty-icon">⚠️</div>
            <div>{loadError}</div>
          </div>
        ) : (
          <>
            <StatsRow providers={providers} />
            <Toolbar
              filters={filters}
              setFilters={setFilters}
              paisesDisponibles={paisesDisponibles}
              regionesDisponibles={regionesDisponibles}
              categoriasDisponibles={categoriasDisponibles}
              estadosDisponibles={estadosDisponibles}
            />
            <ProviderGrid
              providers={filteredProviders}
              loading={loading}
              onOpen={openDetail}
            />
          </>
        )}
      </main>

      {modalOpen && (
        <ProviderModal
          open={modalOpen}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
          catalogos={catalogos}
          geo={geo}
          editingProvider={editingProvider}
        />
      )}

      <DetailPanel
        open={!!detailId}
        provider={detailProvider}
        idx={detailIdx}
        onClose={closeDetail}
        onEdit={openEdit}
        onDelete={handleDelete}
        adjuntos={adjuntos}
        adjuntosLoading={adjuntosLoading}
        onAddLink={handleAddLink}
        onUploadFiles={handleUploadFiles}
        onRemoveAdjunto={handleRemoveAdjunto}
      />

      <Toast message={toast} />
    </div>
  );
}
