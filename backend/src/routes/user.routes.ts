import { Router } from "express";
import * as users from "../controllers/user.controller.js";
import { requirePermission } from "../middleware/requireAuth.js";

export const userRouter = Router();
userRouter.use(requirePermission("users:manage"));
userRouter.get("/", users.list);
userRouter.post("/", users.create);
userRouter.patch("/:id", users.update);
userRouter.post("/:id/reset-password", users.resetPassword);
