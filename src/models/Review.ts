import {
  model,
  Schema,
  Types,
  models,
  type Model,
} from "mongoose";

export interface IReview {
  _id?: Types.ObjectId;
  seedKey?: string;
  customerId?: string;
  customerName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    seedKey: { type: String, unique: true, sparse: true },
    customerId: { type: String },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    isApproved: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Review: Model<IReview> =
  (models.Review as Model<IReview>) ||
  model<IReview>("Review", reviewSchema);
