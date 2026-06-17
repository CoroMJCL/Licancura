-- ============================================================
-- MÁRMOLES LICANCURA — Setup completo Supabase
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- ── EXTENSIONES ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── TABLA: textos (contenido editable del sitio) ─────────────
create table if not exists textos (
  id          uuid primary key default uuid_generate_v4(),
  clave       text unique not null,
  valor       text not null,
  updated_at  timestamptz default now()
);

-- ── TABLA: estadisticas ──────────────────────────────────────
create table if not exists estadisticas (
  id          uuid primary key default uuid_generate_v4(),
  clave       text unique not null,
  valor       text not null,
  updated_at  timestamptz default now()
);

-- ── TABLA: servicios ─────────────────────────────────────────
create table if not exists servicios (
  id          uuid primary key default uuid_generate_v4(),
  orden       int not null,
  nombre      text not null,
  descripcion text not null,
  updated_at  timestamptz default now()
);

-- ── TABLA: proyectos ─────────────────────────────────────────
create table if not exists proyectos (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  categoria   text not null,
  descripcion text,
  imagen_url  text,
  orden       int default 0,
  activo      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── TABLA: materiales ────────────────────────────────────────
create table if not exists materiales (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  precio_base numeric not null,
  orden       int default 0,
  activo      boolean default true,
  updated_at  timestamptz default now()
);

-- ── TABLA: tipos_trabajo ─────────────────────────────────────
create table if not exists tipos_trabajo (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  factor      numeric not null default 1.0,
  orden       int default 0,
  activo      boolean default true,
  updated_at  timestamptz default now()
);

-- ── TABLA: acabados ──────────────────────────────────────────
create table if not exists acabados (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  extra_m2    numeric not null default 0,
  orden       int default 0,
  activo      boolean default true,
  updated_at  timestamptz default now()
);

-- ── TABLA: cotizaciones ──────────────────────────────────────
create table if not exists cotizaciones (
  id              uuid primary key default uuid_generate_v4(),
  material        text,
  tipo_trabajo    text,
  acabado         text,
  metros2         numeric,
  precio_unitario numeric,
  subtotal        numeric,
  iva             numeric,
  total           numeric,
  created_at      timestamptz default now()
);

-- ── TABLA: contactos ─────────────────────────────────────────
create table if not exists contactos (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  email       text not null,
  telefono    text,
  tipo        text,
  mensaje     text,
  leido       boolean default false,
  created_at  timestamptz default now()
);

-- ── TABLA: configuracion (WhatsApp, horario, etc.) ───────────
create table if not exists configuracion (
  id          uuid primary key default uuid_generate_v4(),
  clave       text unique not null,
  valor       text not null,
  updated_at  timestamptz default now()
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Textos
insert into textos (clave, valor) values
  ('about_titulo',    'Más de dos décadas de oficio y precisión.'),
  ('about_cuerpo',    'Somos una empresa familiar fundada en Chile, especializada en la instalación y fabricación de superficies en piedra natural. Atendemos proyectos residenciales, comerciales y hoteleros con el mismo nivel de exigencia y dedicación artesanal.'),
  ('about_frase',     '"La calidad se ve. La excelencia se siente."'),
  ('about_frase_sub', 'Mármoles Licancura · Desde 2004')
on conflict (clave) do nothing;

-- Estadísticas
insert into estadisticas (clave, valor) values
  ('proyectos', '800'),
  ('anos',      '20'),
  ('clientes',  '500'),
  ('maestros',  '12')
on conflict (clave) do nothing;

-- Servicios
insert into servicios (orden, nombre, descripcion) values
  (1, 'Mesones y Encimeras',  'Diseño y fabricación a medida en mármol, granito y cuarcita. Cortes, bordes y acabados personalizados para cocinas y baños.'),
  (2, 'Revestimientos',       'Pisos, paredes y fachadas en piedra natural. Instalación profesional con garantía de terminación impecable.'),
  (3, 'Baños y Spa',          'Ambientes premium con selección exclusiva de materiales naturales. Desde el plano hasta la entrega final.'),
  (4, 'Restauración',         'Recuperación y tratamiento de superficies en piedra. Pulido, sellado y rejuvenecimiento de instalaciones existentes.')
on conflict do nothing;

-- Proyectos
insert into proyectos (nombre, categoria, descripcion, orden) values
  ('Cocina Residencial Las Condes', 'Mesón Mármol Calacatta',  'Calacatta con bordes waterfall y pulido espejo', 1),
  ('Suite Hotel Grand Hyatt',       'Revestimiento Travertino', 'Travertino Romano piso a techo, 3 baños suite',  2),
  ('Lobby Corporativo Isidora',     'Piso Mármol Carrara',     '450 m² con diseño geométrico y juntas de 1mm',  3),
  ('Cocina Gourmet Chicureo',       'Mesón Cuarcita Blanca',   'Cuarcita con unión perfecta y borde eased',     4),
  ('Terraza Residencial La Dehesa', 'Piso Granito Negro',      'Granito Negro Absoluto flameado antideslizante', 5)
on conflict do nothing;

-- Materiales
insert into materiales (nombre, precio_base, orden) values
  ('Mármol Carrara',         185000, 1),
  ('Granito Negro Absoluto', 120000, 2),
  ('Cuarcita Blanca',        210000, 3),
  ('Travertino Romano',      145000, 4),
  ('Mármol Calacatta',       250000, 5)
on conflict do nothing;

-- Tipos de trabajo
insert into tipos_trabajo (nombre, factor, orden) values
  ('Mesón / Encimera',    1.00, 1),
  ('Revestimiento pared', 0.90, 2),
  ('Piso',                0.85, 3),
  ('Baño completo',       1.20, 4),
  ('Escalera',            1.40, 5)
on conflict do nothing;

-- Acabados
insert into acabados (nombre, extra_m2, orden) values
  ('Pulido brillante',   0,     1),
  ('Satinado mate',      15000, 2),
  ('Busheado / textura', 22000, 3),
  ('Envejecido',         28000, 4)
on conflict do nothing;

-- Configuración
insert into configuracion (clave, valor) values
  ('wa_numero',  '56223456789'),
  ('telefono',   '+56 2 2345 6789'),
  ('email',      'contacto@licancura.cl'),
  ('direccion',  'Av. Principal 1234, Santiago'),
  ('horario',    'Lun–Vie 9:00–18:00 · Sáb 9:00–13:00')
on conflict (clave) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
alter table textos          enable row level security;
alter table estadisticas    enable row level security;
alter table servicios       enable row level security;
alter table proyectos       enable row level security;
alter table materiales      enable row level security;
alter table tipos_trabajo   enable row level security;
alter table acabados        enable row level security;
alter table cotizaciones    enable row level security;
alter table contactos       enable row level security;
alter table configuracion   enable row level security;

-- Lectura pública (visitantes del sitio)
create policy "lectura_publica" on textos        for select using (true);
create policy "lectura_publica" on estadisticas  for select using (true);
create policy "lectura_publica" on servicios     for select using (true);
create policy "lectura_publica" on proyectos     for select using (activo = true);
create policy "lectura_publica" on materiales    for select using (activo = true);
create policy "lectura_publica" on tipos_trabajo for select using (activo = true);
create policy "lectura_publica" on acabados      for select using (activo = true);
create policy "lectura_publica" on configuracion for select using (true);

-- Inserción pública (cotizaciones y contactos desde el formulario)
create policy "insertar_cotizacion" on cotizaciones for insert with check (true);
create policy "insertar_contacto"   on contactos    for insert with check (true);

-- Escritura solo para usuarios autenticados (admin)
create policy "admin_textos"        on textos        for all using (auth.role() = 'authenticated');
create policy "admin_estadisticas"  on estadisticas  for all using (auth.role() = 'authenticated');
create policy "admin_servicios"     on servicios     for all using (auth.role() = 'authenticated');
create policy "admin_proyectos"     on proyectos     for all using (auth.role() = 'authenticated');
create policy "admin_materiales"    on materiales    for all using (auth.role() = 'authenticated');
create policy "admin_trabajos"      on tipos_trabajo for all using (auth.role() = 'authenticated');
create policy "admin_acabados"      on acabados      for all using (auth.role() = 'authenticated');
create policy "admin_cotizaciones"  on cotizaciones  for select using (auth.role() = 'authenticated');
create policy "admin_contactos"     on contactos     for all using (auth.role() = 'authenticated');
create policy "admin_configuracion" on configuracion for all using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE: bucket para imágenes de proyectos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('proyectos', 'proyectos', true)
on conflict do nothing;

create policy "imagenes_publicas" on storage.objects
  for select using (bucket_id = 'proyectos');

create policy "admin_subir_imagenes" on storage.objects
  for insert with check (bucket_id = 'proyectos' and auth.role() = 'authenticated');

create policy "admin_borrar_imagenes" on storage.objects
  for delete using (bucket_id = 'proyectos' and auth.role() = 'authenticated');
