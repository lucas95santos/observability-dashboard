import Fastify from "fastify";
import cors from "@fastify/cors";
import ws from "@fastify/websocket";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { config } from "./config.js";
import { ServiceSimulator } from "./simulator.js";
import { healthRoutes } from "./routes/health.js";
import { createApiRoutes } from "./routes/api.js";
import { createWebSocketRoutes } from "./routes/websocket.js";
import { ALL_SCHEMAS } from "./schemas.js";

export async function buildApp() {
  const app = Fastify({ logger: config.NODE_ENV !== "test" });

  await app.register(cors, { origin: config.CORS_ORIGIN });
  await app.register(ws);

  for (const schema of ALL_SCHEMAS) {
    app.addSchema(schema);
  }

  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Observability Dashboard Mock API",
        version: "0.1.0",
        description:
          "REST API for the Observability Dashboard. " +
          "Provides service health metrics, time-series data, active alerts, and log entries.\n\n" +
          "**WebSocket endpoint**: `ws://<host>/ws/events` — streams real-time events: " +
          "`metrics_update`, `alert_triggered`, `alert_resolved`, `service_degraded`, " +
          "`service_recovered`, `log_entry`. This endpoint is not representable in OpenAPI " +
          "and is therefore not listed below.",
      },
      tags: [
        { name: "Health",   description: "Service liveness probe" },
        { name: "Services", description: "Aggregated service metrics" },
        { name: "Metrics",  description: "Time-series latency and error data" },
        { name: "Alerts",   description: "Active and historical alerts" },
        { name: "Logs",     description: "Structured log entries" },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });

  const simulator = new ServiceSimulator();
  app.addHook("onClose", async () => simulator.close());

  await app.register(healthRoutes);
  await app.register(createApiRoutes(simulator));
  await app.register(createWebSocketRoutes(simulator));

  return app;
}
