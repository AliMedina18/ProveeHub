-- ============================================================
-- Seed: catálogos de dominio (valores fijos del MVP original)
-- ============================================================

insert into categorias (nombre) values
  ('Producción audiovisual'),('Escenografía y montaje'),('Iluminación y sonido'),
  ('Catering y F&B'),('Logística y transporte'),('Tecnología e interactividad'),
  ('Entretenimiento y artistas'),('Fotografía y video'),('Impresos y señalética'),
  ('Seguridad y protocolo'),('Mobiliario y decoración'),('Otro')
on conflict (nombre) do nothing;

insert into estados_proveedor (nombre, color_bg, color_fg, orden) values
  ('Activo',        '#EAF3DE', '#27500A', 1),
  ('En evaluación', '#FAEEDA', '#633806', 2),
  ('Pausado',       '#F1EFE8', '#444441', 3),
  ('Bloqueado',     '#FCEBEB', '#791F1F', 4)
on conflict (nombre) do nothing;

insert into rangos_presupuesto (nombre, orden) values
  ('$ Bajo (<20k)', 1),
  ('$$ Medio (20k–100k)', 2),
  ('$$$ Alto (100k–500k)', 3),
  ('$$$$ Premium (>500k)', 4)
on conflict (nombre) do nothing;

insert into tipos_cobertura (nombre, orden) values
  ('Solo ciudad', 1),
  ('Regional', 2),
  ('Nacional', 3),
  ('Internacional', 4)
on conflict (nombre) do nothing;
