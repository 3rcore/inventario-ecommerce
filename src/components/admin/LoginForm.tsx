"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type LoginState } from "@/app/actions/auth";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-ink">Correo</span>
        <input name="email" type="email" required autoComplete="email" className="field" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-ink">Contraseña</span>
        <input name="password" type="password" required autoComplete="current-password" className="field" />
      </label>
      {state.message ? (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={isPending} className="btn btn-primary w-full py-3!">
        {isPending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
