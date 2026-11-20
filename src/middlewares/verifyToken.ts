import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { ApiError } from "./errorHandler";
import { User } from "../models/User";

const JWKS = createRemoteJWKSet(new URL(env.AUTH_JWKS_URL));

export async function verifyToken(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new ApiError("Missing or malformed Authorization header", 401);
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      throw new ApiError("Access token is required", 401);
    }

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.AUTH_ISSUER,
      audience: env.AUTH_AUDIENCE,
    });

    const rawUserId = payload.sub ?? payload.id;

    if (typeof rawUserId !== "string" || !rawUserId) {
      throw new ApiError("Access token has no valid user subject", 401);
    }

    const user = await User.findById(rawUserId).select(
      "name email image role phone address isActive",
    );

    if (!user) {
      throw new ApiError("User for this token no longer exists", 401);
    }

    if (!user.isActive) {
      throw new ApiError("This account has been deactivated", 403);
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      phone: user.phone,
      address: user.address,
    };

    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }

    return next(new ApiError("Invalid or expired access token", 401));
  }
}
