"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Shell } from "../../components/layout/shell";
import { useServices, useServicesCacheUpdater } from "../../hooks/use-services";
import { useMetrics, useMetricsCacheUpdater } from "../../hooks/use-metrics";
import { useWebSocket } from "../../hooks/use-websocket";
import { ChartSkeleton } from "../../components/charts/chart-skeleton";
import { Skeleton } from "../../components/ui/skeleton";

const LatencyChart = dynamic(
  () =>
    import("../../components/charts/latency-chart").then(
      (m) => m.LatencyChart,
    ),
  { ssr: false, loading: () => <ChartSkeleton height={200} title="Latency" /> },
);

const ErrorRateChart = dynamic(
  () =>
    import("../../components/charts/error-rate-chart").then(
      (m) => m.ErrorRateChart,
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={200} title="Error Rate" />,
  },
);

const VolumeChart = dynamic(
  () =>
    import("../../components/charts/volume-chart").then((m) => m.VolumeChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={200} title="Request Volume" />,
  },
);

const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001")
    : "ws://localhost:3001";

function MetricsContent() {
  const { lastEvent } = useWebSocket(`${WS_URL}/ws/events`);
  const { data: services, isLoading: servicesLoading } = useServices();
  useServicesCacheUpdater(lastEvent);

  const [selectedId, setSelectedId] = useState<string>("");
  const activeId = selectedId || services?.[0]?.serviceId || "";

  useMetricsCacheUpdater(activeId, lastEvent);
  const { data: metricsData, isLoading: metricsLoading } = useMetrics(activeId);
  const currentService = services?.find((s) => s.serviceId === activeId);
  const points = metricsData?.points ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={pageTitleStyle}>Metrics</h1>
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--fg-muted)",
              marginTop: "0.125rem",
            }}
          >
            Historical time-series data per service
          </p>
        </div>

        {/* Service selector */}
        {servicesLoading ? (
          <Skeleton width={200} height={36} />
        ) : (
          <select
            value={activeId}
            onChange={(e) => setSelectedId(e.target.value)}
            aria-label="Select service"
            style={selectStyle}
          >
            {services?.map((s) => (
              <option key={s.serviceId} value={s.serviceId}>
                {s.serviceName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Current metrics summary */}
      {currentService && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {[
            { label: "Avg latency", value: `${Math.round(currentService.avgLatency)}ms` },
            { label: "p95", value: `${Math.round(currentService.p95Latency)}ms` },
            { label: "p99", value: `${Math.round(currentService.p99Latency)}ms` },
            { label: "Error rate", value: `${(currentService.errorRate * 100).toFixed(2)}%` },
            { label: "RPM", value: currentService.requestsPerMinute.toLocaleString() },
            { label: "Uptime", value: `${(currentService.uptime * 100).toFixed(2)}%` },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                padding: "0.75rem 1rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.6875rem",
                  color: "var(--fg-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--fg)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "1rem",
        }}
      >
        <LatencyChart
          points={points}
          currentMetrics={currentService}
          isLoading={metricsLoading}
        />
        <ErrorRateChart points={points} isLoading={metricsLoading} />
        <VolumeChart points={points} isLoading={metricsLoading} />
      </div>
    </div>
  );
}

export default function MetricsPage() {
  return (
    <Shell>
      <MetricsContent />
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
  fontSize: "0.8125rem",
  padding: "0.5rem 0.75rem",
  cursor: "pointer",
  outline: "none",
  minWidth: 200,
};
