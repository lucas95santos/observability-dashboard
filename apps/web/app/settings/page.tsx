"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Bell, RefreshCw, Server } from "lucide-react";
import { Shell } from "../../components/layout/shell";

interface DashboardSettings {
  alertMinSeverity: "info" | "warning" | "critical";
  refreshInterval: 10 | 30 | 60;
  toastNotifications: boolean;
  maxLogEntries: 50 | 100 | 200;
}

const DEFAULT_SETTINGS: DashboardSettings = {
  alertMinSeverity: "info",
  refreshInterval: 30,
  toastNotifications: true,
  maxLogEntries: 100,
};

const STORAGE_KEY = "obs-dashboard-settings";

function loadSettings(): DashboardSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as DashboardSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "0.5rem",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.875rem 1rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-elevated)",
        }}
      >
        <Icon
          size={14}
          strokeWidth={1.75}
          style={{ color: "var(--fg-muted)" }}
          aria-hidden
        />
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--fg)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </span>
      </div>
      <div
        style={{
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.125rem",
          minWidth: 0,
        }}
      >
        <span
          style={{ fontSize: "0.8125rem", color: "var(--fg)", fontWeight: 500 }}
        >
          {label}
        </span>
        {description && (
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--fg-muted)",
              lineHeight: 1.5,
            }}
          >
            {description}
          </span>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "0.375rem",
        padding: "2px",
        gap: "2px",
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "0.3125rem 0.75rem",
              borderRadius: "0.25rem",
              border: "none",
              background: active ? "var(--bg-surface)" : "transparent",
              color: active ? "var(--fg)" : "var(--fg-muted)",
              fontSize: "0.75rem",
              fontWeight: active ? 500 : 400,
              cursor: "pointer",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: "2.25rem",
        height: "1.25rem",
        borderRadius: "9999px",
        border: "none",
        background: checked ? "var(--accent)" : "var(--border)",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: checked ? "calc(100% - 18px)" : "2px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

function ThemeButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.75rem 1rem",
        borderRadius: "0.375rem",
        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
        background: active
          ? "color-mix(in srgb, var(--accent) 8%, var(--bg-surface))"
          : "var(--bg-elevated)",
        color: active ? "var(--accent)" : "var(--fg-muted)",
        cursor: "pointer",
        transition: "all 0.15s",
        minWidth: "5rem",
      }}
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden />
      <span style={{ fontSize: "0.75rem", fontWeight: active ? 500 : 400 }}>
        {label}
      </span>
    </button>
  );
}

function ReadonlyField({ value }: { value: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.75rem",
        color: "var(--fg-muted)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "0.25rem",
        padding: "0.25rem 0.5rem",
      }}
    >
      {value}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(loadSettings());
  }, []);

  function update<K extends keyof DashboardSettings>(
    key: K,
    value: DashboardSettings[K],
  ) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  return (
    <Shell>
      <div
        style={{
          maxWidth: "640px",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
          >
            <h1
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--fg)",
                letterSpacing: "-0.01em",
              }}
            >
              Settings
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>
              Customize your dashboard preferences.
            </p>
          </div>
          {saved && (
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--chart-2)",
                fontWeight: 500,
                transition: "opacity 0.3s",
              }}
            >
              Saved
            </span>
          )}
        </div>

        {/* Appearance */}
        <Section icon={Sun} title="Appearance">
          <Row
            label="Theme"
            description="Choose between light, dark, or your system preference."
          >
            {mounted ? (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <ThemeButton
                  icon={Sun}
                  label="Light"
                  active={theme === "light"}
                  onClick={() => setTheme("light")}
                />
                <ThemeButton
                  icon={Moon}
                  label="Dark"
                  active={theme === "dark"}
                  onClick={() => setTheme("dark")}
                />
                <ThemeButton
                  icon={Monitor}
                  label="System"
                  active={theme === "system"}
                  onClick={() => setTheme("system")}
                />
              </div>
            ) : (
              <div
                style={{
                  height: "4rem",
                  width: "15rem",
                  background: "var(--bg-elevated)",
                  borderRadius: "0.375rem",
                }}
              />
            )}
          </Row>
        </Section>

        {/* Data & Refresh */}
        <Section icon={RefreshCw} title="Data & Refresh">
          <Row
            label="Alert refresh interval"
            description="How often to poll for new alerts."
          >
            <SegmentedControl
              value={settings.refreshInterval}
              options={[
                { label: "10s", value: 10 as const },
                { label: "30s", value: 30 as const },
                { label: "60s", value: 60 as const },
              ]}
              onChange={(v) =>
                update(
                  "refreshInterval",
                  v as DashboardSettings["refreshInterval"],
                )
              }
            />
          </Row>
          <Row
            label="Max log entries"
            description="Number of log lines shown in the Logs view."
          >
            <SegmentedControl
              value={settings.maxLogEntries}
              options={[
                { label: "50", value: 50 as const },
                { label: "100", value: 100 as const },
                { label: "200", value: 200 as const },
              ]}
              onChange={(v) =>
                update("maxLogEntries", v as DashboardSettings["maxLogEntries"])
              }
            />
          </Row>
        </Section>

        {/* Alerts */}
        <Section icon={Bell} title="Alerts">
          <Row
            label="Minimum severity"
            description="Hide alerts below the selected severity level."
          >
            <SegmentedControl
              value={settings.alertMinSeverity}
              options={[
                { label: "Info", value: "info" as const },
                { label: "Warning", value: "warning" as const },
                { label: "Critical", value: "critical" as const },
              ]}
              onChange={(v) =>
                update(
                  "alertMinSeverity",
                  v as DashboardSettings["alertMinSeverity"],
                )
              }
            />
          </Row>
          <Row
            label="Toast notifications"
            description="Show a pop-up toast when a new alert is triggered."
          >
            <Toggle
              checked={settings.toastNotifications}
              onChange={(v) => update("toastNotifications", v)}
            />
          </Row>
        </Section>

        {/* API */}
        <Section icon={Server} title="API">
          <Row
            label="Endpoint"
            description="Base URL used by the dashboard to fetch data."
          >
            <ReadonlyField value={apiUrl} />
          </Row>
          <Row label="WebSocket" description="Real-time event stream endpoint.">
            <ReadonlyField value={apiUrl.replace(/^http/, "ws") + "/ws"} />
          </Row>
        </Section>
      </div>
    </Shell>
  );
}
