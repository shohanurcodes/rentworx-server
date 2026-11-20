import { Router } from "express";
import { z } from "zod";
import { USER_ROLES } from "../constants/rental";
import { ApiError } from "../middlewares/errorHandler";
import { verifyAdmin } from "../middlewares/verifyRoles";
import { verifyToken } from "../middlewares/verifyToken";
import { User } from "../models/User";
import { success } from "../utils/apiResponse";
import { assertObjectId } from "../utils/ids";
import { sanitizeUser } from "../utils/sanitizeUser";

export const userRoutes = Router();

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(200).optional(),
    image: z.url().optional(),
  })
  .strict();

const roleSchema = z
  .object({
    role: z.enum(USER_ROLES),
  })
  .strict();

const manageSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().default(""),
});

userRoutes.patch("/me", verifyToken, async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError("Invalid profile data", 400, parsed.error.issues);
    }

    const updated = await User.findByIdAndUpdate(
      req.user!.id,
      { ...parsed.data, updatedAt: new Date() },
      { new: true, runValidators: true },
    );

    if (!updated) {
      throw new ApiError("User not found", 404);
    }

    return success(
      res,
      sanitizeUser(updated),
      "Profile updated successfully",
    );
  } catch (error) {
    return next(error);
  }
});

userRoutes.get("/", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new ApiError("Invalid query parameters", 400, parsed.error.issues);
    }

    const { page, limit, search } = parsed.data;
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return success(
      res,
      users.map(sanitizeUser),
      "Users retrieved",
      200,
      {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    );
  } catch (error) {
    return next(error);
  }
});

userRoutes.patch(
  "/:id/role",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      assertObjectId(id, "user id");

      const parsed = roleSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new ApiError("Invalid role", 400, parsed.error.issues);
      }

      if (req.user!.id === id) {
        throw new ApiError("You cannot change your own role", 400);
      }

      const updated = await User.findByIdAndUpdate(
        id,
        { role: parsed.data.role, updatedAt: new Date() },
        { new: true, runValidators: true },
      );

      if (!updated) {
        throw new ApiError("User not found", 404);
      }

      return success(
        res,
        sanitizeUser(updated),
        `Role changed to ${updated.role}`,
      );
    } catch (error) {
      return next(error);
    }
  },
);

userRoutes.patch(
  "/:id/manage",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      assertObjectId(id, "user id");

      const parsed = manageSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new ApiError("Invalid manage payload", 400, parsed.error.issues);
      }

      if (req.user!.id === id) {
        throw new ApiError("You cannot deactivate your own account", 400);
      }

      const updated = await User.findByIdAndUpdate(
        id,
        { isActive: parsed.data.isActive, updatedAt: new Date() },
        { new: true, runValidators: true },
      );

      if (!updated) {
        throw new ApiError("User not found", 404);
      }

      return success(
        res,
        sanitizeUser(updated),
        parsed.data.isActive ? "User activated" : "User deactivated",
      );
    } catch (error) {
      return next(error);
    }
  },
);

userRoutes.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  async (req, res, next) => {
    try {
      const id = String(req.params.id);
      assertObjectId(id, "user id");

      if (req.user!.id === id) {
        throw new ApiError("You cannot delete your own account", 400);
      }

      const deleted = await User.findByIdAndDelete(id);

      if (!deleted) {
        throw new ApiError("User not found", 404);
      }

      return success(res, { id: deleted.id }, "User deleted");
    } catch (error) {
      return next(error);
    }
  },
);
