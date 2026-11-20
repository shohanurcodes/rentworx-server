import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./errorHandler";

function requireRole(role: "customer" | "owner" | "admin", label: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError("Authentication required", 401));
    }

    if (req.user.role !== role) {
      return next(new ApiError(`${label} access required`, 403));
    }

    return next();
  };
}

/** Customers are the renters in this platform. */
export const verifyRenter = requireRole("customer", "Customer");

export const verifyOwner = requireRole("owner", "Owner");

export const verifyAdmin = requireRole("admin", "Admin");
