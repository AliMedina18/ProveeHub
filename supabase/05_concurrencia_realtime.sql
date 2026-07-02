-- ============================================================
-- ProveeHub · Concurrencia multiusuario + Tiempo real
-- ============================================================
-- Este proyecto lo van a usar ~30 personas de marketing a la vez.
-- Dos problemas típicos de un catálogo compartido sin esto:
--
--   1) Edición perdida ("lost update"): María abre "Proveedor X" para
--      editar, Juan también lo abre, Juan guarda, María guarda encima
--      sin saber que Juan cambió algo → el cambio de Juan desaparece
--      en silencio.
--   2) Vista desactualizada: alguien agrega/edita/borra un proveedor y
--      el resto del equipo no se entera hasta que recargan la página
--      a mano.
--
-- Este archivo resuelve ambos con dos mecanismos estándar (no son
-- soluciones "de juguete", son los mismos patrones que usan Google
-- Docs/Notion a menor escala: bloqueo optimista + suscripción realtime):
--
--   A) Bloqueo optimista en `guardar_proveedor`: el frontend manda la
--      marca de tiempo `updated_at` que tenía cargada al abrir el
--      formulario. Si alguien más ya guardó cambios sobre ese registro
--      (su `updated_at` real ya cambió), el RPC rechaza el guardado con
--      'CONFLICTO_EDICION' en vez de sobrescribir a ciegas. El frontend
--      muestra un aviso para recargar y reintentar.
--
--   B) Supabase Realtime sobre `proveedores`: cada INSERT/UPDATE/DELETE
--      se transmite por WebSocket a todos los clientes conectados, que
--      refrescan su lista y alimentan la campanita de notificaciones.
--
-- Ejecuta este archivo una sola vez en el SQL Editor de Supabase,
-- DESPUÉS de 01_schema.sql.
-- ============================================================

-- ── A) Bloqueo optimista: nueva versión de guardar_proveedor ──
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
      presupuesto_id = p_presupuesto_id, cobertura_id = p_cobertura_id, notas = p_notas
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

-- ── B) Habilitar Realtime sobre la tabla proveedores ──
-- (equivalente a marcar la tabla en Database → Replication en el dashboard)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'proveedores'
  ) then
    alter publication supabase_realtime add table proveedores;
  end if;
end $$;

-- Nota: si más adelante quieres que la campanita también avise sobre
-- adjuntos (archivos/links) nuevos, agrega la tabla igual:
-- alter publication supabase_realtime add table adjuntos;
