import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`RentWorx API running on http://localhost:${env.PORT}`);
  console.log(`Allowed client origin(s): ${env.CLIENT_URL}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received. Closing RentWorx API server...`);
  server.close(() => {
    console.log("RentWorx API server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
