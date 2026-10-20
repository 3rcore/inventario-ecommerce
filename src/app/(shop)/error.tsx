"use client";

import { useEffect } from "react";

export default function ShopError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="wrap flex flex-col items-center gap-4 py-24 text-center">
      <h2 className="font-display text-3xl">No pudimos cargar el catálogo</h2>
      <p className="text-sm">Revisa tu conexión o inténtalo nuevamente en unos segundos.</p>
      <button onClick={() => retry()} className="btn btn-primary">
        Reintentar
      </button>
    </div>
  );
}
