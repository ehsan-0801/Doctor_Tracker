import type { Request, Response } from "express";
import { currentUser } from "../middleware/requireAuth.js";
import * as userService from "../services/user.service.js";
import { sendSuccess } from "../utils/response.js";
import { idParamsSchema } from "../validators/common.js";
import { createUserSchema, resetPasswordSchema, updateUserSchema, userListQuerySchema } from "../validators/user.validator.js";

export async function list(req: Request, res: Response) {
  const { data, pagination } = await userService.listUsers(userListQuerySchema.parse(req.query));
  sendSuccess(res, "Users retrieved successfully", data, { pagination });
}

export async function create(req: Request, res: Response) {
  const user = await userService.createUser(createUserSchema.parse(req.body));
  sendSuccess(res, "User created successfully", user, { status: 201 });
}

export async function update(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const user = await userService.updateUser(id, updateUserSchema.parse(req.body), currentUser(res).id);
  sendSuccess(res, "User updated successfully", user);
}

export async function resetPassword(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const { password } = resetPasswordSchema.parse(req.body);
  await userService.resetPassword(id, password);
  sendSuccess(res, "Password reset; the user has been signed out everywhere", null);
}
