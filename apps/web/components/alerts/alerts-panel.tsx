"use client";

import { useState } from "react";
import type { Alert, AlertSeverity } from "@repo/types";
import { useAlerts, useAlertsCacheUpdater } from "../../hooks/use-alerts";
import { useWebSocket } from "../../hooks/use-websocket";
import { Skeleton } from "../ui/skeleton";

const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001")
    : "ws://localhost:3001";

interface AlertsPanelProps {
  initialAlerts?: Alert[];
}

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  critical: "#f87171",
  warning: "#fbbf24",
  info: "#38bdf8",
};

const SEVERITY_BG: Record<AlertSeverity, string> = {
  critical: "rgba(248, 113, 113, 0.08)",
  warning: "rgba(251, 191, 36, 0.08)",
  info: "rgba(56, 189, 248, 0.08)",
};

type TabFilter = "all" | "active" | "resolved";

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AlertsPanel({ initialAlerts }: AlertsPanelProps) {
  const { lastEvent } = useWebSocket(`${WS_URL}/ws/events`);
  useAlertsCacheUpdater(lastEvent);

  const { data: alerts, isLoading } = useAlerts({ initialData: initialAlerts });
  const [tab, setTab] = useState<TabFilter>("all");

  const filtered =
    alerts?.filter((a) => {
      if (tab === "active") return a.active;
      if (tab === "resolved") return !a.active;
      return true;
    }) ?? [];

  const activeCount = alerts?.filter((a) => a.active).length ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div>
        <h1 style={pageTitleStyle}>Alerts</h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", marginTop: "0.125rem" }}>
          {activeCount > 0
            ? `${activeCount} active alert${activeCount > 1 ? "s" : ""}`
            : "All systems nominal"}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0" }}>
        {(["all", "active", "resolved"] as TabFilter[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8125rem",
              fontWeight: tab === t ? 500 : 400,
              color: tab === t ? "var(--fg)" : "var(--fg-muted)",
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: "-1px",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={72} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--fg-muted)", fontSize: "0.875rem" }}>
          No alerts to show.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const color = SEVERITY_COLOR[alert.severity];
  const bg = SEVERITY_BG[alert.severity];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.875rem 1rem",
        background: alert.active ? bg : "var(--bg-surface)",
        border: `1px solid ${alert.active ? color : "var(--border)"}`,
        borderRadius: "0.5rem",
        animation: alert.active ? "pulse 2s ease-in-out infinite" : undefined,
      }}
    >
      {/* Severity badge */}
      <span
        style={{
          flexShrink: 0,
          padding: "0.125rem 0.5rem",
          borderRadius: "999px",
          fontSize: "0.6875rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color,
          background: bg,
          border: `1px solid ${color}`,
          marginTop: "0.125rem",
        }}
      >
        {alert.severity}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--fg)" }}>
            {alert.serviceName}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
            {timeAgo(alert.triggeredAt)}
          </span>
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", marginTop: "0.125rem" }}>
          {alert.message}
        </p>
        {alert.resolvedAt && (
          <p style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "0.25rem" }}>
            Resolved {timeAgo(alert.resolvedAt)}
          </p>
        )}
      </div>

      {/* Status dot */}
      <span
        style={{
          flexShrink: 0,
          width: "0.5rem",
          height: "0.5rem",
          borderRadius: "50%",
          background: alert.active ? color : "#34d399",
          marginTop: "0.3rem",
        }}
      />
    </div>
  );
}

const pageTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "1.125rem",
  fontWeight: 600,
  color: "var(--fg)",
  letterSpacing: "-0.01em",
};
