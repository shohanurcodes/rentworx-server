import { Router } from "express";
import { z } from "zod";

import { ApiError } from "../middlewares/errorHandler";
import { verifyRenter } from "../middlewares/verifyRoles";
import { verifyToken } from "../middlewares/verifyToken";
import { Equipment, type IEquipment } from "../models/Equipment";
import { Favorite } from "../models/Favorite";
import { success } from "../utils/apiResponse";
import { equipmentCard } from "../utils/equipmentCard";
import { assertObjectId } from "../utils/ids";

export const favoriteRoutes = Router();

const createSchema = z
  .object({
    equipmentId: z.string().trim().min(1),
  })
  .strict();

favoriteRoutes.get("/", verifyToken, verifyRenter, async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ customerId: req.user!.id })
      .populate({
        path: "equipmentId",
        match: { status: "approved" },
        select:
          "name category location price rentalType image condition ratingAverage reviewCount availableQuantity status",
      })
      .sort({ createdAt: -1 })
      .lean();

    const data = favorites
      .filter((favorite) => favorite.equipmentId)
      .map((favorite) =>
        equipmentCard(favorite.equipmentId as unknown as IEquipment),
      );

    return success(res, data, "Favorites retrieved");
  } catch (error) {
    return next(error);
  }
});

favoriteRoutes.post("/", verifyToken, verifyRenter, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError("Invalid favorite data", 400, parsed.error.issues);
    }

    assertObjectId(parsed.data.equipmentId, "equipment id");

    const equipment = await Equipment.findOne({
      _id: parsed.data.equipmentId,
      status: "approved",
    }).select("_id");

    if (!equipment) {
      throw new ApiError("Equipment not found", 404);
    }

    await Favorite.findOneAndUpdate(
      {
        customerId: req.user!.id,
        equipmentId: equipment._id,
      },
      {
        $setOnInsert: {
          customerId: req.user!.id,
          equipmentId: equipment._id,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    return success(res, { id: equipment._id.toString() }, "Added to favorites");
  } catch (error) {
    return next(error);
  }
});

favoriteRoutes.delete("/:equipmentId", verifyToken, verifyRenter, async (req, res, next) => {
  try {
    const equipmentId = String(req.params.equipmentId);
    assertObjectId(equipmentId, "equipment id");

    await Favorite.deleteOne({
      customerId: req.user!.id,
      equipmentId,
    });

    return success(res, { id: equipmentId }, "Removed from favorites");
  } catch (error) {
    return next(error);
  }
});
