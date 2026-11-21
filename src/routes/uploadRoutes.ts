import { Router } from "express";
import { z } from "zod";

import { env } from "../config/env";
import { ApiError } from "../middlewares/errorHandler";
import { verifyOwnerOrAdmin } from "../middlewares/verifyRoles";
import { verifyToken } from "../middlewares/verifyToken";
import { success } from "../utils/apiResponse";

export const uploadRoutes = Router();

const uploadSchema = z
  .object({ image: z.string().min(10) })
  .strict();

uploadRoutes.post("/imgbb", verifyToken, verifyOwnerOrAdmin, async (req, res, next) => {
  try {
    if (!env.IMGBB_API_KEY) {
      throw new ApiError("Image upload is not configured", 503);
    }

    const parsed = uploadSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError("Invalid image data", 400, parsed.error.issues);
    }

    const base64 = parsed.data.image.replace(
      /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
      "",
    );

    const response = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: new URLSearchParams({
        key: env.IMGBB_API_KEY,
        image: base64,
      }),
    });

    const payload = (await response.json()) as {
      data?: { url?: string; delete_url?: string };
      error?: { message?: string };
    };

    if (!response.ok || !payload.data?.url) {
      throw new ApiError(
        payload.error?.message ?? "Image upload failed",
        502,
      );
    }

    return success(
      res,
      { url: payload.data.url, deleteUrl: payload.data.delete_url },
      "Image uploaded",
    );
  } catch (error) {
    return next(error);
  }
});
