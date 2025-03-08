import type { FastifyPluginAsync } from "fastify";
import type { ServiceSimulator } from "../simulator.js";

export function createApiRoutes(
  simulator: ServiceSimulator,
): FastifyPluginAsync {
  return async (app) => {
    app.get("/api/services", {
      schema: {
        summary: "List all services",
        description:
          "Returns current aggregated metrics for every monitored service, " +
          "including latency percentiles, error rate, and health status.",
        tags: ["Services"],
        response: {
          200: {
            description: "Array of service metric snapshots",
            type: "array",
            items: { $ref: "ServiceMetrics" },
          },
        },
      },
    }, async () => simulator.getServices());

    app.get<{
      Querystring: { service: string; from?: string; to?: string };
    }>(
      "/api/metrics",
      {
        schema: {
          summary: "Get time-series metrics for a service",
          description:
            "Returns a time-series array of latency, error rate, and request throughput " +
            "for a given service within the specified time window. " +
            "Defaults to the past 60 minutes if `from`/`to` are omitted.",
          tags: ["Metrics"],
          querystring: {
            type: "object",
            required: ["service"],
            properties: {
              service: {
                type: "string",
                description: "Service ID (e.g. `payment-service`)",
              },
              from: {
                type: "string",
                format: "date-time",
                description: "Start of the time window (ISO 8601). Defaults to 60 minutes ago.",
              },
              to: {
                type: "string",
                format: "date-time",
                description: "End of the time window (ISO 8601). Defaults to now.",
              },
            },
          },
          response: {
            200: {
              description: "Time-series data for the requested service",
              type: "object",
              required: ["serviceId", "points"],
              properties: {
                serviceId: { type: "string" },
                points: {
                  type: "array",
                  items: { $ref: "TimeSeriesPoint" },
                },
              },
            },
            400: {
              description: "Invalid date format in `from` or `to`",
              $ref: "ErrorResponse",
            },
            404: {
              description: "Service ID not found",
              $ref: "ErrorResponse",
            },
          },
        },
      },
      async (req, reply) => {
        const { service, from, to } = req.query;
        const toDate = to ? new Date(to) : new Date();
        const fromDate = from
          ? new Date(from)
          : new Date(toDate.getTime() - 60 * 60_000);

        if (isNaN(toDate.getTime()) || isNaN(fromDate.getTime())) {
          return reply.status(400).send({ error: "Invalid date format" });
        }
        const points = simulator.getMetrics(service, fromDate, toDate);
        if (!points)
          return reply
            .status(404)
            .send({ error: `Service '${service}' not found` });
        return { serviceId: service, points };
      },
    );

    app.get<{
      Querystring: { active?: string };
    }>("/api/alerts", {
      schema: {
        summary: "List alerts",
        description:
          "Returns all alerts, sorted by most recent first. " +
          "Pass `active=true` to return only unresolved alerts.",
        tags: ["Alerts"],
        querystring: {
          type: "object",
          properties: {
            active: {
              type: "string",
              enum: ["true", "false"],
              description: "When `true`, returns only active (unresolved) alerts.",
            },
          },
        },
        response: {
          200: {
            description: "Array of alert objects",
            type: "array",
            items: { $ref: "Alert" },
          },
        },
      },
    }, async (req) => {
      const activeOnly = req.query.active === "true";
      return simulator.getAlerts(activeOnly);
    });

    app.get<{
      Querystring: { service?: string; level?: string; limit?: string };
    }>("/api/logs", {
      schema: {
        summary: "Query log entries",
        description:
          "Returns log entries in reverse chronological order. " +
          "Supports optional filtering by service ID, log level, and result count cap.",
        tags: ["Logs"],
        querystring: {
          type: "object",
          properties: {
            service: {
              type: "string",
              description: "Filter by service ID.",
            },
            level: {
              type: "string",
              enum: ["error", "warn", "info", "debug"],
              description: "Filter by log level.",
            },
            limit: {
              type: "string",
              pattern: "^[0-9]+$",
              description: "Maximum number of entries to return. Defaults to 100.",
            },
          },
        },
        response: {
          200: {
            description: "Array of log entries",
            type: "array",
            items: { $ref: "LogEntry" },
          },
        },
      },
    }, async (req) => {
      const { service, level, limit } = req.query;
      return simulator.getLogs({
        serviceId: service,
        level,
        limit: limit ? parseInt(limit, 10) : 100,
      });
    });
  };
}
