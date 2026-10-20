import Image from "next/image";
import { siteConfig } from "@/config/site";
import logoColor from "@/assets/brand/logo-3rcore.webp";
import logoWhite from "@/assets/brand/logo-3rcore-blanco.webp";

type Props = {
  /** "auto" cambia según el tema; "white" para fondos siempre oscuros (footer). */
  variant?: "auto" | "white";
  className?: string;
  /** Solo el logo visible al cargar (header) debe ir con prioridad. */
  eager?: boolean;
};

/**
 * Import estático: Next conoce el tamaño (sin saltos de layout), lo sirve con hash
 * y caché inmutable, y genera la versión justa para cada pantalla.
 * En "auto" se renderizan ambos logos y CSS muestra uno; el blanco pesa ~3 KB.
 */
export function Logo({ variant = "auto", className = "h-9 w-auto", eager }: Props) {
  const alt = siteConfig.poweredBy.name;
  const common = {
    sizes: "180px",
    loading: eager ? ("eager" as const) : undefined,
    fetchPriority: eager ? ("high" as const) : undefined,
  };

  if (variant === "white") return <Image src={logoWhite} alt={alt} {...common} className={className} />;

  return (
    <>
      <Image src={logoColor} alt={alt} {...common} className={`${className} dark:hidden`} />
      <Image src={logoWhite} alt="" aria-hidden {...common} className={`${className} hidden dark:block`} />
    </>
  );
}
