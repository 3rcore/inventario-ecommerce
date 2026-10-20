import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductGallery } from "@/components/catalog/ProductGallery";
import { discountPercent, formatPrice, whatsappLink } from "@/lib/products/format";
import { getProductBySlug, getRelatedProducts } from "@/lib/products/queries";

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.name,
    description: product.description?.slice(0, 160) ?? undefined,
    openGraph: { images: product.images[0] ? [product.images[0]] : undefined },
  };
}

export default function ProductPage({ params }: PageProps<"/producto/[slug]">) {
  return (
    <div className="wrap py-8 md:py-12">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-xs font-semibold text-ink-2 hover:text-accent">
        <ChevronLeft className="size-4" /> Volver al catálogo
      </Link>
      <Suspense fallback={<div className="aspect-[2/1] animate-pulse rounded-sm bg-cream-2" />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({ params }: Pick<PageProps<"/producto/[slug]">, "params">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  const discount = discountPercent(product.price, product.sale_price);
  const inStock = product.stock > 0;
  const whatsapp = whatsappLink(`Hola, me interesa el producto ${product.name} (SKU ${product.sku}).`);
  const related = product.category ? await getRelatedProducts(product.category, product.id) : [];

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="space-y-5">
          {product.brand || product.category ? (
            <p className="text-[11px] font-bold tracking-[.14em] text-accent uppercase">
              {[product.brand, product.category].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          <h1 className="font-display text-[clamp(30px,4vw,44px)] leading-tight font-medium">{product.name}</h1>
          <p className="text-xs text-ink-2">SKU: {product.sku}</p>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-ink">{formatPrice(product.final_price)}</span>
            {discount ? (
              <>
                <s className="text-sm text-ink-2">{formatPrice(product.price)}</s>
                <span className="rounded-sm bg-sale px-2 py-0.5 text-[11px] font-semibold text-white">-{discount}%</span>
              </>
            ) : null}
          </div>

          <p className={`text-sm font-semibold ${inStock ? "text-success" : "text-sale"}`}>
            {inStock ? `Disponible · ${product.stock} unidades` : "Agotado"}
          </p>

          {product.description ? (
            <div className="border-t border-line pt-5 text-sm leading-relaxed whitespace-pre-line">{product.description}</div>
          ) : null}

          {whatsapp ? (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn-primary w-full py-3.5! sm:w-auto">
              <MessageCircle className="size-4" /> Consultar por WhatsApp
            </a>
          ) : null}
        </div>
      </div>

      {related.length ? (
        <section className="mt-16 border-t border-line pt-10">
          <h2 className="mb-6 font-display text-3xl">También te puede interesar</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
