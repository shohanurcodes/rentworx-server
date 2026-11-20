import mongoose from "mongoose";
import { ApiError } from "../middlewares/errorHandler";

export function assertObjectId(id: string, label = "id") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(`Invalid ${label}`, 400);
  }
}
