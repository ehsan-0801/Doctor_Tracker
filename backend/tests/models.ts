import { Admin } from "../src/models/Admin.js";
import { Doctor } from "../src/models/Doctor.js";
import { Patient } from "../src/models/Patient.js";
import { Session } from "../src/models/Session.js";

export const all = [Admin, Session, Doctor, Patient] as const;
export { Admin, Doctor, Patient, Session };
