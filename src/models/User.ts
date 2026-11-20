import {
  model,
  Schema,
  Types,
  models,
  type Model,
} from "mongoose";
import { USER_ROLES, type UserRole } from "../constants/rental";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  role: UserRole;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new Types.ObjectId(),
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: { type: Boolean, default: false },
    image: { type: String },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "customer",
      index: true,
    },
    phone: { type: String },
    address: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    collection: "user",
    strict: false,
    timestamps: false,
    versionKey: false,
  },
);

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", userSchema);
