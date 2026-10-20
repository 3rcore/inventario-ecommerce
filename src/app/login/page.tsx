import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-cream-2 px-4 py-16">
      <div className="w-full max-w-sm space-y-6 rounded-sm border border-line bg-white p-8 shadow-card">
        <div className="space-y-1 text-center">
          <Link href="/" className="inline-block" aria-label="Ir al catálogo">
            <Logo eager className="mx-auto h-12 w-auto" />
          </Link>
          <p className="text-sm">Acceso al panel de inventario</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
