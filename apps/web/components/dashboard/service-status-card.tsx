"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { ServiceMetrics, RealtimeEvent } from "@repo/types";
import { ServiceStatus } from "@repo/types";

interface ServiceStatusCardProps {
  service: ServiceMetrics;
  recentEvents: RealtimeEvent[];
}

const STATUS_COLOR: Record<ServiceStatus, string> = {
  [ServiceStatus.HEALTHY]: "#34d399",
  [ServiceStatus.DEGRADED]: "#fbbf24",
  [ServiceStatus.DOWN]: "#f87171",
};

const STATUS_LABEL: Record<ServiceStatus, string> = {
  [ServiceStatus.HEALTHY]: "Healthy",
  [ServiceStatus.DEGRADED]: "Degraded",
  [ServiceStatus.DOWN]: "Down",
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
      <span style={{ fontSize: "0.6875rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--fg)", fontFamily: "var(--font-mono)" }}>
        {value}
      </span>
    </div>
  );
}

export const ServiceStatusCard = memo(function ServiceStatusCard({
  service,
  recentEvents,
}: ServiceStatusCardProps) {
  const statusColor = STATUS_COLOR[service.status];

  const sparklineData = useMemo(() => {
    const updates = recentEvents
      .filter(
        (e) =>
          e.type === "metrics_update" && e.serviceId === service.serviceId,
      )
      .slice(-20)
      .map((e) => ({ v: (e as { data: ServiceMetrics }).data.avgLatency }));

    if (updates.length < 2) {
      return Array.from({ length: 20 }, (_, i) => ({
        v: service.avgLatency + (Math.random() - 0.5) * 10,
        i,
      }));
    }
    return updates;
  }, [recentEvents, service]);

  return (
    <Link
      href={`/services/${service.serviceId}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "0.5rem",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
          cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)";
          (e.currentTarget as HTMLDivElement).style.background = "var(--bg-elevated)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLDivElement).style.background = "var(--bg-surface)";
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--fg)" }}>
            {service.serviceName}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <span
              style={{
                width: "0.5rem",
                height: "0.5rem",
                borderRadius: "50%",
                background: statusColor,
                display: "inline-block",
                animation: service.status !== ServiceStatus.HEALTHY ? "pulse 1.5s ease-in-out infinite" : undefined,
                boxShadow: `0 0 6px ${statusColor}`,
              }}
            />
            <span style={{ fontSize: "0.75rem", color: statusColor, fontWeight: 500 }}>
              {STATUS_LABEL[service.status]}
            </span>
          </div>
        </div>

        {/* Metrics row */}
        <div style={{ display: "flex", gap: "1rem" }}>
          <Metric label="Latency" value={`${Math.round(service.avgLatency)}ms`} />
          <Metric label="Errors" value={`${(service.errorRate * 100).toFixed(1)}%`} />
          <Metric label="RPM" value={service.requestsPerMinute.toLocaleString()} />
        </div>

        {/* Sparkline */}
        <div style={{ height: 40, marginTop: "0.25rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`grad-${service.serviceId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={statusColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={statusColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={statusColor}
                strokeWidth={1.5}
                fill={`url(#grad-${service.serviceId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Uptime footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.6875rem", color: "var(--fg-muted)" }}>
            Uptime: {(service.uptime * 100).toFixed(2)}%
          </span>
          <span style={{ fontSize: "0.6875rem", color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
            p95: {Math.round(service.p95Latency)}ms · p99: {Math.round(service.p99Latency)}ms
          </span>
        </div>
      </div>
    </Link>
  );
});
