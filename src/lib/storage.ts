import { MAX_IMAGE_SIZE_MB } from "@/config/site";
import { PRODUCT_BUCKET } from "@/lib/supabase/env";
import { getBrowserClient } from "@/lib/supabase/client";

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return `"${file.name}": formato no permitido (usa JPG, PNG, WEBP o AVIF)`;
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) return `"${file.name}": supera ${MAX_IMAGE_SIZE_MB} MB`;
  return null;
}

/**
 * Sube una imagen directo del navegador al bucket (sin pasar por el servidor de Next,
 * así no hay límite de tamaño de las Server Actions). Requiere sesión de admin: RLS lo valida.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const invalid = validateImageFile(file);
  if (invalid) throw new Error(invalid);

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `products/${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const storage = getBrowserClient().storage.from(PRODUCT_BUCKET);

  const { error } = await storage.upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`No se pudo subir "${file.name}": ${error.message}`);

  return storage.getPublicUrl(path).data.publicUrl;
}
