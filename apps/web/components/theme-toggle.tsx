"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render only after mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-md" style={{ background: "var(--bg-elevated)" }} />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "2rem",
        height: "2rem",
        borderRadius: "0.375rem",
        border: "1px solid var(--border)",
        background: "var(--bg-elevated)",
        color: "var(--fg-muted)",
        cursor: "pointer",
        transition: "color 0.15s, background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--fg)";
        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-surface)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-muted)";
        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)";
      }}
    >
      {isDark ? (
        <Sun size={15} strokeWidth={1.75} aria-hidden />
      ) : (
        <Moon size={15} strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}
