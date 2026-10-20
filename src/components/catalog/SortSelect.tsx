"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { catalogHref } from "@/lib/products/url";
import { SORT_OPTIONS, type CatalogFilters, type SortOption } from "@/lib/products/types";

export function SortSelect({ filters }: { filters: CatalogFilters }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-xs text-ink-2">
      <span className="hidden sm:inline">Ordenar por:</span>
      <select
        value={filters.sort}
        disabled={isPending}
        onChange={(e) =>
          startTransition(() =>
            router.push(catalogHref(filters, { sort: e.target.value as SortOption }), { scroll: false }),
          )
        }
        className="field w-auto! py-1.5! pr-8! text-xs!"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
