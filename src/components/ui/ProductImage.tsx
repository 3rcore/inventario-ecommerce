import Image from "next/image";
import { ImageOff } from "lucide-react";
import { SUPABASE_URL } from "@/lib/supabase/env";

type Props = {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

/**
 * Imágenes del bucket de Supabase → optimizadas con next/image.
 * URLs externas (p. ej. importadas desde WooCommerce) → se sirven tal cual.
 */
export function ProductImage({ src, alt, sizes, className = "", priority }: Props) {
  if (!src) {
    return (
      <div className={`flex size-full items-center justify-center bg-cream-2 text-line ${className}`}>
        <ImageOff className="size-10" aria-hidden />
        <span className="sr-only">Sin imagen</span>
      </div>
    );
  }

  const isOwnStorage = Boolean(SUPABASE_URL) && src.startsWith(SUPABASE_URL);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!isOwnStorage}
      className={`object-cover ${className}`}
    />
  );
}
