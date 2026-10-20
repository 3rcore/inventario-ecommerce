import { z } from "zod";
import { MAX_IMAGES_PER_PRODUCT } from "@/config/site";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .nullish()
    .transform((v) => (v ? v : null));

const productFields = z.object({
  sku: z
    .string({ error: "El SKU es obligatorio" })
    .trim()
    .min(1, "El SKU es obligatorio")
    .max(64, "Máximo 64 caracteres"),
  name: z
    .string({ error: "El nombre es obligatorio" })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(200, "Máximo 200 caracteres"),
  description: optionalText(5000),
  category: optionalText(80),
  brand: optionalText(80),
  price: z
    .number({ error: "Precio inválido" })
    .nonnegative("El precio no puede ser negativo")
    .max(99_999_999, "Precio demasiado alto"),
  sale_price: z.number({ error: "Precio de oferta inválido" }).nonnegative().nullable(),
  stock: z.number({ error: "Stock inválido" }).int("El stock debe ser entero").min(0, "El stock no puede ser negativo"),
  images: z.array(z.url("URL de imagen inválida")).max(MAX_IMAGES_PER_PRODUCT, `Máximo ${MAX_IMAGES_PER_PRODUCT} imágenes`),
  is_active: z.boolean(),
});

const salePriceBelowPrice = {
  check: (p: { price: number; sale_price: number | null }) => p.sale_price === null || p.sale_price < p.price,
  params: { message: "El precio de oferta debe ser menor al precio normal", path: ["sale_price"] },
};

/**
 * Validación única de un producto. Se usa en el formulario, en la importación
 * masiva (cliente, para la vista previa) y otra vez en el servidor antes de guardar.
 */
export const productInputSchema = productFields.refine(salePriceBelowPrice.check, salePriceBelowPrice.params);
export type ProductInput = z.infer<typeof productInputSchema>;

/** Lote de importación: las imágenes son opcionales para no borrar las existentes al actualizar. */
export const importRowSchema = productFields
  .extend({ images: productFields.shape.images.optional() })
  .refine(salePriceBelowPrice.check, salePriceBelowPrice.params);
export const importBatchSchema = z.array(importRowSchema).min(1).max(500);
export type ImportRow = z.infer<typeof importRowSchema>;

/** Mapa campo → primer mensaje de error, para mostrar en formularios. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    out[key] ??= issue.message;
  }
  return out;
}
