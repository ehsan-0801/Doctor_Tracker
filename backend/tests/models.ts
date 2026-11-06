import { User } from "../src/models/User.js";
import { Doctor } from "../src/models/Doctor.js";
import { Patient } from "../src/models/Patient.js";
import { Session } from "../src/models/Session.js";

export const all = [User, Session, Doctor, Patient] as const;
export { Doctor, Patient, Session, User };
