"use client";

import { memo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TimeSeriesPoint } from "@repo/types";
import { ChartSkeleton } from "./chart-skeleton";

interface ErrorRateChartProps {
  points: TimeSeriesPoint[];
  isLoading?: boolean;
}

function getErrorColor(latestRate: number) {
  if (latestRate >= 0.05) return "#f87171";
  if (latestRate >= 0.01) return "#fbbf24";
  return "#34d399";
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
          {entry.name}: {(entry.value * 100).toFixed(2)}%
        </p>
      ))}
    </div>
  );
}

export const ErrorRateChart = memo(function ErrorRateChart({
  points,
  isLoading,
}: ErrorRateChartProps) {
  if (isLoading) return <ChartSkeleton height={200} title="Error Rate" />;

  if (points.length === 0) {
    return <div style={emptyStyle}>No error rate data available.</div>;
  }

  const data = points.map((p) => ({
    time: formatTime(p.timestamp),
    rate: p.errorRate,
  }));

  const latest = data[data.length - 1]?.rate ?? 0;
  const color = getErrorColor(latest);
  const gradientId = "error-rate-gradient";

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Error Rate</span>
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color,
            fontFamily: "var(--font-mono)",
          }}
        >
          {(latest * 100).toFixed(2)}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200} minWidth={0}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="rate"
            name="Error Rate"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

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
