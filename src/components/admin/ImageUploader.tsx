"use client";

import { useRef, useState, type DragEvent } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, X } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { MAX_IMAGES_PER_PRODUCT } from "@/config/site";
import { ACCEPTED_IMAGE_TYPES, uploadProductImage } from "@/lib/storage";

type Props = {
  name: string;
  defaultValue?: string[];
  error?: string;
};

/**
 * Sube imágenes al bucket de Supabase y guarda las URLs en inputs ocultos (`name`).
 * La primera imagen es la principal. Permite reordenar, quitar y pegar URLs externas.
 */
export function ImageUploader({ name, defaultValue = [], error }: Props) {
  const [images, setImages] = useState<string[]>(defaultValue);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const remaining = MAX_IMAGES_PER_PRODUCT - images.length;

  async function handleFiles(files: FileList | File[]) {
    setUploadError(null);
    const list = Array.from(files).slice(0, remaining);
    if (!list.length) return;

    setUploading(list.length);
    const results = await Promise.allSettled(list.map(uploadProductImage));
    setUploading(0);

    const urls = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const errors = results.flatMap((r) => (r.status === "rejected" ? [(r.reason as Error).message] : []));
    setImages((prev) => [...prev, ...urls].slice(0, MAX_IMAGES_PER_PRODUCT));
    if (errors.length) setUploadError(errors.join(" · "));
  }

  function addUrl() {
    const url = prompt("Pega la URL de la imagen (https://…)")?.trim();
    if (!url) return;
    if (!/^https?:\/\/\S+$/i.test(url)) return setUploadError("La URL debe empezar con http:// o https://");
    if (images.includes(url)) return;
    setImages((prev) => [...prev, url].slice(0, MAX_IMAGES_PER_PRODUCT));
  }

  const move = (from: number, to: number) =>
    setImages((prev) => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {images.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((url, i) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-sm border border-line bg-cream-2">
            <ProductImage src={url} alt={`Imagen ${i + 1}`} sizes="160px" />
            {i === 0 ? (
              <span className="absolute top-1.5 left-1.5 rounded-sm bg-night px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white uppercase">
                Principal
              </span>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-surface/90 p-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
              <IconButton label="Mover a la izquierda" disabled={i === 0} onClick={() => move(i, i - 1)}>
                <ArrowLeft className="size-3.5" />
              </IconButton>
              <IconButton label="Quitar imagen" onClick={() => setImages((prev) => prev.filter((u) => u !== url))}>
                <X className="size-3.5 text-danger" />
              </IconButton>
              <IconButton label="Mover a la derecha" disabled={i === images.length - 1} onClick={() => move(i, i + 1)}>
                <ArrowRight className="size-3.5" />
              </IconButton>
            </div>
          </div>
        ))}

        {Array.from({ length: uploading }, (_, i) => (
          <div key={`up-${i}`} className="flex aspect-square items-center justify-center rounded-sm border border-line bg-cream-2">
            <Loader2 className="size-6 animate-spin text-accent" />
          </div>
        ))}

        {remaining > 0 && !uploading ? (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-sm border-2 border-dashed text-xs transition-colors ${dragOver ? "border-accent bg-accent-soft" : "border-line hover:border-accent"}`}
          >
            <ImagePlus className="size-6 text-accent" />
            Subir o arrastrar
          </button>
        ) : null}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>
          {images.length}/{MAX_IMAGES_PER_PRODUCT} imágenes · JPG, PNG, WEBP o AVIF hasta 5 MB
        </span>
        {remaining > 0 ? (
          <button type="button" onClick={addUrl} className="inline-flex items-center gap-1 font-semibold text-accent hover:underline">
            <Link2 className="size-3.5" /> Agregar por URL
          </button>
        ) : null}
      </div>

      {uploadError || error ? (
        <p role="alert" className="text-xs text-danger">
          {uploadError ?? error}
        </p>
      ) : null}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded-sm p-1 hover:bg-cream-2 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
