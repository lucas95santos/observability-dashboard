"use client";

import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { TimeSeriesPoint } from "@repo/types";
import { ChartSkeleton } from "./chart-skeleton";

interface VolumeChartProps {
  points: TimeSeriesPoint[];
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
          {entry.name}: {Math.round(entry.value)} rpm
        </p>
      ))}
    </div>
  );
}

export const VolumeChart = memo(function VolumeChart({
  points,
  isLoading,
}: VolumeChartProps) {
  if (isLoading) return <ChartSkeleton height={200} title="Request Volume" />;

  if (points.length === 0) {
    return <div style={emptyStyle}>No volume data available.</div>;
  }

  const data = points.map((p) => {
    const errors = Math.round(p.requestsPerMinute * p.errorRate);
    const success = Math.max(0, p.requestsPerMinute - errors);
    return {
      time: formatTime(p.timestamp),
      success,
      errors,
    };
  });

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Request Volume</span>
      </div>
      <ResponsiveContainer width="100%" height={200} minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barSize={8}>
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
            tickFormatter={(v: number) => `${v}`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}
            iconSize={8}
          />
          <Bar
            dataKey="success"
            name="Success"
            stackId="a"
            fill="#34d399"
            radius={[0, 0, 0, 0]}
            animationDuration={400}
          />
          <Bar
            dataKey="errors"
            name="Errors"
            stackId="a"
            fill="#f87171"
            radius={[2, 2, 0, 0]}
            animationDuration={400}
          />
        </BarChart>
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
