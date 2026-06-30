"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

const emptyForm = {
  nombre: "",
  categoriaId: "",
  estadoId: "",
  pais: "",
  region: "",
  ciudad: "",
  contacto: "",
  telefono: "",
  email: "",
  score: "3",
  presupuestoId: "",
  coberturaId: "",
  servicios: "",
  notas: "",
};

export default function ProviderModal({
  open,
  onClose,
  onSave,
  saving,
  catalogos,
  geo,
  editingProvider,
}) {
  const [form, setForm] = useState(emptyForm);
  const [paisSel, setPaisSel] = useState("");
  const [paisCustom, setPaisCustom] = useState("");
  const [regionSel, setRegionSel] = useState("");
  const [regionCustom, setRegionCustom] = useState("");
  const [ciudadSel, setCiudadSel] = useState("");
  const [ciudadCustom, setCiudadCustom] = useState("");

  const paisObj = useMemo(
    () => geo.paises.find((p) => p.nombre === paisSel),
    [geo.paises, paisSel]
  );
  const regiones = useMemo(() => {
    if (!paisObj) return [];
    return geo.regionesPorPais[paisObj.id] || [];
  }, [geo.regionesPorPais, paisObj]);
  const regionObj = useMemo(
    () => regiones.find((r) => r.nombre === regionSel),
    [regiones, regionSel]
  );
  const ciudades = useMemo(() => {
    if (!regionObj) return [];
    return geo.ciudadesPorRegion[regionObj.id] || [];
  }, [geo.ciudadesPorRegion, regionObj]);

  const initLocation = useCallback(
    (pais, region, ciudad) => {
      const knownPais = geo.paises.find((p) => p.nombre === pais);
      if (pais && !knownPais) {
        setPaisSel("__otro__");
        setPaisCustom(pais);
      } else {
        setPaisSel(pais || "");
        setPaisCustom("");
      }
      const regs = knownPais ? geo.regionesPorPais[knownPais.id] || [] : [];
      const knownRegion = regs.find((r) => r.nombre === region);
      if (region && !knownRegion) {
        setRegionSel("__otro__");
        setRegionCustom(region);
      } else {
        setRegionSel(region || "");
        setRegionCustom("");
      }
      const cits = knownRegion ? geo.ciudadesPorRegion[knownRegion.id] || [] : [];
      const knownCiudad = cits.find((c) => c.nombre === ciudad);
      if (ciudad && !knownCiudad) {
        setCiudadSel("__otro__");
        setCiudadCustom(ciudad);
      } else {
        setCiudadSel(ciudad || "");
        setCiudadCustom("");
      }
    },
    [geo]
  );

  useEffect(() => {
    if (!open) return;
    if (editingProvider) {
      const p = editingProvider;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync form with the provider being edited
      setForm({
        nombre: p.nombre || "",
        categoriaId: String(p.categoria_id || ""),
        estadoId: String(p.estado_id || ""),
        pais: p.pais || "",
        region: p.region || "",
        ciudad: p.ciudad || "",
        contacto: p.contacto_nombre || "",
        telefono: p.telefono || "",
        email: p.email || "",
        score: String(p.score ?? 3),
        presupuestoId: String(p.presupuesto_id || ""),
        coberturaId: String(p.cobertura_id || ""),
        servicios: (p.servicios || []).join(", "),
        notas: p.notas || "",
      });
      initLocation(p.pais, p.region, p.ciudad);
    } else {
      setForm(emptyForm);
      initLocation("", "", "");
    }
  }, [open, editingProvider, initLocation]);

  function handlePaisChange(v) {
    setPaisSel(v);
    setPaisCustom("");
    setRegionSel("");
    setRegionCustom("");
    setCiudadSel("");
    setCiudadCustom("");
  }
  function handleRegionChange(v) {
    setRegionSel(v);
    setRegionCustom("");
    setCiudadSel("");
    setCiudadCustom("");
  }
  function handleCiudadChange(v) {
    setCiudadSel(v);
    if (v !== "__otro__") setCiudadCustom(v);
    else setCiudadCustom("");
  }

  if (!open) return null;

  const regionLabel = paisObj?.etiqueta_region || "Región / Estado";
  const finalPais = paisSel === "__otro__" ? paisCustom.trim() : paisSel;
  const finalRegion = regionSel === "__otro__" ? regionCustom.trim() : regionSel;
  const finalCiudad =
    ciudadSel === "__otro__" || !ciudadSel ? ciudadCustom.trim() : ciudadSel;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit() {
    if (!form.nombre.trim()) {
      alert("El nombre de la empresa es requerido");
      return;
    }
    if (!finalPais) {
      alert("Selecciona el país");
      return;
    }
    onSave({
      id: editingProvider?.id,
      nombre: form.nombre.trim(),
      categoriaId: Number(form.categoriaId),
      estadoId: Number(form.estadoId),
      pais: finalPais,
      region: finalRegion,
      ciudad: finalCiudad,
      contacto: form.contacto,
      telefono: form.telefono,
      email: form.email,
      score: Number(form.score),
      presupuestoId: form.presupuestoId ? Number(form.presupuestoId) : null,
      coberturaId: form.coberturaId ? Number(form.coberturaId) : null,
      servicios: form.servicios
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      notas: form.notas,
    });
  }

  return (
    <div className="overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2>{editingProvider ? "Editar proveedor" : "Nuevo proveedor"}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Nombre de la empresa *</label>
            <input
              value={form.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              placeholder="Ej. Luces & Escenarios S.A."
            />
          </div>

          <div
            style={{
              background: "var(--gray-light)",
              borderRadius: "var(--radius)",
              padding: "14px 14px 4px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: ".06em",
                color: "var(--text-3)",
                marginBottom: 10,
              }}
            >
              📍 Ubicación
            </div>
            <div className="row3">
              <div className="field">
                <label>País *</label>
                <select value={paisSel} onChange={(e) => handlePaisChange(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {geo.paises.map((p) => (
                    <option key={p.id} value={p.nombre}>
                      {p.bandera_emoji} {p.nombre}
                    </option>
                  ))}
                  <option value="__otro__">✏️ Otro país…</option>
                </select>
                {paisSel === "__otro__" && (
                  <div className="loc-custom-row">
                    <input
                      autoFocus
                      placeholder="Escribe el nombre del país…"
                      value={paisCustom}
                      onChange={(e) => setPaisCustom(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="field">
                <label>{regionLabel}</label>
                <select
                  value={regionSel}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  disabled={!paisSel}
                >
                  <option value="">
                    {paisSel ? "Seleccionar…" : "— elige país primero —"}
                  </option>
                  {regiones.map((r) => (
                    <option key={r.id} value={r.nombre}>
                      {r.nombre}
                    </option>
                  ))}
                  <option value="__otro__">✏️ No está en la lista, agregar…</option>
                </select>
                {regionSel === "__otro__" && (
                  <div className="loc-custom-row">
                    <input
                      autoFocus
                      placeholder="Escribe el departamento o estado…"
                      value={regionCustom}
                      onChange={(e) => setRegionCustom(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="field">
                <label>Ciudad / Municipio</label>
                <select
                  value={ciudades.find((c) => c.nombre === ciudadSel) ? ciudadSel : ciudadSel === "__otro__" ? "__otro__" : ""}
                  onChange={(e) => handleCiudadChange(e.target.value)}
                  disabled={!regionSel}
                >
                  <option value="">
                    {regionSel ? "Seleccionar…" : "— elige región primero —"}
                  </option>
                  {ciudades.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                  <option value="__otro__">✏️ No está en la lista, agregar…</option>
                </select>
                {(ciudadSel === "__otro__" || (!ciudades.find((c) => c.nombre === ciudadSel) && ciudadSel)) && (
                  <div className="loc-custom-row">
                    <input
                      autoFocus
                      placeholder="Escribe la ciudad o municipio…"
                      value={ciudadCustom}
                      onChange={(e) => setCiudadCustom(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="row2">
            <div className="field">
              <label>Categoría *</label>
              <select value={form.categoriaId} onChange={(e) => update("categoriaId", e.target.value)}>
                <option value="">Seleccionar…</option>
                {catalogos.categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Estado</label>
              <select value={form.estadoId} onChange={(e) => update("estadoId", e.target.value)}>
                {catalogos.estados.map((e2) => (
                  <option key={e2.id} value={e2.id}>{e2.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="row2">
            <div className="field">
              <label>Contacto principal</label>
              <input value={form.contacto} onChange={(e) => update("contacto", e.target.value)} placeholder="Nombre" />
            </div>
            <div className="field">
              <label>Teléfono / WhatsApp</label>
              <input value={form.telefono} onChange={(e) => update("telefono", e.target.value)} placeholder="+57 300…" />
            </div>
          </div>

          <div className="row2">
            <div className="field">
              <label>Email</label>
              <input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="contacto@empresa.com" />
            </div>
            <div className="field">
              <label>Score (1–5)</label>
              <select value={form.score} onChange={(e) => update("score", e.target.value)}>
                <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
                <option value="4">⭐⭐⭐⭐ Muy bueno</option>
                <option value="3">⭐⭐⭐ Bueno</option>
                <option value="2">⭐⭐ Regular</option>
                <option value="1">⭐ Deficiente</option>
              </select>
            </div>
          </div>

          <div className="row2">
            <div className="field">
              <label>Presupuesto</label>
              <select value={form.presupuestoId} onChange={(e) => update("presupuestoId", e.target.value)}>
                <option value="">—</option>
                {catalogos.presupuestos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Cobertura</label>
              <select value={form.coberturaId} onChange={(e) => update("coberturaId", e.target.value)}>
                <option value="">—</option>
                {catalogos.coberturas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Servicios (separados por coma)</label>
            <input
              value={form.servicios}
              onChange={(e) => update("servicios", e.target.value)}
              placeholder="video mapping, pantallas LED…"
            />
          </div>
          <div className="field">
            <label>Notas internas</label>
            <textarea
              value={form.notas}
              onChange={(e) => update("notas", e.target.value)}
              placeholder="Historial, condiciones, advertencias…"
            />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : "Guardar proveedor"}
          </button>
        </div>
      </div>
    </div>
  );
}
