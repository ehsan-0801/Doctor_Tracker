import type { Request, Response } from "express";
import { z } from "zod";
import * as doctorService from "../services/doctor.service.js";
import * as patientService from "../services/patient.service.js";
import { sendSuccess } from "../utils/response.js";
import { idParamsSchema, optionalTrimmed } from "../validators/common.js";
import { createDoctorSchema, doctorListQuerySchema } from "../validators/doctor.validator.js";
import {
  createDoctorPatientSchema,
  doctorPatientParamsSchema,
  patientListQuerySchema,
} from "../validators/patient.validator.js";

const optionsQuerySchema = z.object({
  search: optionalTrimmed(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function list(req: Request, res: Response) {
  const { data, pagination } = await doctorService.listDoctors(doctorListQuerySchema.parse(req.query));
  sendSuccess(res, "Doctors retrieved successfully", data, { pagination });
}

export async function create(req: Request, res: Response) {
  const doctor = await doctorService.createDoctor(createDoctorSchema.parse(req.body));
  sendSuccess(res, "Doctor created successfully", doctor, { status: 201 });
}

export async function getById(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, "Doctor retrieved successfully", await doctorService.getDoctorById(id));
}

export async function filterOptions(_req: Request, res: Response) {
  sendSuccess(res, "Doctor filters retrieved successfully", await doctorService.getDoctorFilterOptions());
}

export async function options(req: Request, res: Response) {
  const { search, limit } = optionsQuerySchema.parse(req.query);
  sendSuccess(res, "Doctor options retrieved successfully", await doctorService.listDoctorOptions(search, limit));
}

export async function listPatients(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const query = patientListQuerySchema.parse(req.query);
  await doctorService.assertDoctorExists(id);
  const { data, pagination } = await patientService.listPatients(query, id);
  sendSuccess(res, "Doctor's patients retrieved successfully", data, { pagination });
}

export async function addPatient(req: Request, res: Response) {
  const { id } = idParamsSchema.parse(req.params);
  const body = createDoctorPatientSchema.parse(req.body);
  const patient = await patientService.createPatient({ ...body, doctorId: id });
  sendSuccess(res, "Patient added to doctor successfully", patient, { status: 201 });
}

export async function removePatient(req: Request, res: Response) {
  const { id, patientId } = doctorPatientParamsSchema.parse(req.params);
  const patient = await patientService.unassignPatient(id, patientId);
  sendSuccess(res, "Patient removed from doctor's list", patient);
}
