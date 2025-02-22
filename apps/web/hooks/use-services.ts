"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ServiceMetrics, RealtimeEvent } from "@repo/types";
import { getServices } from "../lib/api";

export function useServices(opts: { initialData?: ServiceMetrics[] } = {}) {
  return useQuery<ServiceMetrics[]>({
    queryKey: ["services"],
    queryFn: () => getServices(),
    staleTime: 30_000,
    initialData: opts.initialData,
  });
}

export function useServicesCacheUpdater(lastEvent: RealtimeEvent | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!lastEvent) return;
    if (
      lastEvent.type !== "metrics_update" &&
      lastEvent.type !== "service_degraded" &&
      lastEvent.type !== "service_recovered"
    )
      return;

    const updated: ServiceMetrics = lastEvent.data;
    queryClient.setQueryData<ServiceMetrics[]>(["services"], (prev) => {
      if (!prev) return prev;
      return prev.map((s) =>
        s.serviceId === updated.serviceId ? updated : s,
      );
    });
  }, [lastEvent, queryClient]);
}
