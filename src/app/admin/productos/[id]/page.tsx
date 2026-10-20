import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { ProductForm } from "@/components/admin/ProductForm";
import { getAdminProduct, getCategories } from "@/lib/products/queries";

export const metadata: Metadata = { title: "Editar producto" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EditProductPage({ params }: PageProps<"/admin/productos/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-sm bg-white" />}>
      <EditProduct params={params} />
    </Suspense>
  );
}

async function EditProduct({ params }: Pick<PageProps<"/admin/productos/[id]">, "params">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [product, categories] = await Promise.all([getAdminProduct(id), getCategories()]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-accent">Editar · {product.sku}</p>
          <h1 className="font-display text-4xl font-medium">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          {product.is_active ? (
            <Link href={`/producto/${product.slug}`} target="_blank" className="btn btn-outline">
              Ver en tienda <ExternalLink className="size-3.5" />
            </Link>
          ) : null}
          <DeleteProductButton id={product.id} name={product.name} redirectTo="/admin" />
        </div>
      </div>
      <ProductForm product={product} categories={categories.map((c) => c.name)} />
    </div>
  );
}
