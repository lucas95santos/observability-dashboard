"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { RealtimeEvent, LogLevel } from "@repo/types";

interface RealtimeEventFeedProps {
  events: RealtimeEvent[];
  serviceFilter?: string;
  typeFilter?: string;
}

const EVENT_TYPE_COLOR: Record<string, string> = {
  metrics_update: "var(--fg-muted)",
  alert_triggered: "#f87171",
  alert_resolved: "#34d399",
  service_degraded: "#fbbf24",
  service_recovered: "#34d399",
  log_entry: "var(--accent)",
};

const LOG_LEVEL_COLOR: Record<LogLevel, string> = {
  error: "#f87171",
  warn: "#fbbf24",
  info: "var(--accent)",
  debug: "var(--fg-muted)",
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function getEventMessage(event: RealtimeEvent): string {
  switch (event.type) {
    case "metrics_update":
      return `latency=${Math.round(event.data.avgLatency)}ms err=${(event.data.errorRate * 100).toFixed(1)}% rpm=${event.data.requestsPerMinute}`;
    case "alert_triggered":
      return `[${event.data.severity.toUpperCase()}] ${event.data.message}`;
    case "alert_resolved":
      return `Resolved: ${event.data.message}`;
    case "service_degraded":
      return `Service degraded — latency=${Math.round(event.data.avgLatency)}ms`;
    case "service_recovered":
      return `Service recovered — ${event.data.status}`;
    case "log_entry":
      return event.data.message;
  }
}

const MAX_DISPLAY = 200;

export function RealtimeEventFeed({
  events,
  serviceFilter,
  typeFilter,
}: RealtimeEventFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [services, setServices] = useState<string[]>([]);
  const [localServiceFilter, setLocalServiceFilter] = useState(
    serviceFilter ?? "",
  );
  const [localTypeFilter, setLocalTypeFilter] = useState(typeFilter ?? "");

  useEffect(() => {
    const seen = new Set<string>();
    for (const e of events) seen.add(e.serviceId);
    setServices(Array.from(seen));
  }, [events]);

  const filtered = useMemo(() => {
    let result = events;
    if (localServiceFilter)
      result = result.filter((e) => e.serviceId === localServiceFilter);
    if (localTypeFilter)
      result = result.filter((e) => e.type === localTypeFilter);
    return result.slice(-MAX_DISPLAY).reverse();
  }, [events, localServiceFilter, localTypeFilter]);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  useEffect(() => {
    if (!parentRef.current) return;
    const el = parentRef.current;
    const onScroll = () => {
      isAtBottomRef.current =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 32;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current && parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [filtered.length]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        height: "100%",
      }}
    >
      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <select
          value={localServiceFilter}
          onChange={(e) => setLocalServiceFilter(e.target.value)}
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
          value={localTypeFilter}
          onChange={(e) => setLocalTypeFilter(e.target.value)}
          aria-label="Filter by event type"
          style={selectStyle}
        >
          <option value="">All types</option>
          <option value="metrics_update">metrics_update</option>
          <option value="alert_triggered">alert_triggered</option>
          <option value="alert_resolved">alert_resolved</option>
          <option value="service_degraded">service_degraded</option>
          <option value="service_recovered">service_recovered</option>
          <option value="log_entry">log_entry</option>
        </select>

        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.75rem",
            color: "var(--fg-muted)",
            alignSelf: "center",
          }}
        >
          {filtered.length} events
        </span>
      </div>

      {/* Virtual list */}
      <div
        ref={parentRef}
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid var(--border)",
          borderRadius: "0.5rem",
          background: "var(--bg-surface)",
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--fg-muted)",
              fontSize: "0.8125rem",
            }}
          >
            No events yet…
          </div>
        ) : (
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const event = filtered[virtualRow.index]!;
              const typeColor = EVENT_TYPE_COLOR[event.type] ?? "var(--fg-muted)";
              const logLevel =
                event.type === "log_entry" ? event.data.level : undefined;
              const levelColor = logLevel
                ? LOG_LEVEL_COLOR[logLevel]
                : typeColor;

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    padding: "0 0.75rem",
                    borderBottom: "1px solid var(--border)",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <span style={{ color: "var(--fg-muted)", flexShrink: 0, width: "7rem" }}>
                    {formatTime(event.timestamp)}
                  </span>
                  <span
                    style={{
                      color: levelColor,
                      flexShrink: 0,
                      width: "9rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {logLevel ? `[${logLevel.toUpperCase()}]` : event.type}
                  </span>
                  <span style={{ color: "var(--accent)", flexShrink: 0, width: "9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {event.serviceId}
                  </span>
                  <span
                    style={{
                      color: "var(--fg)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getEventMessage(event)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

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
