"use client";

import { useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";
import { SlidersHorizontal } from "lucide-react";
import { siteConfig } from "@/config/site";
import { catalogHref, hasActiveFilters } from "@/lib/products/url";
import type { CatalogFilters as Filters, Category } from "@/lib/products/types";

type Props = { filters: Filters; categories: Category[] };

/**
 * Filtros generales: categoría, rango de precio, disponibilidad y ofertas.
 * El estado vive en la URL, así los resultados se pueden compartir y cachear.
 */
export function CatalogFilters({ filters, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const go = (patch: Parameters<typeof catalogHref>[1]) =>
    startTransition(() => router.push(catalogHref(filters, patch), { scroll: false }));

  const applyPrice = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const toNum = (v: FormDataEntryValue | null) => (v && String(v).trim() !== "" ? Math.max(0, Number(v)) : undefined);
    go({ minPrice: toNum(data.get("min")), maxPrice: toNum(data.get("max")) });
  };

  const content = (
    <div className={`space-y-8 transition-opacity ${isPending ? "opacity-60" : ""}`} aria-busy={isPending}>
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="text-xs font-semibold tracking-[0.2em] text-ink uppercase">Filtros</span>
        {hasActiveFilters(filters) ? (
          <button
            type="button"
            onClick={() => startTransition(() => router.push(catalogHref({ sort: filters.sort, page: 1 }), { scroll: false }))}
            className="text-xs text-ink-2 underline hover:text-clay"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      {categories.length > 0 ? (
        <fieldset className="space-y-2.5 border-b border-line pb-6">
          <legend className="mb-3 text-xs font-semibold tracking-wider text-ink uppercase">Categoría</legend>
          <FilterOption label="Todas" checked={!filters.category} onChange={() => go({ category: undefined })} />
          {categories.map((c) => (
            <FilterOption
              key={c.name}
              label={c.name}
              count={c.total}
              checked={filters.category === c.name}
              onChange={() => go({ category: c.name })}
            />
          ))}
        </fieldset>
      ) : null}

      <form onSubmit={applyPrice} className="space-y-3 border-b border-line pb-6" key={`${filters.minPrice}-${filters.maxPrice}`}>
        <p className="text-xs font-semibold tracking-wider text-ink uppercase">Precio</p>
        <div className="flex items-center gap-2">
          <PriceInput name="min" placeholder="Mín." defaultValue={filters.minPrice} />
          <span className="text-xs text-ink-2">—</span>
          <PriceInput name="max" placeholder="Máx." defaultValue={filters.maxPrice} />
        </div>
        <button type="submit" className="btn btn-outline w-full py-2!">
          Aplicar precio
        </button>
      </form>

      <fieldset className="space-y-2.5">
        <legend className="mb-3 text-xs font-semibold tracking-wider text-ink uppercase">Disponibilidad</legend>
        <Check label="Solo con stock" checked={!!filters.inStock} onChange={(v) => go({ inStock: v || undefined })} />
        <Check label="En oferta" checked={!!filters.onSale} onChange={(v) => go({ onSale: v || undefined })} />
      </fieldset>
    </div>
  );

  return (
    <>
      {/* Móvil: filtros plegables */}
      <details className="rounded-sm border border-line p-4 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold tracking-[0.2em] text-ink uppercase">
          <SlidersHorizontal className="size-4" /> Filtros
          {hasActiveFilters(filters) ? <span className="size-2 rounded-full bg-accent" aria-label="activos" /> : null}
        </summary>
        <div className="pt-6">{content}</div>
      </details>
      <div className="hidden lg:block">{content}</div>
    </>
  );
}

function FilterOption({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3">
      <input type="radio" name="categoria" checked={checked} onChange={onChange} className="size-4 accent-accent" />
      <span className={`flex-1 text-xs ${checked ? "font-bold text-ink" : "text-ink-2 group-hover:text-ink"}`}>{label}</span>
      {count !== undefined ? <span className="text-[11px] text-ink-2">{count}</span> : null}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="group flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded-sm accent-accent"
      />
      <span className={`text-xs ${checked ? "font-bold text-ink" : "text-ink-2 group-hover:text-ink"}`}>{label}</span>
    </label>
  );
}

function PriceInput({ name, placeholder, defaultValue }: { name: string; placeholder: string; defaultValue?: number }) {
  return (
    <div className="relative flex-1">
      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs text-ink-2">{siteConfig.currencySymbol}</span>
      <input
        name={name}
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-label={`Precio ${placeholder}`}
        className="field py-2! pl-8! text-xs!"
      />
    </div>
  );
}
