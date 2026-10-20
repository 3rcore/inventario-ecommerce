export type Product = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  price: number;
  sale_price: number | null;
  final_price: number;
  stock: number;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = { name: string; total: number };

export const SORT_OPTIONS = [
  { value: "recientes", label: "Más recientes" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "nombre", label: "Nombre: A–Z" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

/** Filtros generales del catálogo (todos vienen de la URL). */
export type CatalogFilters = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort: SortOption;
  page: number;
};

export type Paginated<T> = { items: T[]; total: number; page: number; pageCount: number };
