import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken";
import { success } from "../utils/apiResponse";

export const authRoutes = Router();

authRoutes.get("/me", verifyToken, (req, res) => {
  return success(res, req.user, "Authenticated user retrieved");
});
