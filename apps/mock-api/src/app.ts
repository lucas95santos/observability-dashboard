import Fastify from "fastify";
import cors from "@fastify/cors";
import ws from "@fastify/websocket";
import { config } from "./config.js";
import { ServiceSimulator } from "./simulator.js";
import { healthRoutes } from "./routes/health.js";
import { createApiRoutes } from "./routes/api.js";

export async function buildApp() {
  const app = Fastify({ logger: config.NODE_ENV !== "test" });
  await app.register(cors, { origin: config.CORS_ORIGIN });
  await app.register(ws);
  const simulator = new ServiceSimulator();
  // Cleanup simulator intervals on server close
  app.addHook("onClose", async () => simulator.close());
  await app.register(healthRoutes);
  await app.register(createApiRoutes(simulator));
  return app;
}
