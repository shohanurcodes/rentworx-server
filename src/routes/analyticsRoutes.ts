import { Router } from "express";

import { verifyAdmin, verifyOwner } from "../middlewares/verifyRoles";
import { verifyToken } from "../middlewares/verifyToken";
import { Booking } from "../models/Booking";
import { Equipment } from "../models/Equipment";
import { User } from "../models/User";
import { success } from "../utils/apiResponse";

export const analyticsRoutes = Router();

type RevenueRow = {
  paymentStatus: string;
  totalAmount: number;
};

function totalRevenue(rows: RevenueRow[]) {
  const total = rows
    .filter((row) => row.paymentStatus === "paid")
    .reduce((sum, row) => sum + row.totalAmount, 0);

  return Math.round(total * 100) / 100;
}

function countBy<T>(rows: T[], key: keyof T, value: unknown) {
  return rows.filter((row) => row[key] === value).length;
}

analyticsRoutes.get("/owner", verifyToken, verifyOwner, async (req, res, next) => {
  try {
    const [equipment, bookings] = await Promise.all([
      Equipment.find({ ownerId: req.user!.id }).select("status").lean(),
      Booking.find({ ownerId: req.user!.id })
        .select("bookingStatus paymentStatus totalAmount")
        .lean(),
    ]);

    return success(
      res,
      {
        equipment: {
          total: equipment.length,
          approved: countBy(equipment, "status", "approved"),
          pending: countBy(equipment, "status", "pending"),
          rejected: countBy(equipment, "status", "rejected"),
        },
        bookings: {
          total: bookings.length,
          pending: countBy(bookings, "bookingStatus", "pending"),
          confirmed: countBy(bookings, "bookingStatus", "confirmed"),
          completed: countBy(bookings, "bookingStatus", "completed"),
          cancelled: countBy(bookings, "bookingStatus", "cancelled"),
        },
        revenue: totalRevenue(bookings),
      },
      "Owner analytics retrieved",
    );
  } catch (error) {
    return next(error);
  }
});

analyticsRoutes.get("/admin", verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const [users, equipment, bookings] = await Promise.all([
      User.find().select("role").lean(),
      Equipment.find().select("status").lean(),
      Booking.find()
        .select("bookingStatus paymentStatus totalAmount")
        .lean(),
    ]);

    return success(
      res,
      {
        users: {
          total: users.length,
          customers: countBy(users, "role", "customer"),
          owners: countBy(users, "role", "owner"),
          admins: countBy(users, "role", "admin"),
        },
        equipment: {
          total: equipment.length,
          approved: countBy(equipment, "status", "approved"),
          pending: countBy(equipment, "status", "pending"),
          rejected: countBy(equipment, "status", "rejected"),
        },
        bookings: {
          total: bookings.length,
          pending: countBy(bookings, "bookingStatus", "pending"),
          confirmed: countBy(bookings, "bookingStatus", "confirmed"),
          completed: countBy(bookings, "bookingStatus", "completed"),
          cancelled: countBy(bookings, "bookingStatus", "cancelled"),
        },
        revenue: totalRevenue(bookings),
      },
      "Platform analytics retrieved",
    );
  } catch (error) {
    return next(error);
  }
});
