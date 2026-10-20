import type { User } from "@supabase/supabase-js";

/** Admin = usuario con app_metadata.role = 'admin' (se asigna solo por SQL, ver supabase/admin.sql). */
export const isAdmin = (user: User | null | undefined): user is User => user?.app_metadata?.role === "admin";
