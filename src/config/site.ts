/**
 * Datos de marca del inventario. Cambia estos valores para cada cliente.
 */
export const siteConfig = {
  name: "Inventario Modelo",
  shortName: "Inventario",
  description:
    "Catálogo e inventario online: sube tus productos uno por uno o en lote desde Excel o CSV.",
  currency: "PEN",
  currencySymbol: "S/",
  locale: "es-PE",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "",
  poweredBy: { name: "3R Core", url: "https://3rcore.com" },
} as const;

export const PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 20;
export const MAX_IMAGES_PER_PRODUCT = 8;
export const MAX_IMAGE_SIZE_MB = 5;
