import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { isAdmin } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { siteConfig } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata = { title: { default: "Panel", template: `%s · Panel · ${siteConfig.name}` } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-cream-2">
      <SetupNotice />
      <header className="border-b border-line bg-surface">
        <div className="wrap flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-3">
              <Logo eager className="h-8 w-auto" />
              <span className="border-l border-line pl-3 font-display text-xl font-semibold text-accent">Panel</span>
            </Link>
            <AdminNav />
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/" target="_blank" className="hidden items-center gap-1 font-semibold hover:text-accent sm:inline-flex">
              Ver tienda <ExternalLink className="size-3.5" />
            </Link>
            <ThemeToggle className="size-9!" />
            <Suspense>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="wrap flex-1 py-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-sm bg-surface" />}>
          <RequireSession>{children}</RequireSession>
        </Suspense>
      </main>
    </div>
  );
}

/** Defensa en profundidad: el proxy ya redirige, pero validamos también aquí. */
async function RequireSession({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) return children;
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user)) redirect("/login");
  return children;
}

async function UserMenu() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user)) return null;

  return (
    <form action={signOut} className="flex items-center gap-3">
      <span className="hidden max-w-40 truncate text-ink-2 md:inline">{user.email}</span>
      <button type="submit" className="btn btn-outline px-3! py-2!">
        Salir
      </button>
    </form>
  );
}
