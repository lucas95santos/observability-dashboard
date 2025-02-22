"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LogEntry, RealtimeEvent } from "@repo/types";
import { getLogs, type LogsFilter } from "../lib/api";

const MAX_LOGS = 200;

export function useLogs(filter: LogsFilter = {}) {
  return useQuery<LogEntry[]>({
    queryKey: ["logs", filter],
    queryFn: () => getLogs({ limit: 100, ...filter }),
    staleTime: 10_000,
  });
}

export function useLogsCacheUpdater(
  filter: LogsFilter,
  lastEvent: RealtimeEvent | null,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!lastEvent || lastEvent.type !== "log_entry") return;

    const entry: LogEntry = lastEvent.data;

    if (filter.serviceId && entry.serviceId !== filter.serviceId) return;
    if (filter.level && entry.level !== filter.level) return;

    queryClient.setQueryData<LogEntry[]>(["logs", filter], (prev) => {
      const next = [entry, ...(prev ?? [])];
      return next.length > MAX_LOGS ? next.slice(0, MAX_LOGS) : next;
    });
  }, [lastEvent, filter, queryClient]);
}
