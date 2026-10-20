import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

/** Cliente del navegador (singleton). Comparte la sesión del admin vía cookies. */
export function getBrowserClient() {
  browserClient ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return browserClient;
}
