"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sileo } from "sileo";
import { AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import StatsRow from "@/components/StatsRow";
import Toolbar from "@/components/Toolbar";
import ProviderGrid from "@/components/ProviderGrid";
import ProviderModal from "@/components/ProviderModal";
import DetailPanel from "@/components/DetailPanel";
import MobileFab from "@/components/MobileFab";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  fetchCatalogos,
  fetchGeoTree,
  fetchProveedores,
  fetchAdjuntos,
  guardarProveedor,
  desactivarProveedor,
  reactivarProveedor,
  purgarVencidos,
  actualizarScore,
  agregarLink,
  subirArchivo,
  eliminarAdjunto,
} from "@/lib/api";
import { exportExcel, exportPDF } from "@/lib/export";

const emptyCatalogos = { categorias: [], estados: [], presupuestos: [], coberturas: [] };
const emptyGeo = { paises: [], regionesPorPais: {}, ciudadesPorRegion: {} };
const emptyFilters = { search: "", pais: "", region: "", categoria: "", estado: "", rating: "" };
const MAX_NOTIFICATIONS = 30;

function newNotifId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Page() {
  const [providers, setProviders] = useState([]);
  const [catalogos, setCatalogos] = useState(emptyCatalogos);
  const [geo, setGeo] = useState(emptyGeo);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [saving, setSaving] = useState(false);

  const [detailId, setDetailId] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [adjuntosLoading, setAdjuntosLoading] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshProviders = useCallback(async () => {
    const provs = await fetchProveedores();
    setProviders(provs);
  }, []);

  const refreshGeo = useCallback(async () => {
    const geoTree = await fetchGeoTree();
    setGeo(geoTree);
  }, []);

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

      // Purga silenciosa de proveedores que llevan 30+ días desactivados.
      // No bloquea la carga ni molesta al usuario; si borró algo, refresca.
      purgarVencidos()
        .then((count) => {
          if (count > 0) refreshProviders();
        })
        .catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.warn("[ProveeHub] purga de vencidos omitida:", err?.message || err);
          }
        });
    } catch (err) {
      console.error(err);
      setLoadError(
        err?.message ||
          "No se pudo conectar con Supabase. Revisa las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    } finally {
      setLoading(false);
    }
  }, [refreshProviders]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    loadAll();
  }, [loadAll]);

  /* ── Tiempo real: 30 personas pueden estar editando a la vez.
     Nos suscribimos a cambios en `proveedores` para mantener la lista
     sincronizada y alimentar la campanita de notificaciones. Requiere
     haber corrido supabase/05_concurrencia_realtime.sql (habilita la
     réplica de la tabla al canal de Realtime). ── */
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("proveedores-actividad")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "proveedores" },
        (payload) => {
          const row = payload.new && Object.keys(payload.new).length ? payload.new : payload.old;
          const nombre = row?.nombre || "un proveedor";
          const type =
            payload.eventType === "INSERT" ? "insert" : payload.eventType === "DELETE" ? "delete" : "update";
          const text =
            type === "insert"
              ? `Se agregó "${nombre}"`
              : type === "delete"
                ? `Se eliminó "${nombre}"`
                : `Se actualizó "${nombre}"`;
          setNotifications((prev) => [{ id: newNotifId(), type, text, at: Date.now() }, ...prev].slice(0, MAX_NOTIFICATIONS));
          setUnreadCount((c) => c + 1);
          refreshProviders();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshProviders]);

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

  // Volver a la primera página cada vez que cambian los filtros
  // (ajuste de estado durante el render, sin efecto: evita renders en cascada)
  const [filtersSnapshot, setFiltersSnapshot] = useState(filters);
  if (filters !== filtersSnapshot) {
    setFiltersSnapshot(filters);
    setPage(1);
  }

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
  const existingNames = useMemo(() => providers.map((p) => p.nombre), [providers]);

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
      sileo.success({ title: payload.id ? "Proveedor actualizado" : "Proveedor agregado" });
    } catch (err) {
      console.error(err);
      const msg = err?.message || "";
      if (msg.includes("CONFLICTO_EDICION")) {
        sileo.error({
          title: "Alguien más editó este proveedor",
          description: "Los datos cambiaron mientras lo tenías abierto. Recarga para ver la versión más reciente y vuelve a intentar.",
          duration: null,
          button: {
            title: "Recargar datos",
            onClick: () => {
              refreshProviders();
              closeModal();
            },
          },
        });
      } else {
        sileo.error({ title: "Error al guardar", description: msg || "Ocurrió un error desconocido." });
      }
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

  // "Eliminar" no borra al instante: desactiva el proveedor. Si nadie lo
  // reactiva, se purga solo a los 30 días (ver purgarVencidos en loadAll).
  async function handleDeactivate(id) {
    const provider = providers.find((p) => p.id === id);
    try {
      await desactivarProveedor(id);
      await refreshProviders();
      closeDetail();
      sileo.success({
        title: "Proveedor desactivado",
        description: provider?.nombre ? `${provider.nombre} se eliminará en 30 días si no se reactiva.` : undefined,
      });
    } catch (err) {
      console.error(err);
      sileo.error({ title: "Error al desactivar", description: err?.message || "Ocurrió un error desconocido." });
      throw err;
    }
  }

  async function handleReactivate(id) {
    const provider = providers.find((p) => p.id === id);
    try {
      await reactivarProveedor(id);
      await refreshProviders();
      sileo.success({ title: "Proveedor reactivado", description: provider?.nombre || undefined });
    } catch (err) {
      console.error(err);
      sileo.error({ title: "Error al reactivar", description: err?.message || "Ocurrió un error desconocido." });
      throw err;
    }
  }

  // Clic rápido en las estrellas del panel de detalle: actualización
  // optimista (se ve al instante) + persistencia directa, sin pasar por el
  // chequeo de conflicto completo (un solo campo, riesgo bajo de choque).
  async function handleUpdateScore(id, score) {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, score } : p)));
    try {
      await actualizarScore(id, score);
    } catch (err) {
      console.error(err);
      sileo.error({ title: "No se pudo actualizar la calificación", description: err?.message });
      await refreshProviders();
    }
  }

  async function handleAddLink(url, nombre) {
    try {
      await agregarLink(detailId, { url, nombre });
      const data = await fetchAdjuntos(detailId);
      setAdjuntos(data);
      await refreshProviders();
      sileo.success({ title: "Link agregado" });
    } catch (err) {
      console.error(err);
      sileo.error({ title: "Error al agregar link", description: err?.message || "Ocurrió un error desconocido." });
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
      sileo.error({ title: "Error al subir archivo", description: err?.message || "Ocurrió un error desconocido." });
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
      sileo.error({ title: "Error al eliminar adjunto", description: err?.message || "Ocurrió un error desconocido." });
    }
  }

  /* ── Exportar ── */
  async function handleExportExcel() {
    try {
      await exportExcel(filteredProviders, "proveedores-xp.xlsx");
    } catch (err) {
      console.error(err);
      sileo.error({ title: "No se pudo exportar a Excel" });
    }
  }
  async function handleExportPDF() {
    try {
      await exportPDF(filteredProviders, "proveedores-xp.pdf");
    } catch (err) {
      console.error(err);
      sileo.error({ title: "No se pudo exportar a PDF" });
    }
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
        count={filteredProviders.length}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onAdd={openAdd}
        notifications={notifications}
        unreadCount={unreadCount}
        onOpenNotifications={() => setUnreadCount(0)}
      />
      <main>
        {loadError ? (
          <div className="empty">
            <span className="empty-icon">
              <AlertTriangle size={22} />
            </span>
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
              page={page}
              onPageChange={setPage}
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
          existingNames={existingNames}
        />
      )}

      <DetailPanel
        open={!!detailId}
        provider={detailProvider}
        idx={detailIdx}
        onClose={closeDetail}
        onEdit={openEdit}
        onDeactivate={handleDeactivate}
        onReactivate={handleReactivate}
        onUpdateScore={handleUpdateScore}
        adjuntos={adjuntos}
        adjuntosLoading={adjuntosLoading}
        onAddLink={handleAddLink}
        onUploadFiles={handleUploadFiles}
        onRemoveAdjunto={handleRemoveAdjunto}
      />

      {!modalOpen && !detailId && <MobileFab onClick={openAdd} />}
    </div>
  );
}
