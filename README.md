# ProveeHub — Base de Proveedores (Marketing Experiencial)

MVP de gestión de proveedores: Next.js (App Router) + Supabase (Postgres +
Storage), desplegable en Vercel. Sin login (uso interno abierto).

- Modelo relacional normalizado (1FN→4FN): ver [`docs/modelo-relacional.md`](docs/modelo-relacional.md)
- Esquema y seed de Supabase: carpeta [`supabase/`](supabase)
- Versión original (HTML estático, datos en memoria): [`docs/legacy-original.html`](docs/legacy-original.html)

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project**. Elige una
   contraseña de base de datos y guárdala.
2. Cuando el proyecto esté listo, ve a **SQL Editor** y ejecuta, **en este
   orden exacto**, el contenido de cada archivo de la carpeta `supabase/`:
   1. `01_schema.sql` — crea tablas, vista, funciones, RLS y el bucket de Storage.
   2. `02_seed_catalogos.sql` — categorías, estados, presupuestos, cobertura.
   3. `03_seed_geografia.sql` — catálogo de países/departamentos/ciudades (CO/MX/US).
   4. `04_seed_proveedores.sql` — los 10 proveedores de ejemplo del MVP original.

   (Puedes pegar cada archivo completo en el SQL Editor y darle **Run**.)
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Verifica en **Storage** que exista el bucket `adjuntos` (lo crea el script
   `01_schema.sql` automáticamente, marcado como público).

> **Nota de seguridad:** este MVP no tiene autenticación, así que las políticas
> RLS quedan abiertas (`using (true)`) para la clave `anon`. Cualquiera con el
> link de la app puede leer/escribir. Es apropiado para una herramienta interna
> de equipo; si más adelante se necesita login, hay que reemplazar esas
> políticas por reglas basadas en `auth.uid()`.

## 2. Configurar el proyecto localmente

```bash
npm install
cp .env.local.example .env.local
# Edita .env.local con tu URL y anon key de Supabase
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 3. Desplegar en Vercel

1. Sube este repo a GitHub si aún no lo has hecho (`git push`).
2. Entra a [vercel.com](https://vercel.com) → **Add New… → Project** → importa
   el repo `AliMedina18/ProveeHub`.
3. Vercel detecta Next.js automáticamente (no requiere configuración extra).
4. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Cuando termine, tu app queda en `https://<tu-proyecto>.vercel.app`.

Cada vez que hagas `git push` a `main`, Vercel vuelve a desplegar automáticamente.

## 4. Estructura del proyecto

```
src/
  app/
    page.js          # Página principal (cliente): grid, filtros, modal, panel de detalle
    layout.js
    globals.css       # Estilos (porteados del HTML original, responsive)
  components/
    Header, StatsRow, Toolbar, ProviderGrid, ProviderCard,
    ProviderModal (alta/edición con ubicación en cascada),
    DetailPanel, AttachmentsSection, Toast
  lib/
    supabaseClient.js # Cliente de Supabase (anon key)
    api.js             # Toda la lectura/escritura a Supabase (CRUD + adjuntos)
    ui.js               # Helpers de presentación (avatares, estrellas, iconos)
supabase/
  01_schema.sql … 04_seed_proveedores.sql
docs/
  modelo-relacional.md  # Justificación de 1FN–4FN
  legacy-original.html  # Versión original (referencia)
```

## 5. Funcionalidad

- CRUD completo de proveedores (alta, edición, baja) persistido en Supabase.
- Ubicación en cascada País → Departamento/Estado → Ciudad, con opción de
  agregar valores nuevos (se guardan en el catálogo para todo el equipo).
- Servicios como tags de texto libre (se normalizan en la tabla `servicios`).
- Adjuntos: subida real de archivos a Supabase Storage o links externos.
- Filtros por país, región, categoría, estado y score; búsqueda de texto.
- Exportar CSV.
- Diseño responsive (grid adaptable, panel de detalle a pantalla completa en móvil).
