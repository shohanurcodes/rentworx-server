import {
  model,
  Schema,
  Types,
  models,
  type Model,
} from "mongoose";

export interface IFavorite {
  _id?: Types.ObjectId;
  customerId: string;
  equipmentId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    customerId: { type: String, required: true },
    equipmentId: {
      type: Schema.Types.ObjectId,
      ref: "Equipment",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

favoriteSchema.index({ customerId: 1, equipmentId: 1 }, { unique: true });

export const Favorite: Model<IFavorite> =
  (models.Favorite as Model<IFavorite>) ||
  model<IFavorite>("Favorite", favoriteSchema);
