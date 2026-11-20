import { Router } from "express";
import { z } from "zod";

import { ApiError } from "../middlewares/errorHandler";
import { type IEquipment, Equipment } from "../models/Equipment";
import { success } from "../utils/apiResponse";
import { assertObjectId } from "../utils/ids";
import { equipmentCard } from "../utils/equipmentCard";

export const equipmentRoutes = Router();

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().min(0).optional(),
);

const featuredQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(12).default(6),
});

const listQuerySchema = z.object({
  search: z.string().trim().default(""),
  location: z.string().trim().default(""),
  category: z.string().trim().default(""),
  rentalType: z.string().trim().default(""),
  minPrice: optionalNumber,
  maxPrice: optionalNumber,
  available: z.enum(["true", "false"]).optional(),
  sort: z
    .enum(["recent", "priceAsc", "priceDesc", "rating"])
    .default("recent"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
        "name category location price rentalType image condition ratingAverage reviewCount availableQuantity",
      )
      .sort({ ratingAverage: -1, reviewCount: -1, createdAt: -1 })
      .limit(parsed.data.limit)
      .lean();

    return success(
      res,
      equipment.map((item) => equipmentCard(item as IEquipment)),
      "Featured equipment retrieved",
    );
  } catch (error) {
    return next(error);
  }
});

equipmentRoutes.get("/", async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new ApiError("Invalid query parameters", 400, parsed.error.issues);
    }

    const {
      search,
      location,
      category,
      rentalType,
      minPrice,
      maxPrice,
      available,
      sort,
      page,
      limit,
    } = parsed.data;

    const filter: Record<string, unknown> = { status: "approved" };

    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { name: pattern },
        { description: pattern },
        { brand: pattern },
        { model: pattern },
        { category: pattern },
      ];
    }

    if (location) {
      filter.location = new RegExp(escapeRegex(location), "i");
    }

    if (category) filter.category = category;
    if (rentalType) filter.rentalType = rentalType;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {
        ...(minPrice !== undefined ? { $gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
      };
    }

    if (available === "true") filter.availableQuantity = { $gt: 0 };

    const sortOptions = {
      recent: { createdAt: -1 as const },
      priceAsc: { price: 1 as const },
      priceDesc: { price: -1 as const },
      rating: { ratingAverage: -1 as const, reviewCount: -1 as const },
    };

    const total = await Equipment.countDocuments(filter);
    const equipment = await Equipment.find(filter)
      .select(
        "name category location price rentalType image condition ratingAverage reviewCount availableQuantity",
      )
      .sort(sortOptions[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return success(
      res,
      equipment.map((item) => equipmentCard(item as IEquipment)),
      "Equipment retrieved",
      200,
      {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    );
  } catch (error) {
    return next(error);
  }
});

equipmentRoutes.get("/:id", async (req, res, next) => {
  try {
    assertObjectId(req.params.id, "equipment id");

    const equipment = await Equipment.findOne({
      _id: req.params.id,
      status: "approved",
    })
      .select("-seedKey -__v")
      .lean();

    if (!equipment) {
      throw new ApiError("Equipment not found", 404);
    }

    return success(
      res,
      {
        ...equipmentCard(equipment as IEquipment),
        description: equipment.description,
        brand: equipment.brand,
        model: equipment.model,
        quantity: equipment.quantity,
        terms: equipment.terms,
        ownerInfo: {
          name: equipment.ownerInfo.name,
          image: equipment.ownerInfo.image,
        },
      },
      "Equipment details retrieved",
    );
  } catch (error) {
    return next(error);
  }
});
