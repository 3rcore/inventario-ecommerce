import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { ADMIN_PAGE_SIZE, PAGE_SIZE } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient, createSessionClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "./filters";
import type { CatalogFilters, Category, Paginated, Product } from "./types";

export const PRODUCTS_TAG = "products";

const CARD_COLUMNS =
  "id, sku, slug, name, category, brand, price, sale_price, final_price, stock, images, is_active, created_at, updated_at, description";

const empty = <T,>(page = 1): Paginated<T> => ({ items: [], total: 0, page, pageCount: 0 });

/* ------------------------------------------------------------------ */
/* Catálogo público (cacheado, se invalida con updateTag(PRODUCTS_TAG)) */
/* ------------------------------------------------------------------ */

export async function getCatalogProducts(filters: CatalogFilters): Promise<Paginated<Product>> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("minutes");

  if (!isSupabaseConfigured) return empty(filters.page);

  const from = (filters.page - 1) * PAGE_SIZE;
  let query = createPublicClient()
    .from("products")
    .select(CARD_COLUMNS, { count: "exact" })
    .eq("is_active", true);

  const q = filters.q && sanitizeSearch(filters.q);
  if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,brand.ilike.%${q}%`);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.minPrice !== undefined) query = query.gte("final_price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("final_price", filters.maxPrice);
  if (filters.inStock) query = query.gt("stock", 0);
  if (filters.onSale) query = query.not("sale_price", "is", null);

  switch (filters.sort) {
    case "precio-asc":
      query = query.order("final_price", { ascending: true });
      break;
    case "precio-desc":
      query = query.order("final_price", { ascending: false });
      break;
    case "nombre":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.order("id").range(from, from + PAGE_SIZE - 1);
  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);

  const total = count ?? 0;
  return { items: (data ?? []) as Product[], total, page: filters.page, pageCount: Math.ceil(total / PAGE_SIZE) };
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("minutes");

  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient().from("product_categories").select("name, total");
  if (error) throw new Error(`No se pudieron cargar las categorías: ${error.message}`);
  return data ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("minutes");

  if (!isSupabaseConfigured) return null;
  const { data, error } = await createPublicClient()
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Product | null;
}

export async function getLatestProducts(limit: number): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("minutes");

  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient()
    .from("products")
    .select(CARD_COLUMNS)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`No se pudieron cargar las novedades: ${error.message}`);
  return (data ?? []) as Product[];
}

export async function getRelatedProducts(category: string, excludeId: string): Promise<Product[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("minutes");

  if (!isSupabaseConfigured) return [];
  const { data } = await createPublicClient()
    .from("products")
    .select(CARD_COLUMNS)
    .eq("is_active", true)
    .eq("category", category)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(4);
  return (data ?? []) as Product[];
}

/* ------------------------------------------------------------------ */
/* Panel admin (dinámico, con la sesión del usuario)                  */
/* ------------------------------------------------------------------ */

export async function getAdminProducts({ q, page }: { q?: string; page: number }): Promise<Paginated<Product>> {
  if (!isSupabaseConfigured) return empty(page);

  const supabase = await createSessionClient();
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  let query = supabase.from("products").select(CARD_COLUMNS, { count: "exact" });

  const term = q && sanitizeSearch(q);
  if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,category.ilike.%${term}%`);

  const { data, count, error } = await query
    .order("updated_at", { ascending: false })
    .order("id")
    .range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return { items: (data ?? []) as Product[], total, page, pageCount: Math.ceil(total / ADMIN_PAGE_SIZE) };
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Product | null;
}

export async function getInventoryStats() {
  if (!isSupabaseConfigured) return { total: 0, active: 0, outOfStock: 0 };
  const supabase = await createSessionClient();
  const head = () => supabase.from("products").select("id", { count: "exact", head: true });

  const [total, active, outOfStock] = await Promise.all([
    head(),
    head().eq("is_active", true),
    head().eq("stock", 0),
  ]);
  return { total: total.count ?? 0, active: active.count ?? 0, outOfStock: outOfStock.count ?? 0 };
}
