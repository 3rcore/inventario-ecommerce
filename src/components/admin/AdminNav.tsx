"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Productos" },
  { href: "/admin/productos/nuevo", label: "Nuevo" },
  { href: "/admin/importar", label: "Importar" },
];

export function AdminNav() {
  // usePathname es dato de runtime: con Cache Components va dentro de Suspense.
  return (
    <Suspense fallback={<NavLinks pathname="" />}>
      <ActiveNav />
    </Suspense>
  );
}

function ActiveNav() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden items-center gap-5 text-[13px] font-semibold md:flex">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={active ? "text-accent" : "text-ink hover:text-accent"}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
