"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PanelLeft,
  Activity,
  BarChart2,
  Bell,
  Settings,
  Layers,
} from "lucide-react";
import { ThemeToggle } from "../theme-toggle";

const NAV_ITEMS = [
  { icon: Activity, label: "Overview", href: "/" },
  { icon: BarChart2, label: "Metrics", href: "/metrics" },
  { icon: Layers, label: "Logs", href: "/logs" },
  { icon: Bell, label: "Alerts", href: "/alerts" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const sidebarWidth = collapsed ? 60 : 240;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-base)",
        color: "var(--fg)",
      }}
    >
      {/* Header */}
      <header
        style={{
          height: "3.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-surface)",
          flexShrink: 0,
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2rem",
              height: "2rem",
              borderRadius: "0.375rem",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--fg-muted)",
              cursor: "pointer",
            }}
          >
            <PanelLeft size={15} strokeWidth={1.75} aria-hidden />
          </button>

          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              fontSize: "0.875rem",
              letterSpacing: "0.08em",
              color: "var(--accent)",
              userSelect: "none",
            }}
          >
            OBS
          </span>
          {!collapsed && (
            <span
              style={{
                fontSize: "0.8125rem",
                color: "var(--fg-muted)",
                fontWeight: 400,
              }}
            >
              / dashboard
            </span>
          )}
        </div>

        <ThemeToggle />
      </header>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <aside
          style={{
            width: sidebarWidth,
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            background: "var(--bg-surface)",
            overflow: "hidden",
            transition: "width 0.2s ease",
            display: "flex",
            flexDirection: "column",
            backgroundImage:
              "radial-gradient(circle, var(--border) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0",
          }}
        >
          <nav
            style={{
              padding: "0.75rem 0.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.125rem",
            }}
          >
            {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
              const active = isActive(href);
              return (
                <Link
                  key={label}
                  href={href}
                  title={collapsed ? label : undefined}
                  aria-label={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0.5rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    background: active ? "var(--bg-elevated)" : "transparent",
                    color: active ? "var(--fg)" : "var(--fg-muted)",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: active ? 500 : 400,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    width: "100%",
                    transition: "color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (active) return;
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.color = "var(--fg)";
                    el.style.background = "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    if (active) return;
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.color = "var(--fg-muted)";
                    el.style.background = "transparent";
                  }}
                >
                  <Icon
                    size={15}
                    strokeWidth={1.75}
                    style={{ flexShrink: 0 }}
                    aria-hidden
                  />
                  {!collapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            overflow: "auto",
            padding: "1.5rem",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
