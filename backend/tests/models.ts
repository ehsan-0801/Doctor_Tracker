import { User } from "../src/models/User.js";
import { Doctor } from "../src/models/Doctor.js";
import { Patient } from "../src/models/Patient.js";
import { Session } from "../src/models/Session.js";
import { SiteSettings } from "../src/models/SiteSettings.js";
import { Location } from "../src/models/Location.js";
import { Presence, PresenceEvent } from "../src/models/Presence.js";
import { Conversation, Message } from "../src/models/Chat.js";
import { AuditEvent } from "../src/models/Audit.js";
import { Notification } from "../src/models/Notification.js";

export const all = [User, Session, Doctor, Patient, SiteSettings, Location, Presence, PresenceEvent, Conversation, Message, AuditEvent, Notification] as const;
export { AuditEvent, Conversation, Doctor, Notification, Location, Message, Patient, Presence, PresenceEvent, Session, User };
