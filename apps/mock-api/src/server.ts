import { buildApp } from "./app.js";
import { config } from "./config.js";

const app = await buildApp();
const shutdown = async (signal: string) => {
  app.log.info(`Received ${signal}, shutting down…`);
  await app.close();
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

try {
  await app.listen({ port: config.PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
