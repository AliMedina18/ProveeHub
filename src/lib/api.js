import {
  supabase,
  ATTACHMENTS_BUCKET,
  getSupabaseConfigError,
} from "./supabaseClient";

function ensureSupabaseConfigured() {
  const configError = getSupabaseConfigError();
  if (configError) throw new Error(configError);
}

/* ──────────────────────────────────────────────────────────
   Catálogos (categorías, estados, presupuestos, cobertura)
   ────────────────────────────────────────────────────────── */
export async function fetchCatalogos() {
  ensureSupabaseConfigured();
  const [categorias, estados, presupuestos, coberturas] = await Promise.all([
    supabase.from("categorias").select("id,nombre").order("nombre"),
    supabase
      .from("estados_proveedor")
      .select("id,nombre,color_bg,color_fg,orden")
      .order("orden"),
    supabase
      .from("rangos_presupuesto")
      .select("id,nombre,orden")
      .order("orden"),
    supabase.from("tipos_cobertura").select("id,nombre,orden").order("orden"),
  ]);
  for (const r of [categorias, estados, presupuestos, coberturas]) {
    if (r.error) throw r.error;
  }
  return {
    categorias: categorias.data,
    estados: estados.data,
    presupuestos: presupuestos.data,
    coberturas: coberturas.data,
  };
}

/* ──────────────────────────────────────────────────────────
   Geografía: país → región → ciudad, en forma de árbol
   ────────────────────────────────────────────────────────── */
export async function fetchGeoTree() {
  ensureSupabaseConfigured();
  const [paises, regiones, ciudades] = await Promise.all([
    supabase
      .from("paises")
      .select("id,nombre,codigo_iso,bandera_emoji,etiqueta_region")
      .order("nombre"),
    supabase.from("regiones").select("id,pais_id,nombre").order("nombre"),
    supabase.from("ciudades").select("id,region_id,nombre").order("nombre"),
  ]);
  for (const r of [paises, regiones, ciudades]) {
    if (r.error) throw r.error;
  }
  const regionesPorPais = {};
  for (const r of regiones.data) {
    (regionesPorPais[r.pais_id] ||= []).push(r);
  }
  const ciudadesPorRegion = {};
  for (const c of ciudades.data) {
    (ciudadesPorRegion[c.region_id] ||= []).push(c);
  }
  return {
    paises: paises.data,
    regionesPorPais,
    ciudadesPorRegion,
  };
}

/* ──────────────────────────────────────────────────────────
   Proveedores
   ────────────────────────────────────────────────────────── */
export async function fetchProveedores() {
  ensureSupabaseConfigured();
  const { data, error } = await supabase
    .from("proveedores_detalle")
    .select("*")
    .order("nombre");
  if (error) throw error;
  return data;
}

export async function fetchAdjuntos(proveedorId) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase
    .from("adjuntos")
    .select("*")
    .eq("proveedor_id", proveedorId)
    .order("creado_en", { ascending: false });
  if (error) throw error;
  return data;
}

// payload: { id?, nombre, categoriaId, estadoId, pais, region, ciudad,
//            contacto, telefono, email, score, presupuestoId, coberturaId,
//            notas, servicios: string[], updatedAt? }
// `updatedAt` es el valor que el cliente tenía cargado al abrir el formulario.
// Si alguien más editó el registro mientras tanto, el RPC lanza
// 'CONFLICTO_EDICION' en vez de sobrescribir en silencio (ver guardar_proveedor
// en supabase/05_concurrencia_realtime.sql).
export async function guardarProveedor(payload) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.rpc("guardar_proveedor", {
    p_id: payload.id || null,
    p_nombre: payload.nombre,
    p_categoria_id: payload.categoriaId,
    p_estado_id: payload.estadoId,
    p_pais: payload.pais || null,
    p_region: payload.region || null,
    p_ciudad: payload.ciudad || null,
    p_contacto_nombre: payload.contacto || null,
    p_telefono: payload.telefono || null,
    p_email: payload.email || null,
    p_score: payload.score,
    p_presupuesto_id: payload.presupuestoId,
    p_cobertura_id: payload.coberturaId,
    p_notas: payload.notas || null,
    p_servicios: payload.servicios || [],
    p_expected_updated_at: payload.updatedAt || null,
  });
  if (error) throw error;
  return data; // uuid del proveedor
}

// Actualización ligera de un solo campo (score), pensada para el clic rápido
// en las estrellas del panel de detalle. No pasa por el chequeo de conflicto
// de guardar_proveedor porque el riesgo de choque en un solo campo es bajo
// y no vale la pena interrumpir al usuario por eso.
export async function actualizarScore(id, score) {
  ensureSupabaseConfigured();
  const { error } = await supabase.from("proveedores").update({ score }).eq("id", id);
  if (error) throw error;
}

// Eliminación directa e inmediata. Ya no se usa desde la UI (se reemplazó
// por desactivarProveedor + purga a 30 días), pero se deja disponible por si
// se necesita para alguna herramienta administrativa futura.
export async function eliminarProveedor(id) {
  ensureSupabaseConfigured();
  const { error } = await supabase.from("proveedores").delete().eq("id", id);
  if (error) throw error;
}

// "Eliminar" desde la UI en realidad desactiva: el proveedor queda marcado
// (desactivado_en) y sigue visible hasta que se purga automáticamente a los
// 30 días (ver purgarVencidos) o alguien lo reactiva antes.
export async function desactivarProveedor(id) {
  ensureSupabaseConfigured();
  const { error } = await supabase.rpc("desactivar_proveedor", { p_id: id });
  if (error) throw error;
}

export async function reactivarProveedor(id) {
  ensureSupabaseConfigured();
  const { error } = await supabase.rpc("reactivar_proveedor", { p_id: id });
  if (error) throw error;
}

// Se llama una vez al cargar la app (fire-and-forget): borra definitivamente
// los proveedores que llevan 30+ días desactivados. Devuelve cuántos borró.
export async function purgarVencidos() {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.rpc("purgar_proveedores_vencidos");
  if (error) throw error;
  return data;
}

/* ──────────────────────────────────────────────────────────
   Adjuntos: links y archivos (Supabase Storage)
   ────────────────────────────────────────────────────────── */
export async function agregarLink(proveedorId, { nombre, url }) {
  ensureSupabaseConfigured();
  let dominio = "";
  try {
    dominio = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    dominio = url;
  }
  const { data, error } = await supabase
    .from("adjuntos")
    .insert({
      proveedor_id: proveedorId,
      tipo: "link",
      nombre: nombre || dominio,
      url,
      meta: dominio,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export async function subirArchivo(proveedorId, file) {
  ensureSupabaseConfigured();
  const path = `${proveedorId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(path, file, { upsert: false });
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .getPublicUrl(path);

  const { data, error } = await supabase
    .from("adjuntos")
    .insert({
      proveedor_id: proveedorId,
      tipo: "file",
      nombre: file.name,
      url: pub.publicUrl,
      storage_path: path,
      mime: file.type,
      meta: fmtSize(file.size),
      tamano_bytes: file.size,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function eliminarAdjunto(adjunto) {
  ensureSupabaseConfigured();
  if (adjunto.tipo === "file" && adjunto.storage_path) {
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([adjunto.storage_path]);
  }
  const { error } = await supabase.from("adjuntos").delete().eq("id", adjunto.id);
  if (error) throw error;
}
