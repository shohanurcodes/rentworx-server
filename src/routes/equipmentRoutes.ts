import { Router } from "express";
import { z } from "zod";

import { EQUIPMENT_CATEGORIES } from "../constants/categories";
import {
  EQUIPMENT_STATUSES,
  RENTAL_TYPES,
} from "../constants/rental";
import { ApiError } from "../middlewares/errorHandler";
import {
  verifyAdmin,
  verifyOwner,
  verifyOwnerOrAdmin,
} from "../middlewares/verifyRoles";
import { verifyToken } from "../middlewares/verifyToken";
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

const equipmentFields = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(2000),
  category: z.enum(EQUIPMENT_CATEGORIES),
  location: z.string().trim().min(2).max(120),
  price: z.coerce.number().positive(),
  rentalType: z.enum(RENTAL_TYPES),
  quantity: z.coerce.number().int().positive(),
  availableQuantity: z.coerce.number().int().min(0),
  condition: z.string().trim().min(2).max(80),
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  image: z.url(),
  terms: z.string().trim().min(5).max(1000),
});

const createEquipmentSchema = equipmentFields.strict().refine(
  (data) => data.availableQuantity <= data.quantity,
  {
    message: "Available quantity cannot exceed total quantity",
    path: ["availableQuantity"],
  },
);

const updateEquipmentSchema = equipmentFields.partial().strict().refine(
  (data) =>
    data.quantity === undefined ||
    data.availableQuantity === undefined ||
    data.availableQuantity <= data.quantity,
  {
    message: "Available quantity cannot exceed total quantity",
    path: ["availableQuantity"],
  },
);

const statusSchema = z
  .object({ status: z.enum(["approved", "rejected"]) })
  .strict();

const adminQuerySchema = z.object({
  status: z.enum(EQUIPMENT_STATUSES).optional(),
  search: z.string().trim().default(""),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

function manageEquipment(item: IEquipment) {
  return {
    ...equipmentCard(item),
    ownerInfo: item.ownerInfo,
    status: item.status,
    description: item.description,
    quantity: item.quantity,
    brand: item.brand,
    model: item.model,
    terms: item.terms,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

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

equipmentRoutes.post("/", verifyToken, verifyOwner, async (req, res, next) => {
  try {
    const parsed = createEquipmentSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError("Invalid equipment data", 400, parsed.error.issues);
    }

    const equipment = await Equipment.create({
      ...parsed.data,
      ownerId: req.user!.id,
      ownerInfo: {
        name: req.user!.name,
        email: req.user!.email,
        image: req.user!.image,
      },
      status: "pending",
    });

    return success(
      res,
      manageEquipment(equipment as IEquipment),
      "Equipment submitted for review",
      201,
    );
  } catch (error) {
    return next(error);
  }
});

equipmentRoutes.get("/my", verifyToken, verifyOwner, async (req, res, next) => {
  try {
    const equipment = await Equipment.find({ ownerId: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();

    return success(
      res,
      equipment.map((item) => manageEquipment(item as IEquipment)),
      "My equipment retrieved",
    );
  } catch (error) {
    return next(error);
  }
});

equipmentRoutes.get("/admin", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const parsed = adminQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new ApiError("Invalid query parameters", 400, parsed.error.issues);
    }

    const { status, search, page, limit } = parsed.data;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;

    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: pattern }, { brand: pattern }, { location: pattern }];
    }

    const total = await Equipment.countDocuments(filter);
    const equipment = await Equipment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return success(
      res,
      equipment.map((item) => manageEquipment(item as IEquipment)),
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

equipmentRoutes.patch(
  "/:id/status",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      assertObjectId(id, "equipment id");

      const parsed = statusSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new ApiError("Invalid status", 400, parsed.error.issues);
      }

      const updated = await Equipment.findByIdAndUpdate(
        id,
        { status: parsed.data.status },
        { new: true, runValidators: true },
      );

      if (!updated) {
        throw new ApiError("Equipment not found", 404);
      }

      return success(
        res,
        manageEquipment(updated as IEquipment),
        `Equipment ${parsed.data.status}`,
      );
    } catch (error) {
      return next(error);
    }
  },
);

equipmentRoutes.patch(
  "/:id",
  verifyToken,
  verifyOwnerOrAdmin,
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      assertObjectId(id, "equipment id");

      const parsed = updateEquipmentSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new ApiError("Invalid equipment data", 400, parsed.error.issues);
      }

      const filter: Record<string, unknown> = { _id: id };

      if (req.user!.role === "owner") {
        filter.ownerId = req.user!.id;
      }

      const updated = await Equipment.findOneAndUpdate(
        filter,
        { $set: parsed.data },
        { new: true, runValidators: true },
      );

      if (!updated) {
        throw new ApiError("Equipment not found", 404);
      }

      return success(
        res,
        manageEquipment(updated as IEquipment),
        "Equipment updated",
      );
    } catch (error) {
      return next(error);
    }
  },
);

equipmentRoutes.delete(
  "/:id",
  verifyToken,
  verifyOwnerOrAdmin,
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      assertObjectId(id, "equipment id");

      const filter: Record<string, unknown> = { _id: id };

      if (req.user!.role === "owner") {
        filter.ownerId = req.user!.id;
      }

      const deleted = await Equipment.findOneAndDelete(filter);

      if (!deleted) {
        throw new ApiError("Equipment not found", 404);
      }

      return success(res, { id }, "Equipment deleted");
    } catch (error) {
      return next(error);
    }
  },
);

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
