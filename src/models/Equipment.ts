import {
  model,
  Schema,
  Types,
  models,
  type Model,
} from "mongoose";
import { EQUIPMENT_CATEGORIES } from "../constants/categories";
import {
  EQUIPMENT_STATUSES,
  RENTAL_TYPES,
  type EquipmentStatus,
  type RentalType,
} from "../constants/rental";

export interface OwnerInfo {
  name: string;
  email: string;
  image?: string;
}

export interface IEquipment {
  _id?: Types.ObjectId;
  seedKey?: string;
  ownerId: string;
  ownerInfo: OwnerInfo;
  name: string;
  description: string;
  category: string;
  location: string;
  price: number;
  rentalType: RentalType;
  quantity: number;
  availableQuantity: number;
  condition: string;
  brand: string;
  model: string;
  image: string;
  terms: string;
  status: EquipmentStatus;
  ratingAverage?: number;
  reviewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const equipmentSchema = new Schema<IEquipment>(
  {
    seedKey: { type: String, unique: true, sparse: true },
    ownerId: { type: String, required: true, index: true },
    ownerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      image: { type: String },
    },
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: EQUIPMENT_CATEGORIES,
      index: true,
    },
    location: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    rentalType: {
      type: String,
      required: true,
      enum: RENTAL_TYPES,
      index: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    availableQuantity: { type: Number, required: true, min: 0 },
    condition: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    image: { type: String, required: true },
    terms: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: EQUIPMENT_STATUSES,
      default: "pending",
      index: true,
    },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

equipmentSchema.index({ status: 1, createdAt: -1 });
equipmentSchema.index({ ownerId: 1, createdAt: -1 });

export const Equipment: Model<IEquipment> =
  (models.Equipment as Model<IEquipment>) ||
  model<IEquipment>("Equipment", equipmentSchema);
