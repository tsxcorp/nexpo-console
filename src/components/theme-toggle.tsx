"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

/** Simple light/dark toggle button */
export function ThemeToggleSimple({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "p-2 rounded-lg transition-all duration-200",
        "bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600",
        "border border-surface-200 dark:border-surface-600",
        "text-surface-600 dark:text-surface-300",
        className
      )}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
