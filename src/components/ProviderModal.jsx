"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sileo } from "sileo";
import {
  Building2,
  MapPin,
  User,
  Layers,
  Star,
  Phone,
  Mail,
  Globe2,
  X,
  PenSquare,
} from "lucide-react";
import { TextField, SelectField, TextAreaField, TagInput } from "./fields/Field";

const emptyForm = {
  nombre: "",
  categoriaId: "",
  estadoId: "",
  contacto: "",
  telefono: "",
  email: "",
  score: 3,
  presupuestoId: "",
  coberturaId: "",
  servicios: [],
  notas: "",
};

const SCORE_LABELS = { 1: "Deficiente", 2: "Regular", 3: "Bueno", 4: "Muy bueno", 5: "Excelente" };

const TABS = [
  { id: "general", label: "General", icon: Building2 },
  { id: "ubicacion", label: "Ubicación", icon: MapPin },
  { id: "contacto", label: "Contacto", icon: User },
  { id: "servicios", label: "Servicios", icon: Layers },
];

export default function ProviderModal({
  open,
  onClose,
  onSave,
  saving,
  catalogos,
  geo,
  editingProvider,
  existingNames = [],
}) {
  const [tab, setTab] = useState("general");
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset tab & sync form fields when the modal (re)opens for add/edit
    setTab("general");
    setDuplicateConfirmed(false);
    if (editingProvider) {
      const p = editingProvider;
      setForm({
        nombre: p.nombre || "",
        categoriaId: String(p.categoria_id || ""),
        estadoId: String(p.estado_id || ""),
        contacto: p.contacto_nombre || "",
        telefono: p.telefono || "",
        email: p.email || "",
        score: Number(p.score ?? 3),
        presupuestoId: String(p.presupuesto_id || ""),
        coberturaId: String(p.cobertura_id || ""),
        servicios: p.servicios || [],
        notas: p.notas || "",
      });
      initLocation(p.pais, p.region, p.ciudad);
    } else {
      setForm({
        ...emptyForm,
        categoriaId: catalogos.categorias[0] ? String(catalogos.categorias[0].id) : "",
        estadoId: catalogos.estados[0] ? String(catalogos.estados[0].id) : "",
      });
      initLocation("", "", "");
    }
  }, [open, editingProvider, initLocation, catalogos.categorias, catalogos.estados]);

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
    if (field === "nombre") setDuplicateConfirmed(false);
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit() {
    if (!form.nombre.trim()) {
      setTab("general");
      sileo.warning({ title: "Falta el nombre", description: "Escribe el nombre de la empresa proveedora." });
      return;
    }
    if (!form.categoriaId) {
      setTab("general");
      sileo.warning({ title: "Falta la categoría", description: "Selecciona una categoría para el proveedor." });
      return;
    }
    if (!finalPais) {
      setTab("ubicacion");
      sileo.warning({ title: "Falta el país", description: "Selecciona o escribe el país del proveedor." });
      return;
    }
    if (!form.estadoId) {
      setTab("general");
      sileo.warning({ title: "Falta el estado", description: "Selecciona el estado del proveedor." });
      return;
    }

    // Aviso de posible duplicado al crear (no bloquea, solo pide confirmar de nuevo)
    if (!editingProvider && !duplicateConfirmed) {
      const nameLower = form.nombre.trim().toLowerCase();
      const dup = existingNames.some((n) => n.toLowerCase() === nameLower);
      if (dup) {
        setDuplicateConfirmed(true);
        sileo.warning({
          title: "Ya existe un proveedor con ese nombre",
          description: "Presiona \"Guardar proveedor\" otra vez para crearlo de todas formas.",
        });
        return;
      }
    }

    onSave({
      id: editingProvider?.id,
      updatedAt: editingProvider?.updated_at || null,
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
      servicios: form.servicios,
      notas: form.notas,
    });
  }

  return (
    <div className="overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>{editingProvider ? "Editar proveedor" : "Nuevo proveedor"}</h2>
            <div className="modal-head-sub">
              {editingProvider ? editingProvider.nombre : "Completa los datos por secciones"}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="tab-bar">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab-btn${tab === t.id ? " active" : ""}`}
                onClick={() => setTab(t.id)}
                type="button"
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "general" && (
            <div className="tab-panel">
              <div className="form-section">
                <TextField
                  label="Nombre de la empresa"
                  required
                  icon={<Building2 size={15} />}
                  value={form.nombre}
                  onChange={(v) => update("nombre", v)}
                />
              </div>
              <div className="form-section row2">
                <SelectField
                  label="Categoría"
                  required
                  value={form.categoriaId}
                  onChange={(v) => update("categoriaId", v)}
                >
                  <option value="">Seleccionar…</option>
                  {catalogos.categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </SelectField>
                <SelectField label="Estado" value={form.estadoId} onChange={(v) => update("estadoId", v)}>
                  {catalogos.estados.map((e2) => (
                    <option key={e2.id} value={e2.id}>{e2.nombre}</option>
                  ))}
                </SelectField>
              </div>
              <div className="form-section">
                <div className="form-section-title">
                  <Star size={12} />
                  Evaluación
                </div>
                <div className="score-picker">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={`score-btn${form.score === n ? " active" : ""}`}
                      onClick={() => update("score", n)}
                    >
                      <Star size={15} fill={form.score >= n ? "var(--amber-star)" : "none"} color="var(--amber-star)" />
                      <span>{SCORE_LABELS[n]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "ubicacion" && (
            <div className="tab-panel">
              <div className="form-section row3">
                <div>
                  <SelectField label="País" required value={paisSel} onChange={handlePaisChange}>
                    <option value="">Seleccionar…</option>
                    {geo.paises.map((p) => (
                      <option key={p.id} value={p.nombre}>{p.nombre}</option>
                    ))}
                    <option value="__otro__">Otro país…</option>
                  </SelectField>
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
                <div>
                  <SelectField label={regionLabel} value={regionSel} onChange={handleRegionChange} disabled={!paisSel}>
                    <option value="">{paisSel ? "Seleccionar…" : "Elige país primero"}</option>
                    {regiones.map((r) => (
                      <option key={r.id} value={r.nombre}>{r.nombre}</option>
                    ))}
                    <option value="__otro__">No está en la lista…</option>
                  </SelectField>
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
                <div>
                  <SelectField
                    label="Ciudad / Municipio"
                    value={ciudades.find((c) => c.nombre === ciudadSel) ? ciudadSel : ciudadSel === "__otro__" ? "__otro__" : ""}
                    onChange={handleCiudadChange}
                    disabled={!regionSel}
                  >
                    <option value="">{regionSel ? "Seleccionar…" : "Elige región primero"}</option>
                    {ciudades.map((c) => (
                      <option key={c.id} value={c.nombre}>{c.nombre}</option>
                    ))}
                    <option value="__otro__">No está en la lista…</option>
                  </SelectField>
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
          )}

          {tab === "contacto" && (
            <div className="tab-panel">
              <div className="form-section row2">
                <TextField
                  label="Contacto principal"
                  icon={<User size={15} />}
                  value={form.contacto}
                  onChange={(v) => update("contacto", v)}
                />
                <TextField
                  label="Teléfono / WhatsApp"
                  icon={<Phone size={15} />}
                  value={form.telefono}
                  onChange={(v) => update("telefono", v)}
                />
              </div>
              <div className="form-section">
                <TextField
                  label="Email"
                  type="email"
                  icon={<Mail size={15} />}
                  value={form.email}
                  onChange={(v) => update("email", v)}
                />
              </div>
              <div className="form-section row2">
                <SelectField label="Presupuesto" value={form.presupuestoId} onChange={(v) => update("presupuestoId", v)}>
                  <option value="">—</option>
                  {catalogos.presupuestos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </SelectField>
                <SelectField label="Cobertura" value={form.coberturaId} onChange={(v) => update("coberturaId", v)}>
                  <option value="">—</option>
                  {catalogos.coberturas.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </SelectField>
              </div>
            </div>
          )}

          {tab === "servicios" && (
            <div className="tab-panel">
              <div className="form-section">
                <TagInput
                  label="Servicios que ofrece"
                  values={form.servicios}
                  onChange={(v) => update("servicios", v)}
                  placeholder="Ej. video mapping, pantallas LED…"
                />
              </div>
              <div className="form-section">
                <TextAreaField
                  label="Notas internas"
                  value={form.notas}
                  onChange={(v) => update("notas", v)}
                  placeholder="Historial, condiciones, advertencias…"
                  rows={5}
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <div style={{ fontSize: 11.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
            <Globe2 size={12} />
            {finalPais || "Sin país"} {finalRegion ? `· ${finalRegion}` : ""}
          </div>
          <div className="modal-foot-right">
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              <PenSquare size={14} />
              {saving ? "Guardando…" : "Guardar proveedor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
