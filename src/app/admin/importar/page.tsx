import type { Metadata } from "next";
import { ImportWizard } from "@/components/admin/ImportWizard";

export const metadata: Metadata = { title: "Importar productos" };

const COLUMNS = [
  ["sku", "Sí", "Código único. Si ya existe, el producto se actualiza (o se omite, según elijas)."],
  ["nombre", "Sí", "Nombre del producto."],
  ["precio", "Sí", "Precio normal. Acepta 89.90, 89,90 o S/ 89.90."],
  ["precio_oferta", "No", "Debe ser menor al precio. Vacío = sin oferta."],
  ["stock", "No", "Cantidad entera. Vacío = 0."],
  ["categoria", "No", "Texto libre. Formato WooCommerce «Ropa > Polos» también funciona."],
  ["marca", "No", "Texto libre."],
  ["descripcion", "No", "Texto largo."],
  ["imagenes", "No", "URLs o nombres de archivo separados por «|». La primera es la principal."],
  ["activo", "No", "si / no. Vacío = publicado."],
] as const;

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-accent">Carga por lote</p>
        <h1 className="font-display text-4xl font-medium">Importar desde Excel o CSV</h1>
        <p className="mt-2 max-w-2xl text-sm">
          Sube tu archivo, revisa la vista previa y confirma. Nada se guarda hasta que presiones «Importar».
        </p>
      </div>

      <ImportWizard />

      <details className="rounded-sm border border-line bg-surface p-5 md:p-6">
        <summary className="cursor-pointer text-xs font-bold tracking-[.14em] text-ink uppercase">Formato de columnas</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-[11px] tracking-wider text-ink uppercase">
              <tr className="border-b border-line">
                <th className="py-2 pr-4">Columna</th>
                <th className="py-2 pr-4">Obligatoria</th>
                <th className="py-2">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COLUMNS.map(([col, req, detail]) => (
                <tr key={col}>
                  <td className="py-2 pr-4 font-mono text-xs text-ink">{col}</td>
                  <td className="py-2 pr-4">{req}</td>
                  <td className="py-2">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs">
            Los encabezados no distinguen mayúsculas ni tildes, y se reconocen alias en inglés (Name, Regular price, Sale price,
            Categories, Images, Published…).
          </p>
        </div>
      </details>
    </div>
  );
}
