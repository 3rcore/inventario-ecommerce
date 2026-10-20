import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Aviso visible mientras faltan las variables de entorno de Supabase. */
export function SetupNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="border-b border-gold/40 bg-[#fbf7ef] text-sm text-ink">
      <div className="wrap py-3">
        <strong>Modo demo sin base de datos.</strong> Configura <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
        <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> en <code>.env.local</code> (ver README).
      </div>
    </div>
  );
}
