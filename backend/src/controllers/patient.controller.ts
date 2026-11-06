import type { Request, Response } from "express";
import * as patientService from "../services/patient.service.js";
import { currentUser } from "../middleware/requireAuth.js";
import { recordAudit } from "../services/audit.service.js";
import { sendSuccess } from "../utils/response.js";
import { idParamsSchema } from "../validators/common.js";
import { createPatientSchema, patientListQuerySchema, updatePatientSchema } from "../validators/patient.validator.js";

export async function list(req: Request, res: Response) {
  const { data, pagination } = await patientService.listPatients(patientListQuerySchema.parse(req.query));
  sendSuccess(res, "Patients retrieved successfully", data, { pagination });
}

export async function create(req: Request, res: Response) {
  const input = createPatientSchema.parse(req.body);
  const patient = await patientService.createPatient(input);
  await recordAudit(req, currentUser(res), { action: "patient.create", entityType: "patient", entityId: String(patient._id), entityLabel: patient.name, changes: { ...input, doctor: (patient.doctor as { name?: string } | null)?.name } });
  sendSuccess(res, "Patient created successfully", patient, { status: 201 });
}

export async function getById(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, "Patient retrieved successfully", await patientService.getPatientById(id));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const input = updatePatientSchema.parse(req.body);
  const patient = await patientService.updatePatient(id, input);
  await recordAudit(req, currentUser(res), { action: "patient.update", entityType: "patient", entityId: id, entityLabel: patient.name, changes: input });
  sendSuccess(res, "Patient updated successfully", patient);
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const patient = await patientService.getPatientById(id);
  await patientService.deletePatient(id);
  await recordAudit(req, currentUser(res), { action: "patient.delete", entityType: "patient", entityId: id, entityLabel: patient.name, changes: { condition: patient.condition, doctor: (patient.doctor as { name?: string } | null)?.name ?? null } });
  sendSuccess(res, "Patient deleted successfully", null);
}

export async function conditions(_req: Request, res: Response) {
  sendSuccess(res, "Conditions retrieved successfully", await patientService.listConditions());
}

export async function issueAccessToken(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const { token, issuedAt, patientName } = await patientService.issueAccessToken(id);
  await recordAudit(req, currentUser(res), { action: "patient.token_issue", entityType: "patient", entityId: id, entityLabel: patientName });
  // The plain token is shown once; keep it out of every cache.
  res.set("Cache-Control", "no-store");
  sendSuccess(res, "Access token issued", { token, issuedAt }, { status: 201 });
}

export async function revokeAccessToken(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const patient = await patientService.revokeAccessToken(id);
  await recordAudit(req, currentUser(res), { action: "patient.token_revoke", entityType: "patient", entityId: id, entityLabel: patient.name });
  sendSuccess(res, "Access token revoked", null);
}
