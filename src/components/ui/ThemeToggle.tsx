"use client";

import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

/**
 * Alterna claro/oscuro y guarda la elección. No tiene estado de React:
 * los íconos se muestran con CSS según data-theme, así no hay desajuste de hidratación.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = () => {
    const root = document.documentElement;
    const next: Theme = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Modo privado / storage bloqueado: el cambio aplica solo a esta visita.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Modo claro / oscuro"
      className={`group flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-accent hover:text-accent ${className}`}
    >
      <Moon className="size-[18px] transition-transform duration-300 group-hover:-rotate-12 dark:hidden" aria-hidden />
      <Sun className="hidden size-[18px] transition-transform duration-500 group-hover:rotate-90 dark:block" aria-hidden />
    </button>
  );
}
