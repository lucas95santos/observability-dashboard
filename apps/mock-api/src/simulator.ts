import { EventEmitter } from "node:events";
import {
  ServiceStatus,
  type Alert,
  type LogEntry,
  type ServiceMetrics,
  type TimeSeriesPoint,
} from "@repo/types";

// Box-Muller transform for Gaussian noise
function gaussian(mean: number, stddev: number): number {
  const u1 = Math.random() || Number.EPSILON;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

interface ServiceConfig {
  id: string;
  name: string;
  baseLatency: number;
  latencyStddev: number;
  baseRpm: number;
  baseErrorRate: number;
}

const SERVICE_CONFIGS: ServiceConfig[] = [
  {
    id: "payment-service",
    name: "Payment Service",
    baseLatency: 120,
    latencyStddev: 20,
    baseRpm: 450,
    baseErrorRate: 0.005,
  },
  {
    id: "auth-service",
    name: "Auth Service",
    baseLatency: 45,
    latencyStddev: 8,
    baseRpm: 1200,
    baseErrorRate: 0.005,
  },
  {
    id: "notification-service",
    name: "Notification Service",
    baseLatency: 80,
    latencyStddev: 15,
    baseRpm: 320,
    baseErrorRate: 0.005,
  },
  {
    id: "gateway-service",
    name: "Gateway Service",
    baseLatency: 25,
    latencyStddev: 5,
    baseRpm: 2000,
    baseErrorRate: 0.005,
  },
];

const LOG_MESSAGES: Record<string, string[]> = {
  info: [
    "Request processed successfully",
    "Cache hit for resource",
    "Connection pool healthy",
    "Heartbeat ok",
  ],
  debug: [
    "Processing request",
    "Cache lookup initiated",
    "DB query executed",
    "Token validated",
  ],
  warn: [
    "Slow query detected",
    "Retry attempt 1/3",
    "Cache miss — fetching from DB",
    "Rate limit approaching",
  ],
  error: [
    "Upstream timeout",
    "DB connection refused",
    "Invalid token signature",
    "Circuit breaker open",
  ],
};

interface ServiceState {
  config: ServiceConfig;
  degraded: boolean;
  degradedUntil: number;
  history: TimeSeriesPoint[];
}

export type SimulatorEvents = {
  alert_triggered: [Alert];
  alert_resolved: [Alert];
  log_entry: [LogEntry];
};

export class ServiceSimulator extends EventEmitter<SimulatorEvents> {
  private readonly states = new Map<string, ServiceState>();
  private readonly alerts = new Map<string, Alert>();
  private readonly logs: LogEntry[] = [];
  private alertSeq = 0;
  private logSeq = 0;
  private readonly timers: ReturnType<typeof setInterval>[] = [];

  constructor() {
    super();
    for (const cfg of SERVICE_CONFIGS) {
      this.states.set(cfg.id, {
        config: cfg,
        degraded: false,
        degradedUntil: 0,
        history: this.buildInitialHistory(cfg),
      });
    }

    // Every minute: push a new time-series point
    this.timers.push(setInterval(() => this.tick(), 60_000));

    // Every 30s: maybe degrade a service
    this.timers.push(setInterval(() => this.maybeDegradeServices(), 30_000));

    // Background log noise every 5-10s
    this.scheduleLogNoise();
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  private buildInitialHistory(cfg: ServiceConfig): TimeSeriesPoint[] {
    const now = Date.now();
    return Array.from({ length: 60 }, (_, i) => {
      const msAgo = (59 - i) * 60_000;
      return this.syntheticPoint(
        cfg,
        false,
        new Date(now - msAgo).toISOString(),
      );
    });
  }

  private syntheticPoint(
    cfg: ServiceConfig,
    degraded: boolean,
    timestamp: string,
  ): TimeSeriesPoint {
    const latMultiplier = degraded ? clamp(gaussian(3.5, 0.8), 1.5, 7) : 1;
    const errorBase = degraded
      ? clamp(gaussian(0.115, 0.02), 0.08, 0.15)
      : cfg.baseErrorRate;

    return {
      timestamp,
      latency: clamp(
        gaussian(
          cfg.baseLatency * latMultiplier,
          cfg.latencyStddev * (degraded ? 3 : 1),
        ),
        1,
        cfg.baseLatency * 15,
      ),
      errorRate: clamp(gaussian(errorBase, errorBase * 0.3), 0, 1),
      requestsPerMinute: clamp(
        gaussian(cfg.baseRpm * (degraded ? 0.7 : 1), cfg.baseRpm * 0.1),
        1,
        cfg.baseRpm * 3,
      ),
    };
  }

  private isDegraded(state: ServiceState): boolean {
    if (!state.degraded) return false;
    if (Date.now() >= state.degradedUntil) {
      state.degraded = false;
      return false;
    }
    return true;
  }

  private tick(): void {
    for (const state of this.states.values()) {
      const degraded = this.isDegraded(state);
      const point = this.syntheticPoint(
        state.config,
        degraded,
        new Date().toISOString(),
      );
      state.history.push(point);
      if (state.history.length > 60) state.history.shift();

      if (degraded && Math.random() < 0.4) {
        const msgs = LOG_MESSAGES["error"]!;
        const msg = msgs[Math.floor(Math.random() * msgs.length)] ?? "Error";
        this.pushLog(state.config, "error", msg);
      }
    }
  }

  private maybeDegradeServices(): void {
    const now = Date.now();
    for (const state of this.states.values()) {
      // Check if a current degradation just ended
      if (state.degraded && now >= state.degradedUntil) {
        state.degraded = false;
        this.onRecovery(state);
        continue;
      }

      // 20% chance to start a new degradation
      if (!state.degraded && Math.random() < 0.2) {
        const durationMs = (10 + Math.random() * 10) * 1_000;
        state.degraded = true;
        state.degradedUntil = now + durationMs;
        this.onDegraded(state);
      }
    }
  }

  private onDegraded(state: ServiceState): void {
    const alert = this.createAlert(
      state.config,
      "warning",
      `Elevated error rate and latency detected`,
    );
    this.pushLog(
      state.config,
      "warn",
      `Service entered degraded state — error rate rising`,
    );
    this.emit("alert_triggered", alert);
  }

  private onRecovery(state: ServiceState): void {
    const resolved = this.resolveServiceAlerts(state.config.id);
    this.pushLog(
      state.config,
      "info",
      `Service recovered — metrics returning to baseline`,
    );
    for (const alert of resolved) this.emit("alert_resolved", alert);
  }

  private createAlert(
    cfg: ServiceConfig,
    severity: Alert["severity"],
    message: string,
  ): Alert {
    const alert: Alert = {
      id: `alert-${++this.alertSeq}`,
      serviceId: cfg.id,
      serviceName: cfg.name,
      severity,
      message,
      triggeredAt: new Date().toISOString(),
      active: true,
    };
    this.alerts.set(alert.id, alert);
    return alert;
  }

  private resolveServiceAlerts(serviceId: string): Alert[] {
    const resolved: Alert[] = [];
    for (const alert of this.alerts.values()) {
      if (alert.serviceId === serviceId && alert.active) {
        alert.active = false;
        alert.resolvedAt = new Date().toISOString();
        resolved.push(alert);
      }
    }
    return resolved;
  }

  private pushLog(
    cfg: ServiceConfig,
    level: LogEntry["level"],
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    const entry: LogEntry = {
      id: `log-${++this.logSeq}`,
      timestamp: new Date().toISOString(),
      serviceId: cfg.id,
      serviceName: cfg.name,
      level,
      message,
      metadata,
    };
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
    this.emit("log_entry", entry);
  }

  private scheduleLogNoise(): void {
    const delay = 5_000 + Math.random() * 5_000;
    const timer = setTimeout(() => {
      const configs = SERVICE_CONFIGS;
      const cfg = configs[Math.floor(Math.random() * configs.length)]!;
      const state = this.states.get(cfg.id)!;
      const degraded = this.isDegraded(state);
      const level = degraded
        ? Math.random() < 0.5
          ? "error"
          : "warn"
        : Math.random() < 0.7
          ? "info"
          : "debug";
      const msgs = LOG_MESSAGES[level]!;
      this.pushLog(cfg, level, msgs[Math.floor(Math.random() * msgs.length)]!);
      this.scheduleLogNoise();
    }, delay);
    // Unref so it doesn't block process exit
    timer.unref();
  }

  // ─── Public API (used by REST routes) ─────────────────────────────────────

  getServices(): ServiceMetrics[] {
    return Array.from(this.states.values()).map((state) => {
      const degraded = this.isDegraded(state);
      const sorted = [...state.history]
        .map((p) => p.latency)
        .sort((a, b) => a - b);
      const last = state.history.at(-1)!;
      const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
      const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? last.latency;
      const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? last.latency;
      return {
        serviceId: state.config.id,
        serviceName: state.config.name,
        status: degraded ? ServiceStatus.DEGRADED : ServiceStatus.HEALTHY,
        avgLatency: avg,
        p95Latency: p95,
        p99Latency: p99,
        errorRate: last.errorRate,
        requestsPerMinute: last.requestsPerMinute,
        uptime: degraded
          ? clamp(gaussian(0.972, 0.008), 0.95, 0.99)
          : clamp(gaussian(0.9995, 0.0002), 0.998, 1),
        lastUpdated: last.timestamp,
      };
    });
  }

  getMetrics(
    serviceId: string,
    from: Date,
    to: Date,
  ): TimeSeriesPoint[] | null {
    const state = this.states.get(serviceId);
    if (!state) return null;
    const fromMs = from.getTime();
    const toMs = to.getTime();
    return state.history.filter((p) => {
      const t = new Date(p.timestamp).getTime();
      return t >= fromMs && t <= toMs;
    });
  }

  getAlerts(activeOnly = false): Alert[] {
    const all = Array.from(this.alerts.values());
    const filtered = activeOnly ? all.filter((a) => a.active) : all;
    return filtered.sort(
      (a, b) =>
        new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime(),
    );
  }

  getLogs(
    opts: { serviceId?: string; level?: string; limit?: number } = {},
  ): LogEntry[] {
    const { serviceId, level, limit = 100 } = opts;
    let result = [...this.logs].reverse();
    if (serviceId) result = result.filter((l) => l.serviceId === serviceId);
    if (level) result = result.filter((l) => l.level === level);
    return result.slice(0, limit);
  }

  /** Returns current (live) metrics for all services — used by the WS emitter */
  sampleAll(): ServiceMetrics[] {
    return this.getServices();
  }

  close(): void {
    for (const t of this.timers) clearInterval(t);
  }
}
