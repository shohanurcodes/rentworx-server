import type { Response } from "express";

export type ApiMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

export function success<T>(
  res: Response,
  data: T,
  message = "OK",
  statusCode = 200,
  meta?: ApiMeta,
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function failure(
  res: Response,
  message = "Something went wrong",
  statusCode = 500,
  errors?: unknown,
) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}
