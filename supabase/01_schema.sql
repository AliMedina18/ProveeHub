-- ============================================================
-- ProveeHub · Esquema relacional (Supabase / PostgreSQL)
-- Normalizado hasta 4FN. Ver docs/modelo-relacional.md para la
-- justificación de cada forma normal.
-- ============================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ── Catálogos geográficos (cadena País → Región → Ciudad) ──
create table if not exists paises (
  id              bigint generated always as identity primary key,
  nombre          text not null unique,
  codigo_iso      text,                 -- 'CO','MX','US'... null si es un país agregado a mano
  bandera_emoji   text,
  etiqueta_region text not null default 'Región' -- ej. "Departamento" (CO) vs "Estado" (MX/US)
);

create table if not exists regiones (
  id        bigint generated always as identity primary key,
  pais_id   bigint not null references paises(id) on delete cascade,
  nombre    text not null,
  unique (pais_id, nombre)
);
create index if not exists idx_regiones_pais on regiones(pais_id);

create table if not exists ciudades (
  id         bigint generated always as identity primary key,
  region_id  bigint not null references regiones(id) on delete cascade,
  nombre     text not null,
  unique (region_id, nombre)
);
create index if not exists idx_ciudades_region on ciudades(region_id);

-- ── Catálogos de dominio (antes eran strings repetidos en cada fila) ──
create table if not exists categorias (
  id     bigint generated always as identity primary key,
  nombre text not null unique
);

create table if not exists estados_proveedor (
  id        bigint generated always as identity primary key,
  nombre    text not null unique,
  color_bg  text,   -- hex de fondo del badge (UI)
  color_fg  text,   -- hex de texto del badge (UI)
  orden     int not null default 0
);

create table if not exists rangos_presupuesto (
  id     bigint generated always as identity primary key,
  nombre text not null unique,
  orden  int not null default 0
);

create table if not exists tipos_cobertura (
  id     bigint generated always as identity primary key,
  nombre text not null unique,
  orden  int not null default 0
);

create table if not exists servicios (
  id     bigint generated always as identity primary key,
  nombre text not null unique
);

-- ── Entidad principal ──
create table if not exists proveedores (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  categoria_id     bigint not null references categorias(id),
  estado_id        bigint not null references estados_proveedor(id),
  ciudad_id        bigint references ciudades(id),
  contacto_nombre  text,
  telefono         text,
  email            text,
  score            smallint check (score between 1 and 5) default 3,
  presupuesto_id   bigint references rangos_presupuesto(id),
  cobertura_id     bigint references tipos_cobertura(id),
  notas            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_proveedores_categoria on proveedores(categoria_id);
create index if not exists idx_proveedores_estado    on proveedores(estado_id);
create index if not exists idx_proveedores_ciudad    on proveedores(ciudad_id);
create index if not exists idx_proveedores_nombre    on proveedores using gin (to_tsvector('spanish', nombre));

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_proveedores_updated_at on proveedores;
create trigger trg_proveedores_updated_at before update on proveedores
  for each row execute function set_updated_at();

-- ── Relación M:N proveedor ↔ servicio (atributo multivaluado, 1FN/4FN) ──
create table if not exists proveedor_servicios (
  proveedor_id uuid   not null references proveedores(id) on delete cascade,
  servicio_id  bigint not null references servicios(id) on delete cascade,
  primary key (proveedor_id, servicio_id)
);
create index if not exists idx_psv_servicio on proveedor_servicios(servicio_id);

-- ── Adjuntos (otro atributo multivaluado independiente → tabla propia, 4FN) ──
create table if not exists adjuntos (
  id            uuid primary key default gen_random_uuid(),
  proveedor_id  uuid not null references proveedores(id) on delete cascade,
  tipo          text not null check (tipo in ('file','link')),
  nombre        text not null,
  url           text,            -- para tipo='link', o URL pública de Storage para tipo='file'
  storage_path  text,            -- ruta dentro del bucket de Supabase Storage (tipo='file')
  mime          text,
  meta          text,            -- dominio (links) o tamaño formateado (archivos)
  tamano_bytes  bigint,
  creado_en     timestamptz not null default now()
);
create index if not exists idx_adjuntos_proveedor on adjuntos(proveedor_id);

-- ============================================================
-- Vista de lectura: une todo para que el frontend haga 1 sola query
-- ============================================================
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
  coalesce(att.adjuntos_count, 0)      as adjuntos_count
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

-- ============================================================
-- Funciones RPC: escritura atómica desde el frontend
-- ============================================================

-- Resuelve (o crea) la cadena país→región→ciudad y devuelve el id de ciudad.
create or replace function obtener_o_crear_geo(p_pais text, p_region text, p_ciudad text)
returns bigint language plpgsql as $$
declare v_pais_id bigint; v_region_id bigint; v_ciudad_id bigint;
begin
  if p_pais is null or btrim(p_pais) = '' then return null; end if;

  insert into paises (nombre) values (btrim(p_pais))
    on conflict (nombre) do update set nombre = excluded.nombre
    returning id into v_pais_id;

  if p_region is null or btrim(p_region) = '' then return null; end if;

  insert into regiones (pais_id, nombre) values (v_pais_id, btrim(p_region))
    on conflict (pais_id, nombre) do update set nombre = excluded.nombre
    returning id into v_region_id;

  if p_ciudad is null or btrim(p_ciudad) = '' then return null; end if;

  insert into ciudades (region_id, nombre) values (v_region_id, btrim(p_ciudad))
    on conflict (region_id, nombre) do update set nombre = excluded.nombre
    returning id into v_ciudad_id;

  return v_ciudad_id;
end; $$;

-- Crea o actualiza un proveedor junto con su lista de servicios (texto libre).
create or replace function guardar_proveedor(
  p_id              uuid,
  p_nombre          text,
  p_categoria_id    bigint,
  p_estado_id       bigint,
  p_pais            text,
  p_region          text,
  p_ciudad          text,
  p_contacto_nombre text,
  p_telefono        text,
  p_email           text,
  p_score           smallint,
  p_presupuesto_id  bigint,
  p_cobertura_id    bigint,
  p_notas           text,
  p_servicios       text[]
) returns uuid language plpgsql as $$
declare
  v_id uuid;
  v_ciudad_id bigint;
  s text;
  v_servicio_id bigint;
begin
  v_ciudad_id := obtener_o_crear_geo(p_pais, p_region, p_ciudad);

  if p_id is null then
    insert into proveedores (
      nombre, categoria_id, estado_id, ciudad_id, contacto_nombre,
      telefono, email, score, presupuesto_id, cobertura_id, notas
    ) values (
      p_nombre, p_categoria_id, p_estado_id, v_ciudad_id, p_contacto_nombre,
      p_telefono, p_email, p_score, p_presupuesto_id, p_cobertura_id, p_notas
    ) returning id into v_id;
  else
    update proveedores set
      nombre = p_nombre, categoria_id = p_categoria_id, estado_id = p_estado_id,
      ciudad_id = v_ciudad_id, contacto_nombre = p_contacto_nombre,
      telefono = p_telefono, email = p_email, score = p_score,
      presupuesto_id = p_presupuesto_id, cobertura_id = p_cobertura_id, notas = p_notas
    where id = p_id
    returning id into v_id;

    delete from proveedor_servicios where proveedor_id = v_id;
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

-- ============================================================
-- Row Level Security — MVP sin autenticación: acceso abierto vía
-- anon key. Si más adelante se agrega login, reemplazar `using (true)`
-- por reglas basadas en auth.uid().
-- ============================================================
alter table paises               enable row level security;
alter table regiones              enable row level security;
alter table ciudades              enable row level security;
alter table categorias            enable row level security;
alter table estados_proveedor     enable row level security;
alter table rangos_presupuesto    enable row level security;
alter table tipos_cobertura       enable row level security;
alter table servicios             enable row level security;
alter table proveedores           enable row level security;
alter table proveedor_servicios   enable row level security;
alter table adjuntos              enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array[
    'paises','regiones','ciudades','categorias','estados_proveedor',
    'rangos_presupuesto','tipos_cobertura','servicios','proveedores',
    'proveedor_servicios','adjuntos'
  ])
  loop
    execute format('drop policy if exists "acceso_publico_select" on %I', t);
    execute format('create policy "acceso_publico_select" on %I for select using (true)', t);
    execute format('drop policy if exists "acceso_publico_insert" on %I', t);
    execute format('create policy "acceso_publico_insert" on %I for insert with check (true)', t);
    execute format('drop policy if exists "acceso_publico_update" on %I', t);
    execute format('create policy "acceso_publico_update" on %I for update using (true) with check (true)', t);
    execute format('drop policy if exists "acceso_publico_delete" on %I', t);
    execute format('create policy "acceso_publico_delete" on %I for delete using (true)', t);
  end loop;
end $$;

-- ============================================================
-- Storage: bucket público para adjuntos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('adjuntos', 'adjuntos', true)
on conflict (id) do nothing;

drop policy if exists "adjuntos_publicos_select" on storage.objects;
create policy "adjuntos_publicos_select" on storage.objects
  for select using (bucket_id = 'adjuntos');

drop policy if exists "adjuntos_publicos_insert" on storage.objects;
create policy "adjuntos_publicos_insert" on storage.objects
  for insert with check (bucket_id = 'adjuntos');

drop policy if exists "adjuntos_publicos_delete" on storage.objects;
create policy "adjuntos_publicos_delete" on storage.objects
  for delete using (bucket_id = 'adjuntos');
