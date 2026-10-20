import Link from "next/link";
import { LayoutDashboard, Search } from "lucide-react";
import { siteConfig } from "@/config/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="wrap flex h-[70px] items-center justify-between gap-4 lg:h-[82px]">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-ink lg:text-[28px]">
          {siteConfig.name}
        </Link>

        <form action="/" className="relative hidden max-w-sm flex-1 md:block" role="search">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-2" />
          <input
            name="q"
            type="search"
            placeholder="Buscar por nombre, SKU o marca…"
            aria-label="Buscar productos"
            className="field rounded-full! pl-9"
          />
        </form>

        <nav className="flex items-center gap-6 text-[13.5px] font-semibold text-ink">
          <Link href="/" className="transition-colors hover:text-accent">
            Catálogo
          </Link>
          <Link href="/admin" className="btn btn-primary rounded-full! px-4! py-2.5!">
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">Administrar</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
