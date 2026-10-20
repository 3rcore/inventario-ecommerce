import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories } from "@/lib/products/queries";

export const metadata: Metadata = { title: "Nuevo producto" };

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-accent">Inventario</p>
        <h1 className="font-display text-4xl font-medium">Nuevo producto</h1>
      </div>
      <Suspense>
        <NewProductForm />
      </Suspense>
    </div>
  );
}

async function NewProductForm() {
  const categories = await getCategories();
  return <ProductForm categories={categories.map((c) => c.name)} />;
}
