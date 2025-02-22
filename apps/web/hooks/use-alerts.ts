"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Alert, RealtimeEvent } from "@repo/types";
import { getAlerts } from "../lib/api";

export function useAlerts(opts: { initialData?: Alert[] } = {}) {
  return useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: () => getAlerts(),
    refetchInterval: 10_000,
    staleTime: 10_000,
    initialData: opts.initialData,
  });
}

const SEVERITY_STYLE: Record<string, string> = {
  critical: "#f87171",
  warning: "#fbbf24",
  info: "#38bdf8",
};

export function useAlertsCacheUpdater(lastEvent: RealtimeEvent | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "alert_triggered") {
      const alert: Alert = lastEvent.data;
      queryClient.setQueryData<Alert[]>(["alerts"], (prev) =>
        prev ? [alert, ...prev] : [alert],
      );
      toast(`Alert: ${alert.serviceName}`, {
        description: alert.message,
        style: { borderLeft: `4px solid ${SEVERITY_STYLE[alert.severity] ?? "#8b949e"}` },
      });
    }

    if (lastEvent.type === "alert_resolved") {
      const resolved: Alert = lastEvent.data;
      queryClient.setQueryData<Alert[]>(["alerts"], (prev) => {
        if (!prev) return prev;
        return prev.map((a) => (a.id === resolved.id ? resolved : a));
      });
      toast(`Resolved: ${resolved.serviceName}`, {
        description: resolved.message,
        style: { borderLeft: "4px solid #34d399" },
      });
    }
  }, [lastEvent, queryClient]);
}
