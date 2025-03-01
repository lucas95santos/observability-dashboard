"use client";

import { useState } from "react";
import { Shell } from "../../components/layout/shell";
import { RealtimeEventFeed } from "../../components/dashboard/realtime-event-feed";
import { useWebSocket } from "../../hooks/use-websocket";
import { useLogs, useLogsCacheUpdater } from "../../hooks/use-logs";
import type { LogLevel } from "@repo/types";

const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001")
    : "ws://localhost:3001";

const LOG_LEVELS: LogLevel[] = ["error", "warn", "info", "debug"];

const LEVEL_COLOR: Record<LogLevel, string> = {
  error: "#f87171",
  warn: "#fbbf24",
  info: "#38bdf8",
  debug: "var(--fg-muted)",
};

function LogsContent() {
  const [serviceFilter, setServiceFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "">("");

  const filter = {
    serviceId: serviceFilter || undefined,
    level: (levelFilter || undefined) as LogLevel | undefined,
  };

  const { events, lastEvent } = useWebSocket(`${WS_URL}/ws/events`);
  const { data: logs, isLoading } = useLogs(filter);
  useLogsCacheUpdater(filter, lastEvent);

  const services = Array.from(
    new Set(events.filter((e) => e.type === "log_entry").map((e) => e.serviceId)),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", height: "calc(100vh - 8rem)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={pageTitleStyle}>Logs</h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", marginTop: "0.125rem" }}>
            Live log stream from all services
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            aria-label="Filter by service"
            style={selectStyle}
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LogLevel | "")}
            aria-label="Filter by log level"
            style={selectStyle}
          >
            <option value="">All levels</option>
            {LOG_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Log level summary */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {LOG_LEVELS.map((level) => {
          const count = logs?.filter((l) => l.level === level).length ?? 0;
          return (
            <button
              key={level}
              onClick={() =>
                setLevelFilter((prev) => (prev === level ? "" : level))
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.25rem 0.625rem",
                borderRadius: "999px",
                background:
                  levelFilter === level
                    ? "var(--bg-elevated)"
                    : "transparent",
                border: `1px solid ${levelFilter === level ? LEVEL_COLOR[level] : "var(--border)"}`,
                cursor: "pointer",
                fontSize: "0.75rem",
                color: LEVEL_COLOR[level],
                fontFamily: "var(--font-mono)",
              }}
            >
              <span
                style={{
                  width: "0.375rem",
                  height: "0.375rem",
                  borderRadius: "50%",
                  background: LEVEL_COLOR[level],
                  display: "inline-block",
                }}
              />
              {level}
              <span
                style={{
                  color: "var(--fg-muted)",
                  fontSize: "0.6875rem",
                  marginLeft: "0.125rem",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Virtualized feed */}
      {isLoading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "0.875rem", color: "var(--fg-muted)" }}>Loading logs…</span>
        </div>
      ) : (
        <div style={{ flex: 1 }}>
          <RealtimeEventFeed
            events={events.filter(
              (e) =>
                e.type === "log_entry" &&
                (!serviceFilter || e.serviceId === serviceFilter) &&
                (!levelFilter || e.data.level === levelFilter),
            )}
            serviceFilter={serviceFilter}
            typeFilter="log_entry"
          />
        </div>
      )}
    </div>
  );
}

export default function LogsPage() {
  return (
    <Shell>
      <LogsContent />
    </Shell>
  );
}

const pageTitleStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "1.125rem",
  fontWeight: 600,
  color: "var(--fg)",
  letterSpacing: "-0.01em",
};

const selectStyle: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "0.375rem",
  color: "var(--fg)",
  fontSize: "0.75rem",
  padding: "0.375rem 0.5rem",
  cursor: "pointer",
  outline: "none",
};
