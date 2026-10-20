"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";

export type LoginState = { message?: string };

const loginSchema = z.object({
  email: z.email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  next: z.string().optional(),
});

/** Solo permite redirecciones internas a /admin (evita open redirect). */
const safeNext = (next?: string) => (next && next.startsWith("/admin") ? next : "/admin");

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isSupabaseConfigured) return { message: "Supabase no está configurado todavía." };

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: parsed.error.issues[0].message };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { message: "Correo o contraseña incorrectos." };
  if (!isAdmin(data.user)) {
    await supabase.auth.signOut();
    return { message: "Este usuario no tiene acceso al panel." };
  }

  redirect(safeNext(parsed.data.next));
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/login");
}
