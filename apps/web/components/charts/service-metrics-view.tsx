"use client";

import dynamic from "next/dynamic";
import type { TimeSeriesPoint, ServiceMetrics, RealtimeEvent } from "@repo/types";
import { useWebSocket } from "../../hooks/use-websocket";
import { useMetrics, useMetricsCacheUpdater } from "../../hooks/use-metrics";
import { useServices, useServicesCacheUpdater } from "../../hooks/use-services";
import { ChartSkeleton } from "./chart-skeleton";
import { Skeleton } from "../ui/skeleton";

const LatencyChart = dynamic(
  () => import("./latency-chart").then((m) => m.LatencyChart),
  { ssr: false, loading: () => <ChartSkeleton height={200} title="Latency" /> },
);

const ErrorRateChart = dynamic(
  () => import("./error-rate-chart").then((m) => m.ErrorRateChart),
  { ssr: false, loading: () => <ChartSkeleton height={200} title="Error Rate" /> },
);

const VolumeChart = dynamic(
  () => import("./volume-chart").then((m) => m.VolumeChart),
  { ssr: false, loading: () => <ChartSkeleton height={200} title="Request Volume" /> },
);

const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001")
    : "ws://localhost:3001";

interface ServiceMetricsViewProps {
  serviceId: string;
  initialPoints?: TimeSeriesPoint[];
}

export function ServiceMetricsView({
  serviceId,
  initialPoints,
}: ServiceMetricsViewProps) {
  const { lastEvent } = useWebSocket(`${WS_URL}/ws/events`);
  useMetricsCacheUpdater(serviceId, lastEvent);
  useServicesCacheUpdater(lastEvent);

  const { data: metricsData, isLoading: metricsLoading } = useMetrics(
    serviceId,
    { initialData: initialPoints ? { serviceId, points: initialPoints } : undefined },
  );

  const { data: services } = useServices();
  const currentService = services?.find((s) => s.serviceId === serviceId);

  const points = metricsData?.points ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <ServiceHeader serviceId={serviceId} service={currentService} lastEvent={lastEvent} />

      {/* Charts grid */}
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

function ServiceHeader({
  serviceId,
  service,
  lastEvent,
}: {
  serviceId: string;
  service?: ServiceMetrics;
  lastEvent: RealtimeEvent | null;
}) {
  void lastEvent;
  const statusColor =
    !service
      ? "var(--fg-muted)"
      : service.status === "healthy"
        ? "#34d399"
        : service.status === "degraded"
          ? "#fbbf24"
          : "#f87171";

  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
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
          {service?.serviceName ?? serviceId}
        </h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", marginTop: "0.125rem" }}>
          Historical metrics · last 60 minutes
        </p>
      </div>

      {service ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, auto)",
            gap: "1.5rem",
            padding: "0.75rem 1rem",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
          }}
        >
          <StatBox label="Status" value={service.status} color={statusColor} />
          <StatBox label="Avg latency" value={`${Math.round(service.avgLatency)}ms`} />
          <StatBox label="Error rate" value={`${(service.errorRate * 100).toFixed(2)}%`} />
          <StatBox label="RPM" value={service.requestsPerMinute.toLocaleString()} />
        </div>
      ) : (
        <Skeleton width={360} height={64} />
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
      <span style={{ fontSize: "0.6875rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: color ?? "var(--fg)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
