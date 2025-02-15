import type { FastifyPluginAsync } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type { Alert, LogEntry, RealtimeEvent } from '@repo/types';
import type { ServiceSimulator } from '../simulator.js';

function randomDelay(): number {
  return 1_000 + Math.random() * 1_000;
}

function send(socket: WebSocket, event: RealtimeEvent): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(event));
  }
}

export function createWebSocketRoutes(simulator: ServiceSimulator): FastifyPluginAsync {
  return async (app) => {
    app.get('/ws/events', { websocket: true }, (socket) => {
      // ── Periodic metrics broadcast ──────────────────────────────────────────
      let timer: ReturnType<typeof setTimeout>;

      const scheduleMetrics = () => {
        timer = setTimeout(() => {
          const services = simulator.sampleAll();
          const svc = services[Math.floor(Math.random() * services.length)];
          if (svc) {
            send(socket, {
              id: crypto.randomUUID(),
              type: 'metrics_update',
              timestamp: new Date().toISOString(),
              serviceId: svc.serviceId,
              data: svc,
            });
          }
          if (socket.readyState === socket.OPEN) scheduleMetrics();
        }, randomDelay());
      };

      scheduleMetrics();

      // ── Alert events ────────────────────────────────────────────────────────
      const onAlertTriggered = (alert: Alert) => {
        send(socket, {
          id: crypto.randomUUID(),
          type: 'alert_triggered',
          timestamp: new Date().toISOString(),
          serviceId: alert.serviceId,
          data: alert,
        });
        // Also emit service_degraded with current metrics
        const svc = simulator.sampleAll().find((s) => s.serviceId === alert.serviceId);
        if (svc) {
          send(socket, {
            id: crypto.randomUUID(),
            type: 'service_degraded',
            timestamp: new Date().toISOString(),
            serviceId: svc.serviceId,
            data: svc,
          });
        }
      };

      const onAlertResolved = (alert: Alert) => {
        send(socket, {
          id: crypto.randomUUID(),
          type: 'alert_resolved',
          timestamp: new Date().toISOString(),
          serviceId: alert.serviceId,
          data: alert,
        });
        const svc = simulator.sampleAll().find((s) => s.serviceId === alert.serviceId);
        if (svc) {
          send(socket, {
            id: crypto.randomUUID(),
            type: 'service_recovered',
            timestamp: new Date().toISOString(),
            serviceId: svc.serviceId,
            data: svc,
          });
        }
      };

      const onLogEntry = (entry: LogEntry) => {
        send(socket, {
          id: crypto.randomUUID(),
          type: 'log_entry',
          timestamp: new Date().toISOString(),
          serviceId: entry.serviceId,
          data: entry,
        });
      };

      simulator.on('alert_triggered', onAlertTriggered);
      simulator.on('alert_resolved', onAlertResolved);
      simulator.on('log_entry', onLogEntry);

      // ── Cleanup ─────────────────────────────────────────────────────────────
      socket.on('close', () => {
        clearTimeout(timer);
        simulator.off('alert_triggered', onAlertTriggered);
        simulator.off('alert_resolved', onAlertResolved);
        simulator.off('log_entry', onLogEntry);
      });
    });
  };
}
