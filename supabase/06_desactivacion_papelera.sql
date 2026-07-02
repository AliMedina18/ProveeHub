-- ============================================================
-- ProveeHub · Desactivar en vez de eliminar (papelera con purga a 30 días)
-- ============================================================
-- Pedido del equipo: al dar clic en "eliminar" no se borra al instante.
-- En vez de eso, el proveedor se marca como "desactivado" y queda
-- visible (marcado) en la lista. Si nadie lo reactiva en 30 días, se
-- borra definitivamente (junto con sus adjuntos, por el ON DELETE CASCADE
-- ya definido en 01_schema.sql).
--
-- Ejecuta este archivo una sola vez en el SQL Editor de Supabase,
-- DESPUÉS de 01_schema.sql y 05_concurrencia_realtime.sql.
-- ============================================================

-- ── Columna que marca desde cuándo está desactivado un proveedor ──
alter table proveedores add column if not exists desactivado_en timestamptz;
create index if not exists idx_proveedores_desactivado on proveedores(desactivado_en);

-- ── Vista de lectura: se agrega desactivado_en para que el frontend
--    pueda mostrar el aviso y calcular los días restantes ──
create or replace view proveedores_detalle as
select
  p.id, p.nombre, p.contacto_nombre, p.telefono, p.email, p.score, p.notas,
  p.created_at, p.updated_at,
  c.id  as categoria_id,   c.nombre as categoria,
  e.id  as estado_id,      e.nombre as estado, e.color_bg, e.color_fg,
  rp.id as presupuesto_id, rp.nombre as presupuesto,
  tc.id as cobertura_id,   tc.nombre as cobertura,
  ciu.id as ciudad_id,     ciu.nombre as ciudad,
  reg.id as region_id,     reg.nombre as region,
  pa.id as pais_id,        pa.nombre as pais, pa.codigo_iso, pa.bandera_emoji,
  coalesce(svc.servicios, '[]'::json)  as servicios,
  coalesce(att.adjuntos_count, 0)      as adjuntos_count,
  p.desactivado_en
from proveedores p
join categorias c        on c.id = p.categoria_id
join estados_proveedor e on e.id = p.estado_id
left join rangos_presupuesto rp on rp.id = p.presupuesto_id
left join tipos_cobertura tc    on tc.id = p.cobertura_id
left join ciudades ciu on ciu.id = p.ciudad_id
left join regiones reg on reg.id = ciu.region_id
left join paises pa    on pa.id = reg.pais_id
left join lateral (
  select json_agg(s.nombre order by s.nombre) as servicios
  from proveedor_servicios ps join servicios s on s.id = ps.servicio_id
  where ps.proveedor_id = p.id
) svc on true
left join lateral (
  select count(*) as adjuntos_count from adjuntos a where a.proveedor_id = p.id
) att on true;

-- ── Desactivar: marca la fecha, no borra nada todavía ──
create or replace function desactivar_proveedor(p_id uuid)
returns void language plpgsql as $$
begin
  update proveedores set desactivado_en = now() where id = p_id;
end; $$;

-- ── Reactivar: quita la marca, el proveedor vuelve a la normalidad ──
create or replace function reactivar_proveedor(p_id uuid)
returns void language plpgsql as $$
begin
  update proveedores set desactivado_en = null where id = p_id;
end; $$;

-- ── Purga: borra definitivamente lo que lleva 30+ días desactivado.
--    El frontend la llama una vez al cargar la app (ver src/lib/api.js
--    purgarVencidos()); no requiere pg_cron ni Edge Functions. ──
create or replace function purgar_proveedores_vencidos()
returns integer language plpgsql as $$
declare v_count integer;
begin
  delete from proveedores
  where desactivado_en is not null
    and desactivado_en < now() - interval '30 days';
  get diagnostics v_count = row_count;
  return v_count;
end; $$;

-- ── Guardar (editar) un proveedor lo reactiva automáticamente ──
-- Si alguien edita y guarda un proveedor desactivado desde el formulario,
-- asumimos que quiere seguir gestionándolo: se le quita la marca de
-- desactivado. (Reemplaza la versión de guardar_proveedor de
-- 05_concurrencia_realtime.sql — misma lógica, solo se agrega esta línea).
do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'guardar_proveedor'
  loop
    execute format('drop function if exists %s', fn);
  end loop;
end $$;

create or replace function guardar_proveedor(
  p_id                   uuid,
  p_nombre               text,
  p_categoria_id         bigint,
  p_estado_id            bigint,
  p_pais                 text,
  p_region               text,
  p_ciudad               text,
  p_contacto_nombre      text,
  p_telefono             text,
  p_email                text,
  p_score                integer,
  p_presupuesto_id       bigint,
  p_cobertura_id         bigint,
  p_notas                text,
  p_servicios            text[],
  p_expected_updated_at  timestamptz default null
) returns uuid language plpgsql as $$
declare
  v_id uuid;
  v_current_updated_at timestamptz;
  v_ciudad_id bigint;
  s text;
  v_servicio_id bigint;
begin
  v_ciudad_id := obtener_o_crear_geo(p_pais, p_region, p_ciudad);

  if p_id is not null then
    -- Bloquea la fila y lee su updated_at real antes de comparar, así dos
    -- guardados simultáneos no pueden "colarse" entre el select y el update.
    select updated_at into v_current_updated_at
    from proveedores where id = p_id
    for update;

    if v_current_updated_at is null then
      raise exception 'PROVEEDOR_NO_ENCONTRADO';
    end if;

    if p_expected_updated_at is not null
       and v_current_updated_at <> p_expected_updated_at then
      raise exception 'CONFLICTO_EDICION: el proveedor % fue modificado por otra persona (updated_at %, esperado %)',
        p_id, v_current_updated_at, p_expected_updated_at;
    end if;

    update proveedores set
      nombre = p_nombre, categoria_id = p_categoria_id, estado_id = p_estado_id,
      ciudad_id = v_ciudad_id, contacto_nombre = p_contacto_nombre,
      telefono = p_telefono, email = p_email, score = p_score::smallint,
      presupuesto_id = p_presupuesto_id, cobertura_id = p_cobertura_id, notas = p_notas,
      desactivado_en = null
    where id = p_id
    returning id into v_id;

    delete from proveedor_servicios where proveedor_id = v_id;
  else
    insert into proveedores (
      nombre, categoria_id, estado_id, ciudad_id, contacto_nombre,
      telefono, email, score, presupuesto_id, cobertura_id, notas
    ) values (
      p_nombre, p_categoria_id, p_estado_id, v_ciudad_id, p_contacto_nombre,
      p_telefono, p_email, p_score::smallint, p_presupuesto_id, p_cobertura_id, p_notas
    ) returning id into v_id;
  end if;

  if p_servicios is not null then
    foreach s in array p_servicios loop
      s := btrim(s);
      continue when s = '';
      insert into servicios (nombre) values (s)
        on conflict (nombre) do update set nombre = excluded.nombre
        returning id into v_servicio_id;
      insert into proveedor_servicios (proveedor_id, servicio_id)
        values (v_id, v_servicio_id) on conflict do nothing;
    end loop;
  end if;

  return v_id;
end; $$;
