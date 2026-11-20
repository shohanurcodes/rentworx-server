export const RENTAL_TYPES = ["daily", "weekly", "monthly"] as const;
export type RentalType = (typeof RENTAL_TYPES)[number];

export const EQUIPMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const USER_ROLES = ["customer", "owner", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
