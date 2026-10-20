"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/actions/products";

export function DeleteProductButton({ id, name, redirectTo }: { id: string; name: string; redirectTo?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = () => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    startTransition(async () => {
      const result = await deleteProduct(id);
      if (!result.ok) {
        alert(result.message ?? "No se pudo eliminar el producto.");
        return;
      }
      // La Server Action ya devuelve la ruta actual re-renderizada (updateTag).
      if (redirectTo) router.push(redirectTo);
    });
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={isPending}
      className="btn btn-outline px-3! py-1.5! text-danger! hover:border-danger!"
      aria-label={`Eliminar ${name}`}
    >
      <Trash2 className="size-3.5" />
      {isPending ? "…" : <span className="hidden lg:inline">Eliminar</span>}
    </button>
  );
}
