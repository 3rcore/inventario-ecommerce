import { Suspense } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { ProductCard } from "@/components/catalog/ProductCard";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Pagination } from "@/components/ui/Pagination";
import { siteConfig } from "@/config/site";
import { parseCatalogFilters } from "@/lib/products/filters";
import { getCatalogProducts, getCategories } from "@/lib/products/queries";
import { catalogHref, hasActiveFilters } from "@/lib/products/url";

export default function CatalogPage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <section className="relative overflow-hidden bg-banner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_30%,#eef2ea_0,transparent_55%)]" aria-hidden />
        <div className="wrap relative flex min-h-[260px] flex-col justify-center py-14 md:min-h-[340px]">
          <p className="eyebrow text-[#4a5545]">Catálogo</p>
          <h1 className="mt-3 font-display text-[clamp(34px,5.5vw,60px)] leading-[1.05] font-medium text-[#1c2419]">
            Todos nuestros productos
          </h1>
          <p className="mt-4 max-w-[46ch] text-[#3b4636]">{siteConfig.description}</p>
        </div>
      </section>

      <section className="wrap py-10 md:py-14">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogResults searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}

async function CatalogResults({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const filters = parseCatalogFilters(await searchParams);
  const [result, categories] = await Promise.all([getCatalogProducts(filters), getCategories()]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <aside className="lg:col-span-1 lg:pr-2">
        <CatalogFilters filters={filters} categories={categories} />
      </aside>

      <div className="lg:col-span-3">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-xs text-ink-2">
            <strong className="text-ink">{result.total}</strong> {result.total === 1 ? "producto" : "productos"}
            {filters.q ? (
              <>
                {" "}para “<span className="text-ink">{filters.q}</span>”
              </>
            ) : null}
          </p>
          <SortSelect filters={filters} />
        </div>

        {result.items.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {result.items.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 3} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-sm border border-dashed border-line py-20 text-center">
            <PackageSearch className="size-10 text-gold" aria-hidden />
            <p className="text-sm text-ink">
              {hasActiveFilters(filters) ? "No hay productos con estos filtros." : "Aún no hay productos publicados."}
            </p>
            {hasActiveFilters(filters) ? (
              <Link href="/" className="btn btn-outline">Ver todo el catálogo</Link>
            ) : (
              <Link href="/admin/importar" className="btn btn-primary">Subir productos</Link>
            )}
          </div>
        )}

        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          hrefFor={(page) => catalogHref(filters, { page })}
        />
      </div>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4" aria-busy="true" aria-label="Cargando productos">
      <div className="hidden space-y-4 lg:block">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-cream-2" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:col-span-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-sm border border-line">
            <div className="aspect-square animate-pulse bg-cream-2" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-cream-2" />
              <div className="h-4 animate-pulse rounded bg-cream-2" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-cream-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
