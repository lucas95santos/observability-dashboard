import Fastify from "fastify";
import cors from "@fastify/cors";
import ws from "@fastify/websocket";
import { config } from "./config.js";
import { healthRoutes } from "./routes/health.js";

export async function buildApp() {
  const app = Fastify({ logger: config.NODE_ENV !== "test" });
  await app.register(cors, { origin: config.CORS_ORIGIN });
  await app.register(ws);
  await app.register(healthRoutes);
  return app;
}
