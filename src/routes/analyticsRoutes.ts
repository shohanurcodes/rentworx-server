import { Router } from "express";

import { verifyAdmin, verifyOwner } from "../middlewares/verifyRoles";
import { verifyToken } from "../middlewares/verifyToken";
import { Booking } from "../models/Booking";
import { Equipment } from "../models/Equipment";
import { Payment } from "../models/Payment";
import { User } from "../models/User";
import { success } from "../utils/apiResponse";

export const analyticsRoutes = Router();

const MONTHLY_WINDOW = 6;

type RevenueRow = {
  paymentStatus: string;
  totalAmount: number;
  createdAt?: Date;
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

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthBuckets() {
  const now = new Date();

  return Array.from({ length: MONTHLY_WINDOW }, (_, index) => {
    const date = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - (MONTHLY_WINDOW - 1 - index),
        1,
      ),
    );

    return {
      key: monthKey(date),
      month: `${date.toLocaleString("en-US", {
        month: "short",
        timeZone: "UTC",
      })} ${String(date.getUTCFullYear()).slice(2)}`,
    };
  });
}

function monthlyBookings(rows: RevenueRow[]) {
  const buckets = monthBuckets().map((bucket) => ({ ...bucket, bookings: 0 }));

  for (const row of rows) {
    const createdAt = row.createdAt;

    if (!createdAt) continue;

    const bucket = buckets.find((item) => item.key === monthKey(new Date(createdAt)));

    if (bucket) bucket.bookings += 1;
  }

  return buckets.map(({ month, bookings }) => ({ month, bookings }));
}

function monthlyRevenue(rows: RevenueRow[]) {
  const buckets = monthBuckets().map((bucket) => ({ ...bucket, revenue: 0 }));

  for (const row of rows) {
    const createdAt = row.createdAt;

    if (!createdAt || row.paymentStatus !== "paid") continue;

    const bucket = buckets.find((item) => item.key === monthKey(new Date(createdAt)));

    if (bucket) bucket.revenue += row.totalAmount;
  }

  return buckets.map(({ month, revenue }) => ({
    month,
    revenue: Math.round(revenue * 100) / 100,
  }));
}

function monthlyEarnings(rows: { paidAt?: Date; amount: number }[]) {
  const buckets = monthBuckets().map((bucket) => ({ ...bucket, earnings: 0 }));

  for (const row of rows) {
    const paidAt = row.paidAt;

    if (!paidAt) continue;

    const bucket = buckets.find((item) => item.key === monthKey(new Date(paidAt)));

    if (bucket) bucket.earnings += row.amount;
  }

  return buckets.map(({ month, earnings }) => ({
    month,
    earnings: Math.round(earnings * 100) / 100,
  }));
}

analyticsRoutes.get("/owner", verifyToken, verifyOwner, async (req, res, next) => {
  try {
    const [equipment, bookings, payments] = await Promise.all([
      Equipment.find({ ownerId: req.user!.id }).select("status").lean(),
      Booking.find({ ownerId: req.user!.id })
        .select("bookingStatus paymentStatus totalAmount createdAt")
        .lean(),
      Payment.find({ ownerId: req.user!.id, status: "succeeded" })
        .select("amount paidAt")
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
        monthlyBookings: monthlyBookings(bookings),
        monthlyEarnings: monthlyEarnings(payments),
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
        .select("bookingStatus paymentStatus totalAmount createdAt")
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
        monthlyBookings: monthlyBookings(bookings),
        monthlyRevenue: monthlyRevenue(bookings),
      },
      "Platform analytics retrieved",
    );
  } catch (error) {
    return next(error);
  }
});
