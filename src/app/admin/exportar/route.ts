import Papa from "papaparse";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/products/types";

const PAGE = 1000;

/** Exporta todo el inventario en el mismo formato que acepta la importación. */
export async function GET() {
  if (!isSupabaseConfigured) return new Response("Supabase no configurado", { status: 503 });

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const products: Product[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at")
      .range(from, from + PAGE - 1);
    if (error) return new Response(error.message, { status: 500 });
    products.push(...(data as Product[]));
    if (!data || data.length < PAGE) break;
  }

  const csv = Papa.unparse(
    products.map((p) => ({
      sku: p.sku,
      nombre: p.name,
      descripcion: p.description ?? "",
      categoria: p.category ?? "",
      marca: p.brand ?? "",
      precio: p.price,
      precio_oferta: p.sale_price ?? "",
      stock: p.stock,
      imagenes: p.images.join("|"),
      activo: p.is_active ? "si" : "no",
    })),
  );

  const date = new Date().toISOString().slice(0, 10);
  // BOM para que Excel abra bien las tildes.
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventario-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
