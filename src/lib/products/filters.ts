import { SORT_OPTIONS, type CatalogFilters, type SortOption } from "./types";

type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

const toPositiveNumber = (v: string | undefined) => {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const isSort = (v: string | undefined): v is SortOption => SORT_OPTIONS.some((o) => o.value === v);

/** Convierte los searchParams de la URL en filtros tipados y saneados. */
export function parseCatalogFilters(sp: RawSearchParams): CatalogFilters {
  const sort = first(sp.orden);
  const page = Math.max(1, Math.floor(Number(first(sp.pagina)) || 1));

  return {
    q: first(sp.q)?.slice(0, 100),
    category: first(sp.categoria),
    minPrice: toPositiveNumber(first(sp.min)),
    maxPrice: toPositiveNumber(first(sp.max)),
    inStock: first(sp.stock) === "1" || undefined,
    onSale: first(sp.oferta) === "1" || undefined,
    sort: isSort(sort) ? sort : "recientes",
    page,
  };
}

/**
 * Quita los caracteres con significado especial en los filtros de PostgREST
 * (coma, paréntesis, comodines) para evitar inyección en `.or()` / `.ilike()`.
 */
export function sanitizeSearch(q: string) {
  return q.replace(/[,()*%\\]/g, " ").replace(/\s+/g, " ").trim();
}
