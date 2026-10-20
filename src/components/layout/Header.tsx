import Link from "next/link";
import { LayoutDashboard, Search } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="wrap flex h-[70px] items-center justify-between gap-4 lg:h-[82px]">
        <Link href="/" aria-label="Ir al catálogo" className="shrink-0">
          <Logo eager className="h-[37px] w-auto lg:h-[42px]" />
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

        <nav className="flex items-center gap-3 text-[13.5px] font-semibold text-ink sm:gap-5">
          <Link href="/" className="transition-colors hover:text-accent">
            Catálogo
          </Link>
          <ThemeToggle />
          <Link href="/admin" className="btn btn-primary rounded-full! px-4! py-2.5!">
            <LayoutDashboard className="size-4" />
            <span className="hidden sm:inline">Administrar</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
