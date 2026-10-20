-- =============================================================
-- Inventario e-commerce · esquema de base de datos (Supabase)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- Es idempotente: se puede volver a ejecutar sin romper nada.
-- =============================================================

-- ---------- Tabla de productos ----------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  sku          text not null unique,
  slug         text not null unique,
  name         text not null,
  description  text,
  category     text,
  brand        text,
  price        numeric(12,2) not null check (price >= 0),
  sale_price   numeric(12,2) check (sale_price is null or (sale_price >= 0 and sale_price < price)),
  -- Precio que realmente paga el cliente: se usa para filtrar y ordenar.
  final_price  numeric(12,2) generated always as (coalesce(sale_price, price)) stored,
  stock        integer not null default 0 check (stock >= 0),
  images       text[] not null default '{}',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_active_created_idx on public.products (is_active, created_at desc);
create index if not exists products_final_price_idx    on public.products (final_price);
create index if not exists products_category_idx       on public.products (category);

-- Mantener updated_at al día
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------- Vista de categorías (para los filtros) ----------
-- security_invoker = true → respeta las políticas RLS de quien consulta.
create or replace view public.product_categories
with (security_invoker = true) as
  select category as name, count(*)::int as total
  from public.products
  where is_active and category is not null and category <> ''
  group by category
  order by category;

-- ---------- Row Level Security ----------
alter table public.products enable row level security;

drop policy if exists "Público ve productos activos" on public.products;
create policy "Público ve productos activos"
  on public.products for select
  to anon
  using (is_active);

drop policy if exists "Admins gestionan productos" on public.products;
create policy "Admins gestionan productos"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- =============================================================
-- Storage: bucket público para imágenes de productos
-- =============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/avif','image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Imágenes de productos: lectura pública" on storage.objects;
create policy "Imágenes de productos: lectura pública"
  on storage.objects for select
  using (bucket_id = 'productos');

drop policy if exists "Imágenes de productos: admins suben" on storage.objects;
create policy "Imágenes de productos: admins suben"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'productos');

drop policy if exists "Imágenes de productos: admins actualizan" on storage.objects;
create policy "Imágenes de productos: admins actualizan"
  on storage.objects for update to authenticated
  using (bucket_id = 'productos');

drop policy if exists "Imágenes de productos: admins eliminan" on storage.objects;
create policy "Imágenes de productos: admins eliminan"
  on storage.objects for delete to authenticated
  using (bucket_id = 'productos');
