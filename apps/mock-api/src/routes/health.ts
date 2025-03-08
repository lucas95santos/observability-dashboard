import type { FastifyPluginAsync } from "fastify";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", {
    schema: {
      summary: "Health check",
      description: "Returns server liveness status and process uptime in seconds.",
      tags: ["Health"],
      response: {
        200: {
          description: "Server is alive",
          type: "object",
          required: ["status", "uptime"],
          properties: {
            status: { type: "string", enum: ["ok"] },
            uptime: { type: "number", description: "Process uptime in seconds" },
          },
        },
      },
    },
  }, async () => ({
    status: "ok",
    uptime: Math.round(process.uptime()),
  }));
};
