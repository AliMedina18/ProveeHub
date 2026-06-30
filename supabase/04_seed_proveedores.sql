-- ============================================================
-- Seed de proveedores de ejemplo (los 10 del HTML original)
-- Usa la función guardar_proveedor() para insertar de forma
-- atómica: crea/reusa geografía y servicios automáticamente.
-- ============================================================

select guardar_proveedor(
  null,
  'Grupo Luminary',
  (select id from categorias where nombre='Iluminación y sonido'),
  (select id from estados_proveedor where nombre='Activo'),
  'México', 'Ciudad de México', 'CDMX – Benito Juárez',
  'Rafael Torres', '+52 55 8823 4401', 'rafael@luminary.mx',
  5,
  (select id from rangos_presupuesto where nombre='$$$ Alto (100k–500k)'),
  (select id from tipos_cobertura where nombre='Nacional'),
  'Go-to para eventos premium. Descuento 10% con contrato anual. Pedir a Rafael 3 semanas antes.',
  array['Iluminación arquitectónica','sonido line array','generadores']::text[]
);

select guardar_proveedor(
  null,
  'EvenTech México',
  (select id from categorias where nombre='Tecnología e interactividad'),
  (select id from estados_proveedor where nombre='Activo'),
  'México', 'Nuevo León', 'Monterrey',
  'Sofía Mendoza', '+52 81 7744 9900', 'sofia@eventech.mx',
  5,
  (select id from rangos_presupuesto where nombre='$$$ Alto (100k–500k)'),
  (select id from tipos_cobertura where nombre='Nacional'),
  'Requieren brief técnico detallado. Solo trabajan con 50% de anticipo.',
  array['Video mapping','realidad aumentada','pantallas LED','gamificación']::text[]
);

select guardar_proveedor(
  null,
  'Flash Studios',
  (select id from categorias where nombre='Fotografía y video'),
  (select id from estados_proveedor where nombre='Activo'),
  'México', 'Ciudad de México', 'CDMX – Coyoacán',
  'Diego Ramírez', '+52 55 6677 8899', 'diego@flashstudios.mx',
  5,
  (select id from rangos_presupuesto where nombre='$$ Medio (20k–100k)'),
  (select id from tipos_cobertura where nombre='Nacional'),
  'Entrega en 48h. Pack completo con edición incluida. Los mejores para recaps ejecutivos.',
  array['Fotografía editorial','video recap','transmisión en vivo','drone']::text[]
);

select guardar_proveedor(
  null,
  'Sabores & Experiencias',
  (select id from categorias where nombre='Catering y F&B'),
  (select id from estados_proveedor where nombre='Activo'),
  'México', 'Jalisco', 'Guadalajara',
  'Carmen Ríos', '+52 33 5511 2233', 'carmen@sabores.com.mx',
  4,
  (select id from rangos_presupuesto where nombre='$$ Medio (20k–100k)'),
  (select id from tipos_cobertura where nombre='Regional'),
  'Excelente presentación. Han fallado en eventos masivos (+500 pax). Ideales para ejecutivos.',
  array['Catering gourmet','barras de cocteles','coffee breaks','food trucks']::text[]
);

select guardar_proveedor(
  null,
  'Crea Eventos Bogotá',
  (select id from categorias where nombre='Escenografía y montaje'),
  (select id from estados_proveedor where nombre='Activo'),
  'Colombia', 'Bogotá D.C.', 'Bogotá',
  'Laura Quintero', '+57 310 444 8800', 'laura@creaev.co',
  5,
  (select id from rangos_presupuesto where nombre='$$$ Alto (100k–500k)'),
  (select id from tipos_cobertura where nombre='Nacional'),
  'Referencia de Coca-Cola Colombia. Los mejores en escenografía del país. Reservar con 1 mes.',
  array['Escenografías custom','stands','estructuras','carpas premium']::text[]
);

select guardar_proveedor(
  null,
  'Sonido Élite Colombia',
  (select id from categorias where nombre='Iluminación y sonido'),
  (select id from estados_proveedor where nombre='Activo'),
  'Colombia', 'Antioquia', 'Medellín',
  'Andrés Mejía', '+57 304 777 5500', 'andres@sonidoelite.co',
  4,
  (select id from rangos_presupuesto where nombre='$$ Medio (20k–100k)'),
  (select id from tipos_cobertura where nombre='Regional'),
  'Cubren Antioquia y Eje Cafetero. Precios competitivos. Muy puntuales.',
  array['Sonido line array','iluminación escénica','backline']::text[]
);

select guardar_proveedor(
  null,
  'Cartagena Sound Pro',
  (select id from categorias where nombre='Iluminación y sonido'),
  (select id from estados_proveedor where nombre='Activo'),
  'Colombia', 'Bolívar', 'Cartagena',
  'Iván Herrera', '+57 312 555 7788', 'ivan@ctgsound.co',
  4,
  (select id from rangos_presupuesto where nombre='$$ Medio (20k–100k)'),
  (select id from tipos_cobertura where nombre='Regional'),
  'Excelentes para eventos en la costa. Conocen bien los venues del centro histórico.',
  array['Sonido line array','iluminación eventos','DJ técnico']::text[]
);

select guardar_proveedor(
  null,
  'Barranquilla Produce',
  (select id from categorias where nombre='Producción audiovisual'),
  (select id from estados_proveedor where nombre='Activo'),
  'Colombia', 'Atlántico', 'Barranquilla',
  'Claudia Rueda', '+57 300 888 4412', 'claudia@bqproduce.co',
  4,
  (select id from rangos_presupuesto where nombre='$$ Medio (20k–100k)'),
  (select id from tipos_cobertura where nombre='Regional'),
  'Muy activos durante el Carnaval. Tienen contactos con todos los venues de Barranquilla.',
  array['Producción audiovisual','streaming','LED wall','operación técnica']::text[]
);

select guardar_proveedor(
  null,
  'LA Event Tech',
  (select id from categorias where nombre='Tecnología e interactividad'),
  (select id from estados_proveedor where nombre='Activo'),
  'Estados Unidos', 'California', 'Los Angeles',
  'Mark Sullivan', '+1 310 444 9988', 'mark@laeventtech.com',
  4,
  (select id from rangos_presupuesto where nombre='$$$$ Premium (>500k)'),
  (select id from tipos_cobertura where nombre='Internacional'),
  'Para proyectos binacionales con presencia en LA. Hablan español.',
  array['AR/VR experiencial','pantallas holográficas','mapping avanzado']::text[]
);

select guardar_proveedor(
  null,
  'SegurEvent',
  (select id from categorias where nombre='Seguridad y protocolo'),
  (select id from estados_proveedor where nombre='Bloqueado'),
  'México', 'Ciudad de México', 'CDMX – Cuauhtémoc',
  'Bernardo Leal', '+52 55 4400 5566', 'bleal@segurevent.mx',
  2,
  (select id from rangos_presupuesto where nombre='$ Bajo (<20k)'),
  (select id from tipos_cobertura where nombre='Solo ciudad'),
  'BLOQUEADO. Falla en Evento Farma 2024: 2 guardias no se presentaron.',
  array['Control de acceso','guardias','protocolo de emergencias']::text[]
);

-- Adjuntos (links) de ejemplo
insert into adjuntos (proveedor_id, tipo, nombre, url, meta, creado_en) select id, 'link', 'Portafolio 2024', 'https://drive.google.com', 'drive.google.com', '2024-03-10' from proveedores where nombre='Grupo Luminary';
insert into adjuntos (proveedor_id, tipo, nombre, url, meta, creado_en) select id, 'link', 'Contrato marco vigente', 'https://docs.google.com', 'docs.google.com', '2024-01-15' from proveedores where nombre='Grupo Luminary';
insert into adjuntos (proveedor_id, tipo, nombre, url, meta, creado_en) select id, 'link', 'Catálogo de equipos', 'https://eventech.mx/catalogo', 'eventech.mx', '2024-02-20' from proveedores where nombre='EvenTech México';
insert into adjuntos (proveedor_id, tipo, nombre, url, meta, creado_en) select id, 'link', 'Fotos evento Coca-Cola 2023', 'https://drive.google.com', 'drive.google.com', '2023-11-05' from proveedores where nombre='Crea Eventos Bogotá';
insert into adjuntos (proveedor_id, tipo, nombre, url, meta, creado_en) select id, 'link', 'Reporte de incidente Farma 2024', 'https://docs.google.com', 'docs.google.com', '2024-05-18' from proveedores where nombre='SegurEvent';
