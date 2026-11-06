import type { Request, Response } from "express";
import { currentUser } from "../middleware/requireAuth.js";
import * as userService from "../services/user.service.js";
import { recordAudit } from "../services/audit.service.js";
import { sendSuccess } from "../utils/response.js";
import { idParamsSchema } from "../validators/common.js";
import { createUserSchema, resetPasswordSchema, updateUserSchema, userListQuerySchema } from "../validators/user.validator.js";

export async function list(req: Request, res: Response) {
  const { data, pagination } = await userService.listUsers(userListQuerySchema.parse(req.query));
  sendSuccess(res, "Users retrieved successfully", data, { pagination });
}

export async function create(req: Request, res: Response) {
  const input = createUserSchema.parse(req.body);
  const user = await userService.createUser(input);
  await recordAudit(req, currentUser(res), { action: "user.create", entityType: "user", entityId: String(user._id), entityLabel: user.email, changes: { name: input.name, role: input.role, assignedDoctors: input.assignedDoctorIds?.length } });
  sendSuccess(res, "User created successfully", user, { status: 201 });
}

export async function update(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateUserSchema.parse(req.body);
  const user = await userService.updateUser(id, input, currentUser(res).id);
  const action = input.active === false ? "user.deactivate" : input.active === true ? "user.reactivate" : "user.update";
  await recordAudit(req, currentUser(res), { action, entityType: "user", entityId: id, entityLabel: user.email, changes: input });
  sendSuccess(res, "User updated successfully", user);
}

export async function resetPassword(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const { password } = resetPasswordSchema.parse(req.body);
  await userService.resetPassword(id, password);
  await recordAudit(req, currentUser(res), { action: "user.reset_password", entityType: "user", entityId: id });
  sendSuccess(res, "Password reset; the user has been signed out everywhere", null);
}
