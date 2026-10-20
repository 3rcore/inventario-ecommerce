import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-[#c9d0c4]">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.7fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="font-display text-3xl text-white">{siteConfig.name}</p>
          <p className="max-w-[46ch] text-sm leading-relaxed">{siteConfig.description}</p>
        </div>
        <div>
          <p className="mb-4 text-xs font-bold tracking-[.14em] text-white uppercase">Tienda</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-white">Catálogo</Link>
            </li>
            <li>
              <Link href="/?oferta=1" className="hover:text-white">Ofertas</Link>
            </li>
            <li>
              <Link href="/?orden=recientes" className="hover:text-white">Novedades</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-xs font-bold tracking-[.14em] text-white uppercase">Gestión</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/admin" className="hover:text-white">Panel de inventario</Link>
            </li>
            <li>
              <Link href="/admin/importar" className="hover:text-white">Importar Excel / CSV</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-2 py-5 text-xs sm:flex-row sm:justify-between">
          <span>© {siteConfig.name}</span>
          <span>
            Desarrollado por{" "}
            <a href={siteConfig.poweredBy.url} target="_blank" rel="noreferrer" className="text-gold hover:text-white">
              {siteConfig.poweredBy.name}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
