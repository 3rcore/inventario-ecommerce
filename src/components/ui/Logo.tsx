import Image from "next/image";
import { siteConfig } from "@/config/site";
import logoColor from "@/assets/brand/logo-3rcore.webp";
import logoWhite from "@/assets/brand/logo-3rcore-blanco.webp";

type Props = {
  /** "color" para fondos claros, "white" para fondos oscuros. */
  variant?: "color" | "white";
  className?: string;
  /** Solo el logo visible al cargar (header) debe ir con prioridad. */
  eager?: boolean;
};

/**
 * Import estático: Next conoce el tamaño (sin saltos de layout), lo sirve con hash
 * y caché inmutable, y genera la versión justa para cada pantalla.
 */
export function Logo({ variant = "color", className = "h-9 w-auto", eager }: Props) {
  return (
    <Image
      src={variant === "white" ? logoWhite : logoColor}
      alt={siteConfig.poweredBy.name}
      sizes="180px"
      loading={eager ? "eager" : undefined}
      fetchPriority={eager ? "high" : undefined}
      className={className}
    />
  );
}
