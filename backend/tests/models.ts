import { User } from "../src/models/User.js";
import { Doctor } from "../src/models/Doctor.js";
import { Patient } from "../src/models/Patient.js";
import { Session } from "../src/models/Session.js";
import { SiteSettings } from "../src/models/SiteSettings.js";

export const all = [User, Session, Doctor, Patient, SiteSettings] as const;
export { Doctor, Patient, Session, User };
