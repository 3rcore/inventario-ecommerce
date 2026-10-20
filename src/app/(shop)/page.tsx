import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  FileSpreadsheet,
  ImageUp,
  LayoutDashboard,
  MoonStar,
  Rocket,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductImage } from "@/components/ui/ProductImage";
import { siteConfig } from "@/config/site";
import { getCategories, getLatestProducts } from "@/lib/products/queries";
import type { Product } from "@/lib/products/types";
import brandIcon from "@/assets/brand/icono-3rcore.webp";

const FEATURES = [
  {
    icon: FileSpreadsheet,
    title: "Carga por Excel o CSV",
    text: "Sube cientos de productos de una vez, con vista previa y validación antes de guardar.",
  },
  {
    icon: ImageUp,
    title: "Imágenes en la nube",
    text: "Fotos optimizadas automáticamente y servidas rápido en cualquier dispositivo.",
  },
  {
    icon: SlidersHorizontal,
    title: "Filtros simples",
    text: "Tus clientes encuentran lo que buscan por categoría, precio, stock y ofertas.",
  },
  {
    icon: MoonStar,
    title: "Claro y oscuro",
    text: "Se adapta a la preferencia de cada visitante, en celular, tablet o computadora.",
  },
];

const STEPS = [
  { icon: Download, title: "Descarga la plantilla", text: "Excel o CSV con las columnas listas. También sirve una exportación de WooCommerce." },
  { icon: Upload, title: "Sube tu archivo", text: "Revisa la vista previa: los errores se marcan fila por fila antes de importar." },
  { icon: Rocket, title: "Publica al instante", text: "Tus productos aparecen en el catálogo apenas confirmas. Edítalos cuando quieras." },
];

export default function HomePage() {
  return (
    <>
      {/* ---------------------------- Hero ---------------------------- */}
      <section className="relative overflow-hidden bg-banner">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-24 size-[520px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_65%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-32 size-[460px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--sale)_14%,transparent),transparent_65%)]"
        />

        <div className="wrap relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="eyebrow animate-in text-accent">Inventario online · Demo {siteConfig.poweredBy.name}</p>
            <h1 className="animate-in mt-4 font-display text-[clamp(38px,6vw,68px)] leading-[1.02] font-medium [--delay:100ms]">
              Tu catálogo y tu inventario, <em className="text-accent">en un solo lugar</em>
            </h1>
            <p className="animate-in mt-5 max-w-[48ch] text-base leading-relaxed [--delay:200ms] md:text-lg">
              Sube tus productos uno por uno o en lote desde Excel, muéstralos en una tienda rápida y
              mantén precios y stock al día sin complicaciones.
            </p>
            <div className="animate-in mt-8 flex flex-wrap gap-3 [--delay:300ms]">
              <Link href="/tienda" className="btn btn-primary group px-6! py-3.5!">
                Ver catálogo
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/admin" className="btn btn-outline px-6! py-3.5!">
                <LayoutDashboard className="size-4" /> Administrar inventario
              </Link>
            </div>
            <Suspense fallback={<div className="mt-8 h-5" />}>
              <CatalogSummary />
            </Suspense>
          </div>

          <Suspense fallback={<HeroArtFallback />}>
            <HeroArt />
          </Suspense>
        </div>
      </section>

      {/* -------------------------- Beneficios -------------------------- */}
      <section className="wrap py-16 md:py-24">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-accent">Todo lo necesario</p>
          <h2 className="mt-3 font-display text-[clamp(30px,4vw,46px)] leading-tight font-medium">
            Pensado para vender, fácil de administrar
          </h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              data-reveal
              className="group rounded-sm border border-line bg-surface p-6 transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-card"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-110">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-sm font-bold tracking-wide">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------- Cómo funciona ------------------------- */}
      <section className="border-y border-line bg-cream-2">
        <div className="wrap py-16 md:py-24">
          <div data-reveal className="max-w-2xl">
            <p className="eyebrow text-accent">Cómo funciona</p>
            <h2 className="mt-3 font-display text-[clamp(30px,4vw,46px)] leading-tight font-medium">
              De tu Excel a la tienda en tres pasos
            </h2>
          </div>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} data-reveal className="relative">
                <span className="font-display text-6xl leading-none font-medium text-accent/25">0{i + 1}</span>
                <div className="mt-3 flex items-center gap-2">
                  <Icon className="size-4 text-accent" aria-hidden />
                  <h3 className="text-sm font-bold tracking-wide">{title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------- Novedades --------------------------- */}
      <Suspense>
        <LatestProducts />
      </Suspense>

      {/* ------------------------------ CTA ------------------------------ */}
      <section className="wrap pb-16 md:pb-24">
        <div
          data-reveal
          className="relative overflow-hidden rounded-sm bg-night px-6 py-14 text-center md:px-16 md:py-20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgb(156_39_176/0.35),transparent_55%),radial-gradient(circle_at_85%_100%,rgb(233_30_99/0.3),transparent_55%)]"
          />
          <div className="relative">
            <h2 className="font-display text-[clamp(30px,4.5vw,50px)] leading-tight font-medium text-white">
              ¿Listo para subir tus productos?
            </h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-[#d8cddc]">
              Descarga la plantilla, llénala con tu inventario y publícalo en minutos.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/admin/importar" className="btn bg-white px-6! py-3.5! text-[#130218] hover:bg-[#f8e8f4]">
                <Upload className="size-4" /> Importar productos
              </Link>
              <Link href="/tienda" className="btn border border-white/25 px-6! py-3.5! text-white hover:border-white">
                Explorar catálogo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */

async function CatalogSummary() {
  const categories = await getCategories();
  const total = categories.reduce((sum, c) => sum + c.total, 0);
  if (!total) return null;
  return (
    <p className="animate-in mt-8 text-xs [--delay:400ms]">
      <strong className="text-ink">{total}</strong> productos publicados en{" "}
      <strong className="text-ink">{categories.length}</strong> {categories.length === 1 ? "categoría" : "categorías"}
    </p>
  );
}

/** Collage con los últimos productos que tienen foto; si no hay, el ícono de la marca. */
async function HeroArt() {
  const products = (await getLatestProducts(12)).filter((p) => p.images.length).slice(0, 3);
  if (products.length < 3) return <HeroArtFallback />;

  const positions = [
    "left-[6%] top-[8%] w-[46%] -rotate-6 [--delay:250ms]",
    "right-[4%] top-0 w-[44%] rotate-3 [--delay:400ms]",
    "left-[26%] bottom-0 w-[48%] rotate-1 [--delay:550ms]",
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]" aria-hidden>
      {products.map((p, i) => (
        <HeroCard key={p.id} product={p} className={positions[i]} floatDelay={`${i * -2}s`} />
      ))}
    </div>
  );
}

function HeroCard({ product, className, floatDelay }: { product: Product; className: string; floatDelay: string }) {
  return (
    <div className={`animate-in absolute ${className}`}>
      <div className="animate-float overflow-hidden rounded-sm border border-line bg-surface shadow-card" style={{ animationDelay: floatDelay }}>
        <div className="relative aspect-square bg-cream-2">
          <ProductImage src={product.images[0]} alt="" sizes="(min-width: 1024px) 240px, 45vw" priority />
        </div>
        <p className="truncate px-3 py-2 text-[11px] font-semibold text-ink">{product.name}</p>
      </div>
    </div>
  );
}

function HeroArtFallback() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[460px] items-center justify-center" aria-hidden>
      <div className="absolute inset-[12%] rounded-full border border-accent/20" />
      <div className="absolute inset-[24%] rounded-full border border-accent/15" />
      <div className="animate-in animate-float relative w-[46%] [--delay:200ms]">
        <Image src={brandIcon} alt="" sizes="(min-width: 1024px) 220px, 45vw" loading="eager" />
      </div>
    </div>
  );
}

async function LatestProducts() {
  const products = await getLatestProducts(8);
  if (!products.length) return null;

  return (
    <section className="wrap py-16 md:py-24">
      <div data-reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-accent">Novedades</p>
          <h2 className="mt-3 font-display text-[clamp(30px,4vw,46px)] leading-tight font-medium">Recién agregados</h2>
        </div>
        <Link href="/tienda" className="group inline-flex items-center gap-1 text-xs font-bold tracking-[.12em] text-ink uppercase hover:text-accent">
          Ver todo <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
