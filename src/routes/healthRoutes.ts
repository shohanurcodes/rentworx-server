import { Router } from "express";
import { env } from "../config/env";
import { success } from "../utils/apiResponse";

export const healthRoutes = Router();

healthRoutes.get("/", (_req, res) => {
  return success(
    res,
    {
      status: "ok",
      service: "rentworx-api",
      environment: env.NODE_ENV,
      uptimeSeconds: Number(process.uptime().toFixed(2)),
      timestamp: new Date().toISOString(),
    },
    "Service is healthy",
  );
});
