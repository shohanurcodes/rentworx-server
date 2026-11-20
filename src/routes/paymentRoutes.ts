import { Router } from "express";
import Stripe from "stripe";

import { env } from "../config/env";
import { ApiError } from "../middlewares/errorHandler";
import { Booking } from "../models/Booking";
import { Payment } from "../models/Payment";
import { success } from "../utils/apiResponse";
import { assertObjectId } from "../utils/ids";

export const paymentRoutes = Router();

function getBookingId(session: Stripe.Checkout.Session) {
  return session.metadata?.bookingId ?? session.client_reference_id ?? "";
}

function resolveTransactionId(session: Stripe.Checkout.Session) {
  if (typeof session.payment_intent === "string") {
    return session.payment_intent;
  }

  return session.payment_intent?.id ?? session.id;
}

paymentRoutes.post("/webhook", async (req, res, next) => {
  try {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new ApiError("Stripe webhook is not configured", 503);
    }

    const signature = req.headers["stripe-signature"];

    if (typeof signature !== "string") {
      throw new ApiError("Missing Stripe signature header", 400);
    }

    if (!Buffer.isBuffer(req.body)) {
      throw new ApiError("Webhook body must be raw JSON", 400);
    }

    // Signature verification is local; no Stripe API call is made here.
    const stripe = new Stripe(
      env.STRIPE_SECRET_KEY || "sk_test_webhook_signature_only",
    );

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw new ApiError("Invalid Stripe webhook signature", 400);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = getBookingId(session);

      if (bookingId && session.payment_status === "paid") {
        assertObjectId(bookingId, "booking id");

        const booking = await Booking.findOne({
          _id: bookingId,
          stripeSessionId: session.id,
        });

        if (booking && booking.paymentStatus !== "paid") {
          booking.paymentStatus = "paid";
          booking.bookingStatus = "confirmed";
          booking.transactionId = resolveTransactionId(session);
          await booking.save();

          await Payment.findOneAndUpdate(
            { bookingId: booking._id },
            {
              $set: {
                customerId: booking.customerId,
                ownerId: booking.ownerId,
                stripeSessionId: session.id,
                transactionId: booking.transactionId,
                amount:
                  session.amount_total !== null &&
                  session.amount_total !== undefined
                    ? session.amount_total / 100
                    : booking.totalAmount,
                currency: session.currency ?? "usd",
                status: "succeeded",
                paidAt: new Date(event.created * 1000),
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );
        }
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = getBookingId(session);

      if (bookingId) {
        assertObjectId(bookingId, "booking id");

        await Booking.updateOne(
          {
            _id: bookingId,
            stripeSessionId: session.id,
            paymentStatus: "pending",
          },
          {
            $set: {
              paymentStatus: "failed",
              bookingStatus: "cancelled",
            },
          },
        );
      }
    }

    return success(
      res,
      { received: true, type: event.type },
      "Webhook processed",
    );
  } catch (error) {
    return next(error);
  }
});
