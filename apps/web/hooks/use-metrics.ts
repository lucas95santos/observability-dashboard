"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { TimeSeriesPoint, RealtimeEvent } from "@repo/types";
import { getMetrics } from "../lib/api";

interface MetricsData {
  serviceId: string;
  points: TimeSeriesPoint[];
}

export function useMetrics(
  serviceId: string,
  opts: { initialData?: MetricsData } = {},
) {
  return useQuery<MetricsData>({
    queryKey: ["metrics", serviceId],
    queryFn: () => getMetrics(serviceId),
    staleTime: 30_000,
    initialData: opts.initialData,
  });
}

export function useMetricsCacheUpdater(
  serviceId: string,
  lastEvent: RealtimeEvent | null,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.type !== "metrics_update") return;
    if (lastEvent.serviceId !== serviceId) return;

    const m = lastEvent.data;
    const newPoint: TimeSeriesPoint = {
      timestamp: m.lastUpdated,
      latency: m.avgLatency,
      errorRate: m.errorRate,
      requestsPerMinute: m.requestsPerMinute,
    };

    queryClient.setQueryData<MetricsData>(["metrics", serviceId], (prev) => {
      if (!prev) return prev;
      const points = [...prev.points, newPoint].slice(-60);
      return { ...prev, points };
    });
  }, [lastEvent, serviceId, queryClient]);
}
