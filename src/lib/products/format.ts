import { siteConfig } from "@/config/site";

const priceFormatter = new Intl.NumberFormat(siteConfig.locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number) {
  return `${siteConfig.currencySymbol} ${priceFormatter.format(value)}`;
}

export function discountPercent(price: number, salePrice: number | null) {
  if (salePrice === null || price <= 0 || salePrice >= price) return null;
  return Math.round((1 - salePrice / price) * 100);
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** El SKU es único, así que nombre + SKU produce un slug único y legible. */
export function productSlug(name: string, sku: string) {
  return [slugify(name), slugify(sku)].filter(Boolean).join("-");
}

export function whatsappLink(message: string) {
  if (!siteConfig.whatsapp) return null;
  return `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`;
}
