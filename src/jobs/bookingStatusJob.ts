import cron from "node-cron";

import { Booking } from "../models/Booking";

/** Every 15 minutes. Also runs once on boot to catch bookings missed while asleep. */
export const BOOKING_STATUS_SCHEDULE = "*/15 * * * *";

export async function completeExpiredBookings(now = new Date()) {
  const result = await Booking.updateMany(
    {
      bookingStatus: { $in: ["pending", "confirmed"] },
      paymentStatus: "paid",
      endDate: { $lt: now },
    },
    { $set: { bookingStatus: "completed" } },
  );

  return result.modifiedCount;
}

async function runOnce() {
  try {
    const completed = await completeExpiredBookings();

    if (completed > 0) {
      console.log(`[cron] completed ${completed} expired booking(s)`);
    }
  } catch (error) {
    console.error("[cron] booking status update failed:", error);
  }
}

export function startBookingStatusJob() {
  void runOnce();

  return cron.schedule(BOOKING_STATUS_SCHEDULE, () => {
    void runOnce();
  });
}
