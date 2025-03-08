export const ServiceMetricsSchema = {
  $id: "ServiceMetrics",
  type: "object",
  required: [
    "serviceId",
    "serviceName",
    "status",
    "avgLatency",
    "p95Latency",
    "p99Latency",
    "errorRate",
    "requestsPerMinute",
    "uptime",
    "lastUpdated",
  ],
  properties: {
    serviceId:         { type: "string" },
    serviceName:       { type: "string" },
    status:            { type: "string", enum: ["healthy", "degraded", "down"] },
    avgLatency:        { type: "number" },
    p95Latency:        { type: "number" },
    p99Latency:        { type: "number" },
    errorRate:         { type: "number" },
    requestsPerMinute: { type: "number" },
    uptime:            { type: "number" },
    lastUpdated:       { type: "string", format: "date-time" },
  },
} as const;

export const TimeSeriesPointSchema = {
  $id: "TimeSeriesPoint",
  type: "object",
  required: ["timestamp", "latency", "errorRate", "requestsPerMinute"],
  properties: {
    timestamp:         { type: "string", format: "date-time" },
    latency:           { type: "number" },
    errorRate:         { type: "number" },
    requestsPerMinute: { type: "number" },
  },
} as const;

export const AlertSchema = {
  $id: "Alert",
  type: "object",
  required: ["id", "serviceId", "serviceName", "severity", "message", "triggeredAt", "active"],
  properties: {
    id:          { type: "string" },
    serviceId:   { type: "string" },
    serviceName: { type: "string" },
    severity:    { type: "string", enum: ["critical", "warning", "info"] },
    message:     { type: "string" },
    triggeredAt: { type: "string", format: "date-time" },
    resolvedAt:  { type: "string", format: "date-time" },
    active:      { type: "boolean" },
  },
} as const;

export const LogEntrySchema = {
  $id: "LogEntry",
  type: "object",
  required: ["id", "timestamp", "serviceId", "serviceName", "level", "message"],
  properties: {
    id:          { type: "string" },
    timestamp:   { type: "string", format: "date-time" },
    serviceId:   { type: "string" },
    serviceName: { type: "string" },
    level:       { type: "string", enum: ["error", "warn", "info", "debug"] },
    message:     { type: "string" },
    metadata:    { type: "object", additionalProperties: true },
  },
} as const;

export const ErrorResponseSchema = {
  $id: "ErrorResponse",
  type: "object",
  required: ["error"],
  properties: {
    error: { type: "string" },
  },
} as const;

export const ALL_SCHEMAS = [
  ServiceMetricsSchema,
  TimeSeriesPointSchema,
  AlertSchema,
  LogEntrySchema,
  ErrorResponseSchema,
] as const;
