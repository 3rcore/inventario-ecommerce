"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { PRODUCTS_TAG } from "@/lib/products/queries";
import { productSlug } from "@/lib/products/format";
import { fieldErrors, importBatchSchema, productInputSchema, type ProductInput } from "@/lib/products/schema";
import { PRODUCT_BUCKET, isSupabaseConfigured, storagePathFromUrl } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";

export type ProductFormState = {
  message?: string;
  errors?: Record<string, string>;
};

export type ImportMode = "upsert" | "create-only";

export type ImportBatchResult = { ok: true; saved: number } | { ok: false; message: string };

const UNIQUE_VIOLATION = "23505";

/** Toda acción de escritura pasa por aquí: valida sesión además de RLS. */
async function requireAdmin() {
  if (!isSupabaseConfigured) throw new Error("Supabase no está configurado.");
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
  return supabase;
}

type Supabase = Awaited<ReturnType<typeof requireAdmin>>;

function readProductForm(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "");
  const num = (key: string) => (text(key).trim() === "" ? Number.NaN : Number(text(key)));

  return {
    sku: text("sku"),
    name: text("name"),
    description: text("description"),
    category: text("category"),
    brand: text("brand"),
    price: num("price"),
    sale_price: text("sale_price").trim() === "" ? null : num("sale_price"),
    stock: text("stock").trim() === "" ? 0 : num("stock"),
    images: formData.getAll("images").map(String).filter(Boolean),
    is_active: formData.get("is_active") === "on",
  };
}

const toRow = (p: ProductInput) => ({ ...p, slug: productSlug(p.name, p.sku) });

async function removeStorageImages(supabase: Supabase, urls: string[]) {
  const paths = urls.map(storagePathFromUrl).filter((p): p is string => p !== null);
  if (!paths.length) return;
  // Si falla no bloqueamos la operación: a lo sumo queda un archivo huérfano.
  const { error } = await supabase.storage.from(PRODUCT_BUCKET).remove(paths);
  if (error) console.error("[storage] No se pudieron eliminar imágenes:", error.message);
}

/* ------------------------------------------------------------------ */
/* Crear / editar                                                      */
/* ------------------------------------------------------------------ */

export async function saveProduct(
  productId: string | null,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = productInputSchema.safeParse(readProductForm(formData));
  if (!parsed.success) {
    return { message: "Revisa los campos marcados.", errors: fieldErrors(parsed.error) };
  }

  let supabase: Supabase;
  try {
    supabase = await requireAdmin();
  } catch (e) {
    return { message: (e as Error).message };
  }

  const row = toRow(parsed.data);
  let removedImages: string[] = [];

  if (productId) {
    const { data: previous } = await supabase.from("products").select("images").eq("id", productId).maybeSingle();
    removedImages = (previous?.images ?? []).filter((url: string) => !row.images.includes(url));

    const { error } = await supabase.from("products").update(row).eq("id", productId);
    if (error) return dbError(error);
  } else {
    const { error } = await supabase.from("products").insert(row);
    if (error) return dbError(error);
  }

  await removeStorageImages(supabase, removedImages);
  updateTag(PRODUCTS_TAG);
  redirect(`/admin?ok=${productId ? "actualizado" : "creado"}`);
}

function dbError(error: { code?: string; message: string }): ProductFormState {
  if (error.code === UNIQUE_VIOLATION) {
    return { message: "Ya existe un producto con ese SKU.", errors: { sku: "Este SKU ya está registrado" } };
  }
  return { message: `No se pudo guardar: ${error.message}` };
}

/* ------------------------------------------------------------------ */
/* Eliminar / activar                                                  */
/* ------------------------------------------------------------------ */

export async function deleteProduct(productId: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const supabase = await requireAdmin();
    const { data, error } = await supabase.from("products").delete().eq("id", productId).select("images").maybeSingle();
    if (error) return { ok: false, message: error.message };
    await removeStorageImages(supabase, data?.images ?? []);
    updateTag(PRODUCTS_TAG);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

export async function setProductActive(productId: string, isActive: boolean): Promise<{ ok: boolean; message?: string }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", productId);
    if (error) return { ok: false, message: error.message };
    updateTag(PRODUCTS_TAG);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/* ------------------------------------------------------------------ */
/* Importación por lote (CSV / Excel)                                  */
/* ------------------------------------------------------------------ */

/**
 * Recibe un lote ya validado en el navegador y lo vuelve a validar aquí
 * (nunca confiar en el cliente). Hace upsert por SKU.
 */
export async function importProductsBatch(rows: unknown, mode: ImportMode): Promise<ImportBatchResult> {
  const parsed = importBatchSchema.safeParse(rows);
  if (!parsed.success) return { ok: false, message: "El lote contiene datos inválidos." };

  let supabase: Supabase;
  try {
    supabase = await requireAdmin();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const toDb = parsed.data.map((p) => ({ ...p, slug: productSlug(p.name, p.sku) }));
  // Filas sin imágenes van en otra llamada para que el upsert no borre las imágenes existentes.
  const withImages = toDb.filter((r) => r.images?.length);
  const withoutImages = toDb.filter((r) => !r.images?.length).map((r) => {
    const copy = { ...r };
    delete copy.images;
    return copy;
  });

  let saved = 0;
  for (const group of [withImages, withoutImages]) {
    if (!group.length) continue;
    const { data, error } = await supabase
      .from("products")
      .upsert(group, { onConflict: "sku", ignoreDuplicates: mode === "create-only" })
      .select("id");
    if (error) {
      return {
        ok: false,
        message:
          error.code === UNIQUE_VIOLATION
            ? "Dos productos generan el mismo enlace (slug). Revisa nombres y SKU repetidos."
            : error.message,
      };
    }
    saved += data?.length ?? 0;
  }

  updateTag(PRODUCTS_TAG);
  return { ok: true, saved };
}
