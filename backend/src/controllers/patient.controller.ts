import type { Request, Response } from "express";
import * as patientService from "../services/patient.service.js";
import { sendSuccess } from "../utils/response.js";
import { idParamsSchema } from "../validators/common.js";
import { createPatientSchema, patientListQuerySchema, updatePatientSchema } from "../validators/patient.validator.js";

export async function list(req: Request, res: Response) {
  const { data, pagination } = await patientService.listPatients(patientListQuerySchema.parse(req.query));
  sendSuccess(res, "Patients retrieved successfully", data, { pagination });
}

export async function create(req: Request, res: Response) {
  const patient = await patientService.createPatient(createPatientSchema.parse(req.body));
  sendSuccess(res, "Patient created successfully", patient, { status: 201 });
}

export async function getById(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, "Patient retrieved successfully", await patientService.getPatientById(id));
}

export async function update(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const patient = await patientService.updatePatient(id, updatePatientSchema.parse(req.body));
  sendSuccess(res, "Patient updated successfully", patient);
}

export async function remove(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  await patientService.deletePatient(id);
  sendSuccess(res, "Patient deleted successfully", null);
}

export async function conditions(_req: Request, res: Response) {
  sendSuccess(res, "Conditions retrieved successfully", await patientService.listConditions());
}
