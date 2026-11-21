import { Router } from "express";
import mongoose from "mongoose";

import { env } from "../config/env";
import { success } from "../utils/apiResponse";

export const healthRoutes = Router();

healthRoutes.get("/", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  const data = {
    status: databaseConnected ? "ok" : "degraded",
    service: "rentworx-api",
    environment: env.NODE_ENV,
    database: databaseConnected ? "connected" : "disconnected",
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
  };

  if (!databaseConnected) {
    return res.status(503).json({
      success: false,
      message: "Database is unavailable",
      data,
    });
  }

  return success(res, data, "Service is healthy");
});
