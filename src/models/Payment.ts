import {
  model,
  Schema,
  Types,
  models,
  type Model,
} from "mongoose";

export interface IPayment {
  _id?: Types.ObjectId;
  bookingId: Types.ObjectId;
  customerId: string;
  ownerId: string;
  stripeSessionId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },
    customerId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    stripeSessionId: { type: String, required: true, unique: true },
    transactionId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "usd" },
    status: { type: String, required: true, default: "succeeded" },
    paidAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Payment: Model<IPayment> =
  (models.Payment as Model<IPayment>) ||
  model<IPayment>("Payment", paymentSchema);
