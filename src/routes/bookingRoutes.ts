import { Router } from "express";
import type { HydratedDocument } from "mongoose";
import Stripe from "stripe";
import { z } from "zod";

import { allowedOrigins, env } from "../config/env";
import { ApiError } from "../middlewares/errorHandler";
import { verifyToken } from "../middlewares/verifyToken";
import { Booking, type IBooking } from "../models/Booking";
import { Equipment } from "../models/Equipment";
import { success } from "../utils/apiResponse";
import { assertObjectId } from "../utils/ids";

export const bookingRoutes = Router();

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const checkoutSchema = z
  .object({
    equipmentId: z.string().trim().min(1),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    requiredQuantity: z.coerce.number().int().positive(),
    contactNumber: z.string().trim().min(6).max(30),
    deliveryAddress: z.string().trim().min(3).max(200),
    notes: z.string().trim().max(500).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.endDate <= data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date must be after the start date",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (data.startDate < today) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "Start date cannot be in the past",
      });
    }
  });

function calculateDuration(
  startDate: Date,
  endDate: Date,
  rentalType: string,
) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
  const divisor = rentalType === "weekly" ? 7 : rentalType === "monthly" ? 30 : 1;

  return Math.max(1, Math.ceil(days / divisor));
}

bookingRoutes.post("/checkout", verifyToken, async (req, res, next) => {
  let booking: HydratedDocument<IBooking> | null = null;

  try {
    const parsed = checkoutSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ApiError("Invalid booking data", 400, parsed.error.issues);
    }

    const input = parsed.data;
    assertObjectId(input.equipmentId, "equipment id");

    if (!env.STRIPE_SECRET_KEY) {
      throw new ApiError("Stripe checkout is not configured", 503);
    }

    const equipment = await Equipment.findOne({
      _id: input.equipmentId,
      status: "approved",
    });

    if (!equipment) {
      throw new ApiError("Equipment not found", 404);
    }

    if (equipment.availableQuantity < input.requiredQuantity) {
      throw new ApiError(
        `Only ${equipment.availableQuantity} unit(s) are available`,
        409,
      );
    }

    const duration = calculateDuration(
      input.startDate,
      input.endDate,
      equipment.rentalType,
    );
    const totalAmount =
      Math.round(equipment.price * duration * input.requiredQuantity * 100) /
      100;

    booking = await Booking.create({
      customerId: req.user!.id,
      customerInfo: {
        name: req.user!.name,
        email: req.user!.email,
        image: req.user!.image,
      },
      ownerId: equipment.ownerId,
      ownerInfo: {
        name: equipment.ownerInfo.name,
        email: equipment.ownerInfo.email,
        image: equipment.ownerInfo.image,
      },
      equipmentId: equipment._id,
      equipmentInfo: {
        name: equipment.name,
        image: equipment.image,
        location: equipment.location,
        category: equipment.category,
        email: equipment.ownerInfo.email,
      },
      startDate: input.startDate,
      endDate: input.endDate,
      rentalType: equipment.rentalType,
      duration,
      requiredQuantity: input.requiredQuantity,
      unitPrice: equipment.price,
      totalAmount,
      contactNumber: input.contactNumber,
      deliveryAddress: input.deliveryAddress,
      notes: input.notes,
    });

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const origin = allowedOrigins[0] ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.user!.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: equipment.name,
              description: `${duration} ${equipment.rentalType} rental(s) × ${input.requiredQuantity} unit(s)`,
            },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&bookingId=${booking.id}`,
      cancel_url: `${origin}/equipment/${equipment.id}?checkout=cancelled`,
      metadata: {
        bookingId: booking.id,
        customerId: req.user!.id,
        equipmentId: equipment.id,
      },
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    return success(
      res,
      {
        url: session.url,
        sessionId: session.id,
        bookingId: booking.id,
      },
      "Checkout session created",
      201,
    );
  } catch (error) {
    if (booking?._id) {
      await Booking.deleteOne({ _id: booking._id });
    }

    return next(error);
  }
});
