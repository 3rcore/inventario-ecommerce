import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
};

/** Devuelve [1, "…", 4, 5, 6, "…", 12] */
function pageWindow(page: number, pageCount: number): (number | "…")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ["…" as const, p] : [p]));
}

export function Pagination({ page, pageCount, hrefFor }: Props) {
  if (pageCount <= 1) return null;

  const base = "flex size-9 items-center justify-center rounded-sm border text-xs font-semibold transition-colors";

  return (
    <nav aria-label="Paginación" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={`${base} border-line text-ink hover:border-accent`} aria-label="Anterior">
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}
      {pageWindow(page, pageCount).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-ink-2">…</span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${base} ${p === page ? "border-primary bg-primary text-white" : "border-line text-ink hover:border-accent"}`}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={`${base} border-line text-ink hover:border-accent`} aria-label="Siguiente">
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
