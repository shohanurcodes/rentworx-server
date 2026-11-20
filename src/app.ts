import cors from "cors";
import express from "express";
import helmet from "helmet";
import { allowedOrigins } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { authRoutes } from "./routes/authRoutes";
import { equipmentRoutes } from "./routes/equipmentRoutes";
import { healthRoutes } from "./routes/healthRoutes";
import { reviewRoutes } from "./routes/reviewRoutes";
import { userRoutes } from "./routes/userRoutes";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        // Allow server-to-server calls and same-origin requests with no Origin.
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/equipment", equipmentRoutes);
  app.use("/api/reviews", reviewRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
