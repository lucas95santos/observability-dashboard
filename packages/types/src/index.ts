export enum ServiceStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  DOWN = 'down',
}

export interface ServiceMetrics {
  serviceId: string;
  serviceName: string;
  status: ServiceStatus;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  requestsPerMinute: number;
  uptime: number;
  lastUpdated: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  latency: number;
  errorRate: number;
  requestsPerMinute: number;
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  serviceId: string;
  serviceName: string;
  severity: AlertSeverity;
  message: string;
  triggeredAt: string;
  resolvedAt?: string;
  active: boolean;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  serviceId: string;
  serviceName: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}

// Discriminated union for WebSocket events
export interface MetricsUpdateEvent {
  id: string;
  type: 'metrics_update';
  timestamp: string;
  serviceId: string;
  data: ServiceMetrics;
}

export interface AlertTriggeredEvent {
  id: string;
  type: 'alert_triggered';
  timestamp: string;
  serviceId: string;
  data: Alert;
}

export interface AlertResolvedEvent {
  id: string;
  type: 'alert_resolved';
  timestamp: string;
  serviceId: string;
  data: Alert;
}

export interface ServiceDegradedEvent {
  id: string;
  type: 'service_degraded';
  timestamp: string;
  serviceId: string;
  data: ServiceMetrics;
}

export interface ServiceRecoveredEvent {
  id: string;
  type: 'service_recovered';
  timestamp: string;
  serviceId: string;
  data: ServiceMetrics;
}

export interface LogEntryEvent {
  id: string;
  type: 'log_entry';
  timestamp: string;
  serviceId: string;
  data: LogEntry;
}

export type RealtimeEvent =
  | MetricsUpdateEvent
  | AlertTriggeredEvent
  | AlertResolvedEvent
  | ServiceDegradedEvent
  | ServiceRecoveredEvent
  | LogEntryEvent;

export type RealtimeEventType = RealtimeEvent['type'];
