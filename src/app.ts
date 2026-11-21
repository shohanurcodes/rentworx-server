import cors from "cors";
import express from "express";
import helmet from "helmet";
import { allowedOrigins } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { analyticsRoutes } from "./routes/analyticsRoutes";
import { authRoutes } from "./routes/authRoutes";
import { bookingRoutes } from "./routes/bookingRoutes";
import { equipmentRoutes } from "./routes/equipmentRoutes";
import { favoriteRoutes } from "./routes/favoriteRoutes";
import { healthRoutes } from "./routes/healthRoutes";
import { paymentRoutes } from "./routes/paymentRoutes";
import { reviewRoutes } from "./routes/reviewRoutes";
import { uploadRoutes } from "./routes/uploadRoutes";
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
      allowedHeaders: ["Content-Type", "Authorization", "Stripe-Signature"],
    }),
  );

  // Stripe verifies signatures against the exact raw request body.
  app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/equipment", equipmentRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/upload", uploadRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
