import type { FastifyPluginAsync } from "fastify";
import type { ServiceSimulator } from "../simulator.js";

export function createApiRoutes(
  simulator: ServiceSimulator,
): FastifyPluginAsync {
  return async (app) => {
    app.get("/api/services", async () => simulator.getServices());

    app.get<{
      Querystring: { service: string; from?: string; to?: string };
    }>(
      "/api/metrics",
      {
        schema: {
          querystring: {
            type: "object",
            required: ["service"],
            properties: {
              service: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
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
    }>("/api/alerts", async (req) => {
      const activeOnly = req.query.active === "true";
      return simulator.getAlerts(activeOnly);
    });

    app.get<{
      Querystring: { service?: string; level?: string; limit?: string };
    }>("/api/logs", async (req) => {
      const { service, level, limit } = req.query;
      return simulator.getLogs({
        serviceId: service,
        level,
        limit: limit ? parseInt(limit, 10) : 100,
      });
    });
  };
}
