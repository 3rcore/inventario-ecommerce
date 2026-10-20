"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Productos" },
  { href: "/admin/productos/nuevo", label: "Nuevo" },
  { href: "/admin/importar", label: "Importar" },
];

export function AdminNav({ className = "hidden md:flex" }: { className?: string }) {
  // usePathname es dato de runtime: con Cache Components va dentro de Suspense.
  return (
    <Suspense fallback={<NavLinks pathname="" className={className} />}>
      <ActiveNav className={className} />
    </Suspense>
  );
}

function ActiveNav({ className }: { className: string }) {
  return <NavLinks pathname={usePathname()} className={className} />;
}

function NavLinks({ pathname, className }: { pathname: string; className: string }) {
  return (
    <nav className={`items-center gap-5 text-[13px] font-semibold ${className}`}>
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
