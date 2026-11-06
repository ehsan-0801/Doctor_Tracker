import { Schema, model, type InferSchemaType } from "mongoose";

/** Icons the homepage can render for services (kept in sync with the frontend icon map). */
export const SERVICE_ICONS = ["heart", "brain", "lungs", "bone", "baby", "stethoscope", "pill", "microscope", "ambulance", "eye", "shield", "activity"] as const;

const serviceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 240 },
    titleBn: { type: String, trim: true, maxlength: 60, default: "" },
    descriptionBn: { type: String, trim: true, maxlength: 240, default: "" },
    icon: { type: String, enum: SERVICE_ICONS, default: "stethoscope" },
  },
  { _id: false },
);

const announcementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    body: { type: String, trim: true, maxlength: 400, default: "" },
    titleBn: { type: String, trim: true, maxlength: 100, default: "" },
    bodyBn: { type: String, trim: true, maxlength: 400, default: "" },
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

/**
 * Singleton document (key = "site") holding the public website content that
 * administrators edit in Site settings.
 */
const siteSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "site" },
    hospitalName: { type: String, trim: true, maxlength: 120, default: "DocTrack Medical Center" },
    tagline: { type: String, trim: true, maxlength: 160, default: "Specialist care, coordinated." },
    heroTitle: { type: String, trim: true, maxlength: 120, default: "The right doctor, at the right time." },
    heroSubtitle: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "Find specialists across our hospitals, see who is on our care team, and stay connected with the doctors looking after you.",
    },
    about: {
      type: String,
      trim: true,
      maxlength: 1500,
      default:
        "DocTrack Medical Center brings specialists from several hospitals into one coordinated care network. Every patient has a dedicated doctor, and our care teams track progress so nothing falls through the cracks.",
    },
    // Optional Bangla versions; the public site falls back to English when empty.
    hospitalNameBn: { type: String, trim: true, maxlength: 120, default: "ডকট্র্যাক মেডিকেল সেন্টার" },
    taglineBn: { type: String, trim: true, maxlength: 160, default: "বিশেষজ্ঞ সেবা, সমন্বিতভাবে।" },
    heroTitleBn: { type: String, trim: true, maxlength: 120, default: "সঠিক সময়ে, সঠিক ডাক্তার।" },
    heroSubtitleBn: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "আমাদের হাসপাতালগুলোর বিশেষজ্ঞ খুঁজুন, আমাদের চিকিৎসক দলকে জানুন এবং আপনার চিকিৎসা যাঁরা করছেন তাঁদের সাথে যুক্ত থাকুন।",
    },
    aboutBn: {
      type: String,
      trim: true,
      maxlength: 1500,
      default:
        "ডকট্র্যাক মেডিকেল সেন্টার একাধিক হাসপাতালের বিশেষজ্ঞদের একটি সমন্বিত সেবা নেটওয়ার্কে যুক্ত করে। প্রতিটি রোগীর জন্য একজন নির্দিষ্ট ডাক্তার থাকেন এবং আমাদের চিকিৎসক দল নিয়মিত অগ্রগতি অনুসরণ করে।",
    },
    services: { type: [serviceSchema], default: undefined },
    announcements: { type: [announcementSchema], default: [] },
    contact: {
      phone: { type: String, trim: true, maxlength: 40, default: "+1 555 010 0000" },
      emergencyPhone: { type: String, trim: true, maxlength: 40, default: "+1 555 010 0911" },
      email: { type: String, trim: true, maxlength: 254, default: "care@doctrack.example" },
      address: { type: String, trim: true, maxlength: 200, default: "120 Riverside Avenue, Springfield" },
      hours: { type: String, trim: true, maxlength: 120, default: "Mon–Sat 8:00–20:00 · Emergency 24/7" },
      addressBn: { type: String, trim: true, maxlength: 200, default: "" },
      hoursBn: { type: String, trim: true, maxlength: 120, default: "শনি–বৃহস্পতি সকাল ৮টা–রাত ৮টা · জরুরি সেবা ২৪/৭" },
    },
    homepage: {
      showStats: { type: Boolean, default: true },
      showDoctors: { type: Boolean, default: true },
      featuredDoctorIds: { type: [{ type: Schema.Types.ObjectId, ref: "Doctor" }], default: [] },
    },
  },
  { timestamps: true },
);

export type SiteSettingsDocument = InferSchemaType<typeof siteSettingsSchema>;
export const SiteSettings = model("SiteSettings", siteSettingsSchema, "site_settings");

export const DEFAULT_SERVICES = [
  { title: "Cardiology", description: "Heart health checks, hypertension management and long-term cardiac care.", icon: "heart", titleBn: "কার্ডিওলজি", descriptionBn: "হৃদ্‌রোগ পরীক্ষা, উচ্চ রক্তচাপ নিয়ন্ত্রণ ও দীর্ঘমেয়াদি হৃদ্‌রোগ চিকিৎসা।" },
  { title: "Neurology", description: "Diagnosis and treatment of migraine, epilepsy and other neurological conditions.", icon: "brain", titleBn: "নিউরোলজি", descriptionBn: "মাইগ্রেন, মৃগীরোগ ও অন্যান্য স্নায়ুরোগের নির্ণয় ও চিকিৎসা।" },
  { title: "Pulmonology", description: "Asthma, COPD and respiratory care with ongoing monitoring.", icon: "lungs", titleBn: "পালমোনোলজি", descriptionBn: "হাঁপানি, সিওপিডি ও শ্বাসযন্ত্রের রোগের নিয়মিত পর্যবেক্ষণসহ চিকিৎসা।" },
  { title: "Endocrinology", description: "Diabetes and thyroid care plans tailored to each patient.", icon: "activity", titleBn: "এন্ডোক্রিনোলজি", descriptionBn: "প্রতিটি রোগীর জন্য উপযোগী ডায়াবেটিস ও থাইরয়েড চিকিৎসা পরিকল্পনা।" },
  { title: "Rheumatology", description: "Arthritis and autoimmune conditions, managed with care teams.", icon: "bone", titleBn: "রিউমাটোলজি", descriptionBn: "আর্থ্রাইটিস ও অটোইমিউন রোগের দলগত চিকিৎসা।" },
  { title: "Mental health", description: "Psychiatric support for anxiety, depression and wellbeing.", icon: "shield", titleBn: "মানসিক স্বাস্থ্য", descriptionBn: "উদ্বেগ, বিষণ্নতা ও মানসিক সুস্থতার জন্য মনোরোগ বিশেষজ্ঞের সহায়তা।" },
] as const;
