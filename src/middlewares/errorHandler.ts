import type { NextFunction, Request, Response } from "express";
import { isProduction } from "../config/env";
import { failure } from "../utils/apiResponse";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: unknown;

  constructor(message: string, statusCode = 400, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  return failure(
    res,
    `Route ${req.method} ${req.originalUrl} was not found`,
    404,
  );
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const knownError = err as {
    message?: string;
    statusCode?: number;
    errors?: unknown;
  };

  const statusCode =
    err instanceof ApiError
      ? err.statusCode
      : (knownError.statusCode ?? 500);

  const message =
    statusCode >= 500 && isProduction
      ? "Internal server error"
      : (knownError.message ?? "Something went wrong");

  return failure(res, message, statusCode, knownError.errors);
}
