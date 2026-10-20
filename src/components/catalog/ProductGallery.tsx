"use client";

import { useState } from "react";
import { ProductImage } from "@/components/ui/ProductImage";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-sm border border-line bg-cream-2">
        <ProductImage src={images[active]} alt={name} sizes="(min-width: 768px) 50vw, 100vw" priority={active === 0} />
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-pressed={i === active}
              className={`relative aspect-square overflow-hidden rounded-sm border-2 ${i === active ? "border-accent" : "border-transparent hover:border-line"}`}
            >
              <ProductImage src={src} alt="" sizes="100px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
