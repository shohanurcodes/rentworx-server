import { Router } from "express";
import { z } from "zod";

import { ApiError } from "../middlewares/errorHandler";
import { Equipment } from "../models/Equipment";
import { success } from "../utils/apiResponse";

export const equipmentRoutes = Router();

const featuredQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(12).default(6),
});

equipmentRoutes.get("/featured", async (req, res, next) => {
  try {
    const parsed = featuredQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new ApiError("Invalid query parameters", 400, parsed.error.issues);
    }

    const equipment = await Equipment.find({
      status: "approved",
      availableQuantity: { $gt: 0 },
    })
      .select(
        "name category location price rentalType image condition ratingAverage reviewCount",
      )
      .sort({ ratingAverage: -1, reviewCount: -1, createdAt: -1 })
      .limit(parsed.data.limit)
      .lean();

    const data = equipment.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      category: item.category,
      location: item.location,
      price: item.price,
      rentalType: item.rentalType,
      image: item.image,
      condition: item.condition,
      ratingAverage: item.ratingAverage ?? 0,
      reviewCount: item.reviewCount ?? 0,
    }));

    return success(res, data, "Featured equipment retrieved");
  } catch (error) {
    return next(error);
  }
});
