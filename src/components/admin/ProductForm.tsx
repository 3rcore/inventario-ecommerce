"use client";

import { useActionState, startTransition, type FormEvent } from "react";
import Link from "next/link";
import { saveProduct, type ProductFormState } from "@/app/actions/products";
import { siteConfig } from "@/config/site";
import type { Product } from "@/lib/products/types";
import { ImageUploader } from "./ImageUploader";

type Props = { product?: Product; categories: string[] };

export function ProductForm({ product, categories }: Props) {
  const [state, formAction, isPending] = useActionState<ProductFormState, FormData>(
    saveProduct.bind(null, product?.id ?? null),
    {},
  );
  const errors = state.errors ?? {};

  // onSubmit en lugar de action={}: evita que React resetee el formulario si hay errores.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card title="Información">
          <Field label="Nombre *" error={errors.name}>
            <input name="name" defaultValue={product?.name} required maxLength={200} aria-invalid={!!errors.name} className="field" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SKU *" error={errors.sku} hint="Código único. Se usa para actualizar por Excel/CSV.">
              <input name="sku" defaultValue={product?.sku} required maxLength={64} aria-invalid={!!errors.sku} className="field font-mono" />
            </Field>
            <Field label="Marca" error={errors.brand}>
              <input name="brand" defaultValue={product?.brand ?? ""} maxLength={80} className="field" />
            </Field>
          </div>
          <Field label="Categoría" error={errors.category}>
            <input name="category" defaultValue={product?.category ?? ""} list="categories" maxLength={80} className="field" />
            <datalist id="categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Descripción" error={errors.description}>
            <textarea name="description" defaultValue={product?.description ?? ""} rows={6} maxLength={5000} className="field resize-y" />
          </Field>
        </Card>

        <Card title="Imágenes">
          <ImageUploader name="images" defaultValue={product?.images} error={errors.images} />
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Precio e inventario">
          <Field label={`Precio (${siteConfig.currencySymbol}) *`} error={errors.price}>
            <input name="price" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={product?.price} required aria-invalid={!!errors.price} className="field" />
          </Field>
          <Field label={`Precio oferta (${siteConfig.currencySymbol})`} error={errors.sale_price} hint="Déjalo vacío si no hay oferta.">
            <input name="sale_price" type="number" min={0} step="0.01" inputMode="decimal" defaultValue={product?.sale_price ?? ""} aria-invalid={!!errors.sale_price} className="field" />
          </Field>
          <Field label="Stock" error={errors.stock}>
            <input name="stock" type="number" min={0} step={1} defaultValue={product?.stock ?? 0} aria-invalid={!!errors.stock} className="field" />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 pt-1 text-sm text-ink">
            <input name="is_active" type="checkbox" defaultChecked={product?.is_active ?? true} className="size-4 accent-accent" />
            Publicado en la tienda
          </label>
        </Card>

        {state.message ? (
          <p role="alert" className="rounded-sm border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {state.message}
          </p>
        ) : null}

        <div className="flex gap-3">
          <button type="submit" disabled={isPending} className="btn btn-primary flex-1 py-3!">
            {isPending ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
          </button>
          <Link href="/admin" className="btn btn-outline py-3!">
            Cancelar
          </Link>
        </div>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-sm border border-line bg-surface p-5 md:p-6">
      <h2 className="text-xs font-bold tracking-[.14em] uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-ink">{label}</span>
      {children}
      {error ? <span className="block text-xs text-danger">{error}</span> : hint ? <span className="block text-[11px]">{hint}</span> : null}
    </label>
  );
}
