import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Download, Plus, Search, Upload } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { FlashMessage } from "@/components/admin/FlashMessage";
import { ToggleActive } from "@/components/admin/ToggleActive";
import { Pagination } from "@/components/ui/Pagination";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatPrice } from "@/lib/products/format";
import { getAdminProducts, getInventoryStats } from "@/lib/products/queries";

export const metadata: Metadata = { title: "Productos" };

export default function AdminProductsPage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-accent">Inventario</p>
          <h1 className="font-display text-4xl font-medium">Productos</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/exportar" className="btn btn-outline">
            <Download className="size-4" /> Exportar CSV
          </a>
          <Link href="/admin/importar" className="btn btn-outline">
            <Upload className="size-4" /> Importar lote
          </Link>
          <Link href="/admin/productos/nuevo" className="btn btn-primary">
            <Plus className="size-4" /> Nuevo producto
          </Link>
        </div>
      </div>

      <Suspense>
        <AdminProducts searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AdminProducts({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const page = Math.max(1, Number(sp.pagina) || 1);
  const ok = typeof sp.ok === "string" ? sp.ok : undefined;

  const [result, stats] = await Promise.all([getAdminProducts({ q, page }), getInventoryStats()]);
  const hrefFor = (p: number) => `/admin?${new URLSearchParams({ ...(q ? { q } : {}), pagina: String(p) })}`;

  return (
    <>
      {ok ? <FlashMessage message={`Producto ${ok} correctamente.`} /> : null}

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total" value={stats.total} />
        <Stat label="Publicados" value={stats.active} />
        <Stat label="Sin stock" value={stats.outOfStock} tone={stats.outOfStock ? "warn" : undefined} />
      </div>

      <form className="relative max-w-md" role="search">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" />
        <input name="q" type="search" defaultValue={q} placeholder="Buscar por nombre, SKU o categoría" className="field pl-9" />
      </form>

      <div className="overflow-x-auto rounded-sm border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-cream-2 text-[11px] tracking-wider text-ink uppercase">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-center">Publicado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {result.items.map((p) => (
              <tr key={p.id} className="hover:bg-cream-2/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-sm border border-line bg-cream-2">
                      <ProductImage src={p.images[0]} alt="" sizes="48px" />
                    </div>
                    <Link href={`/admin/productos/${p.id}`} className="line-clamp-2 font-semibold text-ink hover:text-accent">
                      {p.name}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">{p.category ?? "—"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {formatPrice(p.final_price)}
                  {p.sale_price !== null ? <s className="block text-xs text-ink-2">{formatPrice(p.price)}</s> : null}
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${p.stock === 0 ? "text-sale" : "text-ink"}`}>{p.stock}</td>
                <td className="px-4 py-3 text-center">
                  <ToggleActive id={p.id} active={p.is_active} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/productos/${p.id}`} className="btn btn-outline px-3! py-1.5!">
                      Editar
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
            {!result.items.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-ink-2">
                  {q ? "No se encontraron productos." : "Todavía no hay productos. Crea uno o importa un Excel/CSV."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination page={result.page} pageCount={result.pageCount} hrefFor={hrefFor} />
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" }) {
  return (
    <div className="rounded-sm border border-line bg-white px-4 py-3">
      <p className="text-[11px] tracking-wider uppercase">{label}</p>
      <p className={`text-2xl font-semibold ${tone === "warn" ? "text-sale" : "text-ink"}`}>{value}</p>
    </div>
  );
}
