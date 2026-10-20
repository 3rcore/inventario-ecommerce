import type { CatalogFilters } from "./types";

type Patch = Partial<Omit<CatalogFilters, "page">> & { page?: number };

/**
 * Construye la URL del catálogo a partir de los filtros actuales + cambios.
 * Cualquier cambio de filtro vuelve a la página 1 (salvo que se pase `page`).
 */
export function catalogHref(current: CatalogFilters, patch: Patch = {}) {
  const next = { ...current, page: 1, ...patch };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.category) params.set("categoria", next.category);
  if (next.minPrice !== undefined) params.set("min", String(next.minPrice));
  if (next.maxPrice !== undefined) params.set("max", String(next.maxPrice));
  if (next.inStock) params.set("stock", "1");
  if (next.onSale) params.set("oferta", "1");
  if (next.sort && next.sort !== "recientes") params.set("orden", next.sort);
  if (next.page > 1) params.set("pagina", String(next.page));

  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export const hasActiveFilters = (f: CatalogFilters) =>
  Boolean(f.q || f.category || f.minPrice !== undefined || f.maxPrice !== undefined || f.inStock || f.onSale);
