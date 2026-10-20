import Papa from "papaparse";
import { importRowSchema, type ImportRow } from "./schema";

/* ------------------------------------------------------------------ */
/* Columnas aceptadas                                                  */
/* Acepta la plantilla propia (español) y exportaciones de WooCommerce. */
/* ------------------------------------------------------------------ */

type Field =
  | "sku"
  | "name"
  | "description"
  | "category"
  | "brand"
  | "price"
  | "sale_price"
  | "stock"
  | "images"
  | "is_active";

const HEADER_ALIASES: Record<Field, string[]> = {
  sku: ["sku", "codigo", "código", "cod", "referencia", "ref"],
  name: ["nombre", "name", "producto", "titulo", "título", "title"],
  description: ["descripcion", "descripción", "description", "short description", "descripcion corta", "descripción corta"],
  category: ["categoria", "categoría", "categorias", "categorías", "categories", "category"],
  brand: ["marca", "brand", "brands", "marcas", "fabricante"],
  price: ["precio", "precio normal", "precio regular", "regular price", "price", "pvp"],
  sale_price: ["precio oferta", "precio_oferta", "precio rebajado", "oferta", "sale price", "precio de oferta"],
  stock: ["stock", "inventario", "cantidad", "existencias", "qty", "quantity"],
  images: ["imagenes", "imágenes", "imagen", "images", "image", "fotos", "foto"],
  is_active: ["activo", "publicado", "published", "visible", "estado", "active"],
};

export const TEMPLATE_HEADERS = [
  "sku",
  "nombre",
  "descripcion",
  "categoria",
  "marca",
  "precio",
  "precio_oferta",
  "stock",
  "imagenes",
  "activo",
] as const;

export const TEMPLATE_EXAMPLE_ROWS: Record<(typeof TEMPLATE_HEADERS)[number], string | number>[] = [
  {
    sku: "POL-001",
    nombre: "Polo algodón pima",
    descripcion: "Polo 100% algodón pima, corte regular.",
    categoria: "Ropa",
    marca: "Marca Demo",
    precio: 89.9,
    precio_oferta: 69.9,
    stock: 25,
    imagenes: "polo-blanco.jpg|polo-blanco-2.jpg",
    activo: "si",
  },
  {
    sku: "TAZ-010",
    nombre: "Taza cerámica 350 ml",
    descripcion: "Apta para microondas y lavavajillas.",
    categoria: "Hogar",
    marca: "",
    precio: 35,
    precio_oferta: "",
    stock: 0,
    imagenes: "https://ejemplo.com/taza.jpg",
    activo: "si",
  },
];

const normalizeHeader = (h: string) =>
  h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[_\-.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const ALIAS_LOOKUP = new Map<string, Field>(
  (Object.entries(HEADER_ALIASES) as [Field, string[]][]).flatMap(([field, aliases]) =>
    aliases.map((a) => [normalizeHeader(a), field] as const),
  ),
);

/* ------------------------------------------------------------------ */
/* Lectura del archivo                                                 */
/* ------------------------------------------------------------------ */

export type RawRow = Record<string, unknown>;

export const ACCEPTED_FILE_TYPES = ".csv,.xlsx,.xls";

export async function readSpreadsheet(file: File): Promise<RawRow[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv") {
    const text = await file.text();
    const result = Papa.parse<RawRow>(text, {
      header: true,
      skipEmptyLines: "greedy",
      // Papa detecta automáticamente "," o ";" (Excel en español exporta con ";").
      transformHeader: (h) => h.replace(/^﻿/, "").trim(),
    });
    if (result.errors.length && !result.data.length) {
      throw new Error(`No se pudo leer el CSV: ${result.errors[0].message}`);
    }
    return result.data;
  }

  if (ext === "xlsx" || ext === "xls") {
    // Import dinámico: SheetJS solo se descarga cuando se sube un Excel.
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error("El archivo Excel no tiene hojas.");
    return XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "", raw: true });
  }

  throw new Error("Formato no soportado. Usa .csv, .xlsx o .xls");
}

/* ------------------------------------------------------------------ */
/* Conversión de valores                                               */
/* ------------------------------------------------------------------ */

const asText = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

/** Acepta 1234.5 · "1,234.50" · "1.234,50" · "S/ 89.90" */
export function parseNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = asText(v).replace(/[^\d.,-]/g, "");
  if (!s) return null;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // El separador que aparece al final es el decimal.
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    // Solo comas: decimal si tiene 1–2 dígitos detrás ("89,9"), miles si no ("1,200").
    s = /,\d{1,2}$/.test(s) ? s.replace(/,(?=\d{1,2}$)/, ".").replace(/,/g, "") : s.replace(/,/g, "");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const FALSY = new Set(["0", "no", "false", "falso", "inactivo", "borrador", "draft", "oculto", "-1", "n"]);

export function parseBoolean(v: unknown, fallback = true): boolean {
  if (typeof v === "boolean") return v;
  const s = normalizeHeader(asText(v));
  if (!s) return fallback;
  return !FALSY.has(s);
}

/** WooCommerce: "Ropa > Polos, Ofertas" → "Polos" (la más específica de la primera). */
function parseCategory(v: unknown) {
  const first = asText(v).split(",")[0] ?? "";
  const parts = first.split(">").map((p) => p.trim()).filter(Boolean);
  return parts.at(-1) ?? "";
}

/** Separa por "|", "," o saltos de línea. */
export function splitImageRefs(v: unknown): string[] {
  return asText(v)
    .split(/\s*[|\n]\s*|,\s+|,(?=https?:)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const isUrl = (s: string) => /^https?:\/\//i.test(s);

/* ------------------------------------------------------------------ */
/* Mapeo y validación de filas                                         */
/* ------------------------------------------------------------------ */

export type ParsedRow = {
  /** Número de fila tal como se ve en Excel (encabezado = 1). */
  line: number;
  data: ImportRow | null;
  /** URLs o nombres de archivo tal como vienen en la celda. */
  imageRefs: string[];
  errors: string[];
};

export type ParseResult = {
  rows: ParsedRow[];
  unknownColumns: string[];
  missingRequired: Field[];
};

const REQUIRED: Field[] = ["sku", "name", "price"];

export function mapRows(rawRows: RawRow[], availableFiles: Set<string>): ParseResult {
  const headers = Object.keys(rawRows[0] ?? {});
  const columnMap = new Map<string, Field>();
  const unknownColumns: string[] = [];

  for (const h of headers) {
    const field = ALIAS_LOOKUP.get(normalizeHeader(h));
    if (field && ![...columnMap.values()].includes(field)) columnMap.set(h, field);
    else if (!field) unknownColumns.push(h);
  }

  const mapped = new Set(columnMap.values());
  const missingRequired = REQUIRED.filter((f) => !mapped.has(f));
  if (missingRequired.length) return { rows: [], unknownColumns, missingRequired };

  const seenSkus = new Map<string, number>();

  const rows = rawRows.map((raw, i): ParsedRow => {
    const line = i + 2;
    const get = (field: Field) => {
      for (const [header, f] of columnMap) if (f === field) return raw[header];
      return undefined;
    };

    const errors: string[] = [];
    const imageRefs = splitImageRefs(get("images"));

    for (const ref of imageRefs) {
      if (!isUrl(ref) && !availableFiles.has(ref.toLowerCase())) {
        errors.push(`Imagen "${ref}" no encontrada: súbela junto al archivo o usa una URL`);
      }
    }

    const priceRaw = get("price");
    const salePriceRaw = get("sale_price");
    const stockRaw = get("stock");

    const candidate = {
      sku: asText(get("sku")),
      name: asText(get("name")),
      description: asText(get("description")),
      category: parseCategory(get("category")),
      brand: asText(get("brand")),
      price: parseNumber(priceRaw) ?? Number.NaN,
      sale_price: asText(salePriceRaw) ? (parseNumber(salePriceRaw) ?? Number.NaN) : null,
      stock: asText(stockRaw) ? (parseNumber(stockRaw) ?? Number.NaN) : 0,
      is_active: parseBoolean(get("is_active")),
    };

    const result = importRowSchema.safeParse(candidate);
    if (!result.success) errors.push(...result.error.issues.map((iss) => iss.message));

    if (candidate.sku) {
      const key = candidate.sku.toLowerCase();
      const previous = seenSkus.get(key);
      if (previous) errors.push(`SKU duplicado en el archivo (ya aparece en la fila ${previous})`);
      else seenSkus.set(key, line);
    }

    return { line, data: result.success && !errors.length ? result.data : null, imageRefs, errors };
  });

  return { rows, unknownColumns, missingRequired };
}

/** Descarga la plantilla en CSV o Excel (se genera en el navegador). */
export async function downloadTemplate(format: "csv" | "xlsx") {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.json_to_sheet(TEMPLATE_EXAMPLE_ROWS, { header: [...TEMPLATE_HEADERS] });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Productos");
  XLSX.writeFile(book, `plantilla-productos.${format}`, { bookType: format });
}
