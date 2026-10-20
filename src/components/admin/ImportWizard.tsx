"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Images, Loader2, RotateCcw, Upload } from "lucide-react";
import { importProductsBatch, type ImportMode } from "@/app/actions/products";
import { formatPrice } from "@/lib/products/format";
import {
  ACCEPTED_FILE_TYPES,
  downloadTemplate,
  isUrl,
  mapRows,
  readSpreadsheet,
  type ParseResult,
  type RawRow,
} from "@/lib/products/import";
import type { ImportRow } from "@/lib/products/schema";
import { ACCEPTED_IMAGE_TYPES, uploadProductImage } from "@/lib/storage";

const BATCH_SIZE = 100;
const IMAGE_CONCURRENCY = 4;

type Step = "select" | "preview" | "importing" | "done";
type Summary = { saved: number; skipped: number; failed: { line: number; message: string }[] };

export function ImportWizard() {
  const [step, setStep] = useState<Step>("select");
  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<ImportMode>("upsert");
  const [readError, setReadError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ label: "", done: 0, total: 0 });
  const [summary, setSummary] = useState<Summary | null>(null);

  const filesByName = useMemo(
    () => new Map(imageFiles.map((f) => [f.name.toLowerCase(), f] as const)),
    [imageFiles],
  );
  // Se recalcula si el usuario agrega imágenes después de subir el archivo.
  const parsed: ParseResult | null = useMemo(
    () => (rawRows.length ? mapRows(rawRows, new Set(filesByName.keys())) : null),
    [rawRows, filesByName],
  );

  const validRows = parsed?.rows.filter((r) => r.data) ?? [];
  const invalidRows = parsed?.rows.filter((r) => !r.data) ?? [];

  async function onSpreadsheet(file: File | undefined) {
    if (!file) return;
    setReadError(null);
    try {
      const rows = await readSpreadsheet(file);
      if (!rows.length) throw new Error("El archivo no tiene filas de productos.");
      if (rows.length > 5000) throw new Error("Máximo 5000 productos por archivo. Divide el archivo en partes.");
      setFileName(file.name);
      setRawRows(rows);
      setStep("preview");
    } catch (e) {
      setReadError((e as Error).message);
    }
  }

  async function runImport() {
    setStep("importing");
    const failed: Summary["failed"] = [];

    // 1) Subir al bucket las imágenes referenciadas por nombre de archivo (una sola vez cada una).
    const neededFiles = [
      ...new Set(validRows.flatMap((r) => r.imageRefs.filter((ref) => !isUrl(ref)).map((ref) => ref.toLowerCase()))),
    ];
    const uploaded = new Map<string, string>();
    setProgress({ label: "Subiendo imágenes", done: 0, total: neededFiles.length });

    for (let i = 0; i < neededFiles.length; i += IMAGE_CONCURRENCY) {
      const chunk = neededFiles.slice(i, i + IMAGE_CONCURRENCY);
      await Promise.all(
        chunk.map(async (name) => {
          try {
            uploaded.set(name, await uploadProductImage(filesByName.get(name)!));
          } catch (e) {
            console.error(e);
          }
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }),
      );
    }

    // 2) Resolver imágenes de cada fila.
    const ready: { line: number; data: ImportRow }[] = [];
    for (const row of validRows) {
      const images = row.imageRefs.map((ref) => (isUrl(ref) ? ref : uploaded.get(ref.toLowerCase())));
      if (images.some((u) => !u)) {
        failed.push({ line: row.line, message: "No se pudo subir alguna de sus imágenes" });
        continue;
      }
      ready.push({ line: row.line, data: { ...row.data!, images: images.length ? (images as string[]) : undefined } });
    }

    // 3) Guardar por lotes.
    let saved = 0;
    let batchFailures = 0;
    setProgress({ label: "Guardando productos", done: 0, total: ready.length });
    for (let i = 0; i < ready.length; i += BATCH_SIZE) {
      const batch = ready.slice(i, i + BATCH_SIZE);
      try {
        const result = await importProductsBatch(
          batch.map((r) => r.data),
          mode,
        );
        if (result.ok) saved += result.saved;
        else {
          batchFailures += batch.length;
          batch.forEach((r) => failed.push({ line: r.line, message: result.message }));
        }
      } catch {
        batchFailures += batch.length;
        batch.forEach((r) => failed.push({ line: r.line, message: "Error de red al guardar el lote" }));
      }
      setProgress((p) => ({ ...p, done: Math.min(p.total, p.done + batch.length) }));
    }

    // En modo "solo crear", los SKU existentes no se devuelven como guardados: son los omitidos.
    setSummary({ saved, skipped: Math.max(0, ready.length - batchFailures - saved), failed });
    setStep("done");
  }

  function reset() {
    setStep("select");
    setRawRows([]);
    setImageFiles([]);
    setFileName("");
    setSummary(null);
    setReadError(null);
  }

  /* ---------------------------- Render ---------------------------- */

  if (step === "importing") {
    const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 100;
    return (
      <Panel>
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <Loader2 className="size-8 animate-spin text-accent" />
          <p className="font-semibold text-ink">
            {progress.label}… {progress.done}/{progress.total}
          </p>
          <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-cream-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs">No cierres esta pestaña hasta que termine.</p>
        </div>
      </Panel>
    );
  }

  if (step === "done" && summary) {
    return (
      <Panel>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-8 text-success" />
            <div>
              <h2 className="text-lg font-semibold">Importación finalizada</h2>
              <p className="text-sm">{fileName}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Guardados" value={summary.saved} tone="ok" />
            <Stat label="Omitidos (SKU ya existía)" value={summary.skipped} />
            <Stat label="Con errores" value={summary.failed.length + invalidRows.length} tone={summary.failed.length + invalidRows.length ? "bad" : undefined} />
          </div>
          {summary.failed.length ? <ErrorList items={summary.failed.map((f) => ({ line: f.line, errors: [f.message] }))} /> : null}
          <div className="flex flex-wrap gap-3">
            <Link href="/admin" className="btn btn-primary">Ver inventario</Link>
            <button type="button" onClick={reset} className="btn btn-outline">
              <RotateCcw className="size-4" /> Importar otro archivo
            </button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Paso 1: archivo + imágenes */}
      <Panel>
        <div className="grid gap-6 md:grid-cols-2">
          <DropZone
            icon={<FileSpreadsheet className="size-8 text-accent" />}
            title={fileName || "1. Archivo de productos"}
            description={fileName ? `${rawRows.length} filas leídas · clic para cambiar` : "Arrastra o selecciona un .xlsx, .xls o .csv"}
            accept={ACCEPTED_FILE_TYPES}
            onFiles={(files) => onSpreadsheet(files[0])}
          />
          <DropZone
            icon={<Images className="size-8 text-accent" />}
            title={imageFiles.length ? `${imageFiles.length} imágenes seleccionadas` : "2. Imágenes (opcional)"}
            description="Si en la columna «imagenes» pones nombres de archivo (polo.jpg), súbelos aquí. También puedes usar URLs."
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            onFiles={(files) => setImageFiles((prev) => [...prev, ...files])}
          />
        </div>

        {readError ? (
          <p role="alert" className="mt-4 text-sm text-danger">{readError}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-xs">
          <span>¿No tienes el formato?</span>
          <button type="button" onClick={() => downloadTemplate("xlsx")} className="font-semibold text-accent hover:underline">
            Descargar plantilla Excel
          </button>
          <button type="button" onClick={() => downloadTemplate("csv")} className="font-semibold text-accent hover:underline">
            Descargar plantilla CSV
          </button>
          <span className="text-ink-2">· También acepta exportaciones de WooCommerce.</span>
        </div>
      </Panel>

      {/* Paso 2: vista previa */}
      {step === "preview" && parsed ? (
        parsed.missingRequired.length ? (
          <Panel>
            <p className="flex items-center gap-2 text-sm text-danger">
              <AlertTriangle className="size-4" />
              Faltan columnas obligatorias: <strong>{parsed.missingRequired.join(", ")}</strong>. Revisa la plantilla.
            </p>
          </Panel>
        ) : (
          <Panel>
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-3">
                  <Stat label="Listos para importar" value={validRows.length} tone="ok" />
                  <Stat label="Con errores" value={invalidRows.length} tone={invalidRows.length ? "bad" : undefined} />
                </div>
                <fieldset className="space-y-1.5 text-sm text-ink">
                  <legend className="mb-1 text-xs font-semibold">Si el SKU ya existe:</legend>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="mode" checked={mode === "upsert"} onChange={() => setMode("upsert")} className="accent-accent" />
                    Actualizar el producto existente
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="mode" checked={mode === "create-only"} onChange={() => setMode("create-only")} className="accent-accent" />
                    Omitirlo (solo crear nuevos)
                  </label>
                </fieldset>
              </div>

              {parsed.unknownColumns.length ? (
                <p className="text-xs">
                  Columnas ignoradas: <span className="text-ink">{parsed.unknownColumns.join(", ")}</span>
                </p>
              ) : null}

              {invalidRows.length ? <ErrorList items={invalidRows.map((r) => ({ line: r.line, errors: r.errors }))} /> : null}

              <PreviewTable rows={validRows.slice(0, 50).map((r) => ({ line: r.line, data: r.data!, images: r.imageRefs.length }))} />
              {validRows.length > 50 ? <p className="text-xs">Mostrando 50 de {validRows.length} productos válidos.</p> : null}

              <div className="flex flex-wrap gap-3 border-t border-line pt-4">
                <button type="button" onClick={runImport} disabled={!validRows.length} className="btn btn-primary">
                  <Upload className="size-4" /> Importar {validRows.length} productos
                </button>
                <button type="button" onClick={reset} className="btn btn-outline">Cancelar</button>
              </div>
            </div>
          </Panel>
        )
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-sm border border-line bg-white p-5 md:p-6">{children}</section>;
}

function DropZone({
  icon,
  title,
  description,
  accept,
  multiple,
  onFiles,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed px-6 py-10 text-center transition-colors ${over ? "border-accent bg-accent-soft" : "border-line hover:border-accent"}`}
    >
      {icon}
      <span className="text-sm font-semibold break-all text-ink">{title}</span>
      <span className="max-w-xs text-xs">{description}</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
    </label>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "bad" }) {
  const color = tone === "ok" ? "text-success" : tone === "bad" ? "text-danger" : "text-ink";
  return (
    <div className="rounded-sm border border-line px-4 py-2.5">
      <p className="text-[11px] tracking-wider uppercase">{label}</p>
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function ErrorList({ items }: { items: { line: number; errors: string[] }[] }) {
  return (
    <details className="rounded-sm border border-danger/30 bg-danger/5 p-4 text-sm" open={items.length <= 10}>
      <summary className="cursor-pointer font-semibold text-danger">
        {items.length} {items.length === 1 ? "fila no se importará" : "filas no se importarán"}
      </summary>
      <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-xs">
        {items.map((item) => (
          <li key={item.line}>
            <strong className="text-ink">Fila {item.line}:</strong> {item.errors.join(" · ")}
          </li>
        ))}
      </ul>
    </details>
  );
}

function PreviewTable({ rows }: { rows: { line: number; data: ImportRow; images: number }[] }) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto rounded-sm border border-line">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead className="bg-cream-2 text-[10.5px] tracking-wider text-ink uppercase">
          <tr>
            <th className="px-3 py-2">Fila</th>
            <th className="px-3 py-2">SKU</th>
            <th className="px-3 py-2">Nombre</th>
            <th className="px-3 py-2">Categoría</th>
            <th className="px-3 py-2 text-right">Precio</th>
            <th className="px-3 py-2 text-right">Oferta</th>
            <th className="px-3 py-2 text-right">Stock</th>
            <th className="px-3 py-2 text-center">Imágenes</th>
            <th className="px-3 py-2 text-center">Publicado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(({ line, data, images }) => (
            <tr key={line}>
              <td className="px-3 py-2 text-ink-2">{line}</td>
              <td className="px-3 py-2 font-mono">{data.sku}</td>
              <td className="max-w-64 truncate px-3 py-2 font-semibold text-ink">{data.name}</td>
              <td className="px-3 py-2">{data.category ?? "—"}</td>
              <td className="px-3 py-2 text-right">{formatPrice(data.price)}</td>
              <td className="px-3 py-2 text-right">{data.sale_price !== null ? formatPrice(data.sale_price) : "—"}</td>
              <td className="px-3 py-2 text-right">{data.stock}</td>
              <td className="px-3 py-2 text-center">{images || "—"}</td>
              <td className="px-3 py-2 text-center">{data.is_active ? "Sí" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
