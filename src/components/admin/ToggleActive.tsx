"use client";

import { useOptimistic, useTransition } from "react";
import { setProductActive } from "@/app/actions/products";

/** Interruptor publicar/ocultar con actualización optimista. */
export function ToggleActive({ id, active }: { id: string; active: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(active);
  const [isPending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      setOptimistic(!optimistic);
      const result = await setProductActive(id, !optimistic);
      if (!result.ok) alert(result.message ?? "No se pudo actualizar.");
    });

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={optimistic ? "Ocultar de la tienda" : "Publicar en la tienda"}
      onClick={toggle}
      disabled={isPending}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${optimistic ? "bg-primary" : "bg-line"}`}
    >
      <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${optimistic ? "translate-x-4.5" : "translate-x-0.5"}`} />
    </button>
  );
}
