import type {
  ServiceMetrics,
  TimeSeriesPoint,
  Alert,
  LogEntry,
  LogLevel,
} from "@repo/types";

const DEFAULT_BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : (process.env.API_URL ?? "http://localhost:3001");

async function request<T>(
  path: string,
  baseUrl: string = DEFAULT_BASE_URL,
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export function getServices(baseUrl?: string): Promise<ServiceMetrics[]> {
  return request<ServiceMetrics[]>("/api/services", baseUrl);
}

export function getMetrics(
  serviceId: string,
  from?: Date,
  to?: Date,
  baseUrl?: string,
): Promise<{ serviceId: string; points: TimeSeriesPoint[] }> {
  const params = new URLSearchParams({ service: serviceId });
  if (from) params.set("from", from.toISOString());
  if (to) params.set("to", to.toISOString());
  return request(`/api/metrics?${params}`, baseUrl);
}

export function getAlerts(
  activeOnly?: boolean,
  baseUrl?: string,
): Promise<Alert[]> {
  const params = activeOnly ? "?active=true" : "";
  return request<Alert[]>(`/api/alerts${params}`, baseUrl);
}

export interface LogsFilter {
  serviceId?: string;
  level?: LogLevel;
  limit?: number;
}

export function getLogs(
  filter: LogsFilter = {},
  baseUrl?: string,
): Promise<LogEntry[]> {
  const params = new URLSearchParams();
  if (filter.serviceId) params.set("service", filter.serviceId);
  if (filter.level) params.set("level", filter.level);
  if (filter.limit != null) params.set("limit", String(filter.limit));
  const qs = params.toString();
  return request<LogEntry[]>(`/api/logs${qs ? `?${qs}` : ""}`, baseUrl);
}
