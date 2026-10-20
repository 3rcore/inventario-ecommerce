# Inventario e-commerce (modelo)

Catálogo público + panel de inventario para que cada cliente suba sus productos **uno por uno o por lote desde Excel/CSV**, con imágenes en **Supabase Storage**. Pensado como demo comercial de 3R Core.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Auth + Storage) · Zod · PapaParse · SheetJS.

## Funcionalidades

**Tienda (`/`)**
- Grilla de productos estilo Ducas Import, con detalle en `/producto/[slug]` y galería.
- Filtros generales guardados en la URL: búsqueda, categoría, rango de precio, "solo con stock" y "en oferta".
- Orden: más recientes, precio menor→mayor, mayor→menor y nombre.
- Paginación del lado del servidor. Las consultas se cachean y se invalidan al guardar.
- Botón "Consultar por WhatsApp" (opcional).

**Panel (`/admin`, requiere login)**
- Listado con búsqueda, stock, interruptor publicar/ocultar, editar y eliminar.
- Formulario de producto con subida de varias imágenes (arrastrar y soltar, reordenar, URL externa).
- **Importación por lote** (`/admin/importar`):
  - Lee `.xlsx`, `.xls` y `.csv` (con `,` o `;`).
  - Reconoce los encabezados de la plantilla propia y los de una **exportación de WooCommerce**.
  - Muestra una vista previa con errores por fila antes de guardar.
  - Hace upsert por **SKU**: actualiza los productos que ya existen o los omite, según lo que elijas.
  - Las imágenes pueden venir como URLs o como nombres de archivo que se suben junto con la planilla.
  - Hay plantillas descargables en Excel y CSV.
- **Exportar CSV** del inventario completo, en el mismo formato que la importación.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar con los datos de Supabase
npm run dev
```

Sin las variables de Supabase, la web arranca en "modo demo": muestra un aviso y el catálogo aparece vacío.

### Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo. El script crea:
   - la tabla `products` con sus índices, el trigger de `updated_at` y la vista de categorías;
   - las políticas **RLS**: el público solo lee productos activos y únicamente el **rol admin** puede escribir;
   - el bucket público **`productos`** (máximo 5 MB, solo imágenes) con sus políticas de Storage.
3. Abre [`supabase/admin.sql`](supabase/admin.sql), cambia el correo y la contraseña, y ejecútalo en el SQL Editor. Crea el usuario admin (o actualiza su contraseña si ya existe).
4. En **Project Settings → API**, copia la URL y la *publishable key* a `.env.local`.

**Admin solo por SQL:** el panel exige `app_metadata.role = 'admin'`, un dato que solo se puede asignar desde SQL. Si alguien se registra por su cuenta, igual no entra al panel ni puede modificar datos. Opcionalmente puedes desactivar *Allow new users to sign up* en Authentication.

> Si usas otro nombre de bucket, cámbialo en `schema.sql` y en `NEXT_PUBLIC_SUPABASE_BUCKET`.

### Despliegue en Vercel

Importa el repositorio y agrega las mismas variables de entorno. No hace falta ninguna otra configuración.

## Estructura

```
supabase/schema.sql          Tablas, RLS, bucket y políticas
supabase/admin.sql           Crear / actualizar el usuario admin
src/proxy.ts                 Refresca la sesión y protege /admin (antes "middleware")
src/config/site.ts           Nombre de marca, moneda, WhatsApp, límites
src/lib/supabase/            Clientes: sesión (server), público (cacheable), navegador
src/lib/products/
  schema.ts                  Validación Zod única (formulario, importación y servidor)
  queries.ts                 Lecturas: catálogo con 'use cache' y panel dinámico
  import.ts                  Lectura de CSV/Excel, alias de columnas, parseo de precios
  filters.ts / url.ts        Filtros ⇄ URL
src/app/actions/             Server Actions: CRUD, importación por lote, login
src/app/(shop)/              Tienda pública
src/app/admin/               Panel de inventario
src/components/              UI (catalog, admin, layout, ui)
```

## Decisiones técnicas

- **Seguridad:**
  - RLS en la base de datos es la barrera real.
  - Además, cada Server Action vuelve a verificar la sesión y a validar los datos con Zod, porque no confía en lo que manda el navegador.
  - La búsqueda se sanea antes de pasarla a los filtros de PostgREST.
- **Imágenes:**
  - Se suben directo del navegador al bucket con la sesión del admin, así no pasan por el servidor de Next ni chocan con el límite de tamaño de las Server Actions.
  - Al editar o eliminar un producto, se borran del bucket las imágenes que deja de usar.
- **Importación masiva:**
  - El archivo se procesa en el navegador. Las filas válidas se envían en lotes de 100 y el servidor las vuelve a validar.
  - Si una fila no trae imágenes, no se borran las que el producto ya tenía.
- **Cache:**
  - El catálogo usa `'use cache'` con `cacheTag('products')`.
  - Cada escritura llama a `updateTag('products')`, así los cambios se ven al instante.
