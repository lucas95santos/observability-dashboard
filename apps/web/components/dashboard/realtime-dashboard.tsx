"use client";

import { useWebSocket } from "../../hooks/use-websocket";
import { useServices, useServicesCacheUpdater } from "../../hooks/use-services";
import { useAlerts, useAlertsCacheUpdater } from "../../hooks/use-alerts";
import type { ServiceMetrics } from "@repo/types";
import { ServiceStatusGrid } from "./service-status-grid";
import { RealtimeEventFeed } from "./realtime-event-feed";

const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001")
    : "ws://localhost:3001";

interface RealtimeDashboardProps {
  initialServices?: ServiceMetrics[];
}

export function RealtimeDashboard({ initialServices }: RealtimeDashboardProps) {
  const { events, lastEvent, status } = useWebSocket(`${WS_URL}/ws/events`);

  const { data: services, isLoading } = useServices({ initialData: initialServices });
  useServicesCacheUpdater(lastEvent);
  useAlerts();
  useAlertsCacheUpdater(lastEvent);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page heading */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--fg)",
              letterSpacing: "-0.01em",
            }}
          >
            Overview
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", marginTop: "0.125rem" }}>
            Live service health and metrics
          </p>
        </div>
        <WsStatusBadge status={status} />
      </div>

      {/* Services grid */}
      <ServiceStatusGrid
        services={services}
        isLoading={isLoading}
        recentEvents={events}
      />

      {/* Event feed */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--fg)",
          }}
        >
          Event stream
        </h2>
        <div style={{ height: 320 }}>
          <RealtimeEventFeed events={events} />
        </div>
      </div>
    </div>
  );
}

function WsStatusBadge({ status }: { status: "connecting" | "open" | "closed" }) {
  const color =
    status === "open"
      ? "#34d399"
      : status === "connecting"
        ? "#fbbf24"
        : "#f87171";
  const label =
    status === "open" ? "Live" : status === "connecting" ? "Connecting…" : "Disconnected";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.25rem 0.625rem",
        borderRadius: "999px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        fontSize: "0.75rem",
        color,
      }}
    >
      <span
        style={{
          width: "0.4rem",
          height: "0.4rem",
          borderRadius: "50%",
          background: color,
          display: "inline-block",
          animation: status === "open" ? "pulse 2s ease-in-out infinite" : undefined,
        }}
      />
      {label}
    </div>
  );
}
