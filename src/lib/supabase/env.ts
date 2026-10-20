// Acceso directo a process.env.NEXT_PUBLIC_* para que Next los incruste en el bundle del cliente.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const PRODUCT_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "productos";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Devuelve la ruta dentro del bucket si la URL pertenece a nuestro Storage; si no, null. */
export function storagePathFromUrl(url: string): string | null {
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/${PRODUCT_BUCKET}/`;
  return url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length)) : null;
}
