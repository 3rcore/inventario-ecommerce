import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { discountPercent, formatPrice } from "@/lib/products/format";
import type { Product } from "@/lib/products/types";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const discount = discountPercent(product.price, product.sale_price);
  const outOfStock = product.stock <= 0;
  const href = `/producto/${product.slug}`;

  return (
    <article data-reveal className="group relative flex flex-col overflow-hidden rounded-sm border border-line bg-surface transition hover:-translate-y-1 hover:shadow-card">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-cream-2" aria-label={product.name}>
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          priority={priority}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {discount ? (
          <span className="absolute top-3 left-3 rounded-sm bg-sale px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white uppercase">
            -{discount}%
          </span>
        ) : null}
        {outOfStock ? (
          <span className="absolute top-3 right-3 rounded-sm bg-surface/90 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-ink uppercase">
            Agotado
          </span>
        ) : null}
        <span className="absolute inset-x-0 bottom-0 flex translate-y-full justify-center bg-surface/70 py-3 text-[11px] font-bold tracking-[0.08em] text-ink uppercase opacity-0 backdrop-blur transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Ver producto
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5 md:p-[18px]">
        {product.brand || product.category ? (
          <span className="truncate text-[10.5px] font-bold tracking-[.14em] text-accent uppercase">
            {product.brand ?? product.category}
          </span>
        ) : null}
        <h3 className="line-clamp-2 text-[12.5px] leading-snug font-semibold text-ink md:text-sm">
          <Link href={href} className="hover:text-accent">
            {product.name}
          </Link>
        </h3>
        <p className="mt-auto pt-1 text-[15px] font-semibold text-ink md:text-base">
          {formatPrice(product.final_price)}
          {discount ? (
            <s className="ml-1.5 text-xs font-medium text-ink-2">{formatPrice(product.price)}</s>
          ) : null}
        </p>
        <p className={`text-[11px] ${outOfStock ? "text-sale" : "text-ink-2"}`}>
          {outOfStock ? "Sin stock" : `${product.stock} en stock`}
        </p>
      </div>
    </article>
  );
}
