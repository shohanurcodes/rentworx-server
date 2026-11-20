import { Router } from "express";
import { z } from "zod";

import { ApiError } from "../middlewares/errorHandler";
import { Review } from "../models/Review";
import { success } from "../utils/apiResponse";

export const reviewRoutes = Router();

const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(12).default(6),
});

reviewRoutes.get("/", async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new ApiError("Invalid query parameters", 400, parsed.error.issues);
    }

    const reviews = await Review.find({ isApproved: true })
      .select("customerName rating comment createdAt")
      .sort({ createdAt: -1 })
      .limit(parsed.data.limit)
      .lean();

    const data = reviews.map((review) => ({
      id: review._id.toString(),
      customerName: review.customerName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    }));

    return success(res, data, "Approved reviews retrieved");
  } catch (error) {
    return next(error);
  }
});
