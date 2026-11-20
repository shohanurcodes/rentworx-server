import {
  model,
  Schema,
  Types,
  models,
  type Model,
} from "mongoose";
import {
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  type BookingStatus,
  type PaymentStatus,
} from "../constants/rental";

export interface BookingSnapshot {
  name: string;
  image?: string;
  location?: string;
  category?: string;
  email?: string;
}

export interface IBooking {
  _id?: Types.ObjectId;
  customerId: string;
  customerInfo: BookingSnapshot;
  ownerId: string;
  ownerInfo: BookingSnapshot;
  equipmentId: Types.ObjectId;
  equipmentInfo: BookingSnapshot;
  startDate: Date;
  endDate: Date;
  rentalType: string;
  duration: number;
  requiredQuantity: number;
  unitPrice: number;
  totalAmount: number;
  contactNumber: string;
  deliveryAddress: string;
  notes?: string;
  bookingDate: Date;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  stripeSessionId?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const snapshotSchema = new Schema<BookingSnapshot>(
  {
    name: { type: String, required: true },
    image: { type: String },
    location: { type: String },
    category: { type: String },
    email: { type: String },
  },
  { _id: false },
);

const bookingSchema = new Schema<IBooking>(
  {
    customerId: { type: String, required: true, index: true },
    customerInfo: { type: snapshotSchema, required: true },
    ownerId: { type: String, required: true, index: true },
    ownerInfo: { type: snapshotSchema, required: true },
    equipmentId: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
      index: true,
    },
    equipmentInfo: { type: snapshotSchema, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rentalType: { type: String, required: true },
    duration: { type: Number, required: true, min: 1 },
    requiredQuantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    contactNumber: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    notes: { type: String },
    bookingDate: { type: Date, default: Date.now },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
      index: true,
    },
    bookingStatus: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "pending",
      index: true,
    },
    stripeSessionId: { type: String, index: true },
    transactionId: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ ownerId: 1, createdAt: -1 });

export const Booking: Model<IBooking> =
  (models.Booking as Model<IBooking>) ||
  model<IBooking>("Booking", bookingSchema);
