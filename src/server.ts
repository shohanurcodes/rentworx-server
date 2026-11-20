import { createApp } from "./app";
import { connectDB, disconnectDB } from "./config/db";
import { env } from "./config/env";

async function start() {
  await connectDB();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`RentWorx API running on http://localhost:${env.PORT}`);
    console.log(`Allowed client origin(s): ${env.CLIENT_URL}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received. Closing RentWorx API server...`);
    server.close(async () => {
      await disconnectDB();
      console.log("RentWorx API server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((error) => {
  console.error("Failed to start RentWorx API:", error);
  process.exit(1);
});
