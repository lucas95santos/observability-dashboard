"use client";

import { memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TimeSeriesPoint, ServiceMetrics } from "@repo/types";
import { ChartSkeleton } from "./chart-skeleton";

interface LatencyChartProps {
  points: TimeSeriesPoint[];
  currentMetrics?: ServiceMetrics;
  isLoading?: boolean;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "0.375rem",
        padding: "0.5rem 0.75rem",
        fontSize: "0.75rem",
        fontFamily: "var(--font-mono)",
        color: "var(--fg)",
      }}
    >
      <p style={{ color: "var(--fg-muted)", marginBottom: "0.25rem" }}>{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {Math.round(entry.value)}ms
        </p>
      ))}
    </div>
  );
}

export const LatencyChart = memo(function LatencyChart({
  points,
  currentMetrics,
  isLoading,
}: LatencyChartProps) {
  if (isLoading) return <ChartSkeleton height={200} title="Latency" />;

  if (points.length === 0) {
    return (
      <div style={emptyStyle}>No latency data available.</div>
    );
  }

  const data = points.map((p) => ({
    time: formatTime(p.timestamp),
    avg: p.latency,
  }));

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Latency</span>
        {currentMetrics && (
          <div style={{ display: "flex", gap: "1rem" }}>
            <Stat label="avg" value={`${Math.round(currentMetrics.avgLatency)}ms`} color="var(--chart-1)" />
            <Stat label="p95" value={`${Math.round(currentMetrics.p95Latency)}ms`} color="var(--chart-3)" />
            <Stat label="p99" value={`${Math.round(currentMetrics.p99Latency)}ms`} color="var(--chart-4)" />
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200} minWidth={0}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}ms`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={500}
            stroke="var(--chart-4)"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{ value: "500ms", position: "right", fontSize: 10, fill: "var(--chart-4)" }}
          />
          {currentMetrics && (
            <>
              <ReferenceLine
                y={currentMetrics.p95Latency}
                stroke="var(--chart-3)"
                strokeDasharray="2 4"
                strokeWidth={1}
                label={{ value: "p95", position: "right", fontSize: 10, fill: "var(--chart-3)" }}
              />
              <ReferenceLine
                y={currentMetrics.p99Latency}
                stroke="var(--chart-5)"
                strokeDasharray="2 4"
                strokeWidth={1}
                label={{ value: "p99", position: "right", fontSize: 10, fill: "var(--chart-5)" }}
              />
            </>
          )}
          <Line
            type="monotone"
            dataKey="avg"
            name="Avg Latency"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            animationDuration={400}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }}>
      <span style={{ color: "var(--fg-muted)" }}>{label}:</span>
      <span style={{ color, fontFamily: "var(--font-mono)" }}>{value}</span>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  padding: "1rem",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.75rem",
};

const titleStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  fontWeight: 500,
  color: "var(--fg)",
};

const emptyStyle: React.CSSProperties = {
  ...containerStyle,
  padding: "3rem",
  textAlign: "center",
  color: "var(--fg-muted)",
  fontSize: "0.875rem",
};
