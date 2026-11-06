/** Interface text for the public website. Admin-managed content has its own Bangla fields. */
export const dictionaries = {
  en: {
    languageName: "English",
    switchLanguage: "Language",
    nav: { home: "Home", findDoctor: "Find a doctor", status: "My status", services: "Services", about: "About", contact: "Contact" },
    openMenu: "Open menu",
    closeMenu: "Close menu",
    staffSignIn: "Staff sign in",
    dashboard: "Dashboard",
    emergency: "Emergency",
    findDoctor: "Find a doctor",
    contactUs: "Contact us",
    call: "Call",
    trust: { specialists: "specialists", hospitals: "partner hospitals", emergency: "24/7 emergency line", live: "Live figures from our records" },
    coordinatedCare: "Coordinated care",
    coordinatedCareText: "One doctor, one care record",
    stats: { title: "Our care network today", live: "Live", updated: "updated", doctors: "Specialist doctors", specialities: "Specialities", hospitals: "Partner hospitals" },
    services: { eyebrow: "Services", title: "Specialist care under one network" },
    doctors: { eyebrow: "Our doctors", title: "Meet our specialists", viewAll: "View all doctors", viewProfile: "View profile" },
    about: { eyebrow: "About us" },
    steps: [
      { title: "Find your specialist", text: "Browse doctors by speciality and hospital across our network." },
      { title: "Get a dedicated doctor", text: "Our front desk registers you and assigns the right specialist." },
      { title: "Track your progress", text: "Your doctor records each update so your care team stays in sync." },
    ],
    step: "Step",
    contact: {
      title: "Need care? We are here to help.",
      text: "Call the front desk to register or speak to a care coordinator. For emergencies, call our 24/7 line.",
    },
    footer: { explore: "Explore", contact: "Contact", aboutUs: "About us", signIn: "Staff & doctor sign in", powered: "Powered by DocTrack. Video: Mixkit (free license)." },
    directory: {
      title: "Find a doctor",
      description: "Browse our specialists by speciality and hospital. Contact the front desk to be registered with a doctor.",
      searchLabel: "Search doctors",
      searchPlaceholder: "Search by name, speciality or hospital…",
      speciality: "Speciality",
      allSpecialities: "All specialities",
      found: (n: number) => `${n} doctor${n === 1 ? "" : "s"} found`,
      noMatch: "No doctors match your search",
      noMatchHint: "Try another name or speciality.",
      errorTitle: "Unable to load doctors",
      retry: "Try again",
    },
    profile: {
      allDoctors: "All doctors",
      bio: (name: string, spec: string, hospital: string, network: string) =>
        `${name} is part of the ${spec.toLowerCase()} team at ${hospital}, within the ${network} care network. Patients are registered with a doctor by our front desk, and each visit and condition update is recorded in their care record.`,
      see: (name: string) => `See ${name}`,
      seeText: "Call the front desk to register as a patient or to be referred to this doctor.",
      qualifications: "Qualifications",
    },
    patientStatus: {
      eyebrow: "Patient status",
      title: "Check your current condition",
      description: "Enter your full name and the access token you received at the hospital front desk.",
      nameLabel: "Full name",
      namePlaceholder: "As registered at the hospital",
      tokenLabel: "Access token",
      tokenHint: "12 letters and numbers, for example ABCD-EFGH-JKMN",
      nameRequired: "Enter your full name",
      tokenRequired: "Enter the access token from the front desk",
      submit: "Check status",
      checking: "Checking…",
      privacy: "Keep your token private. Lost it? Ask the front desk for a new one; the old token then stops working.",
      notFound: "No record matches that name and token. Check both and try again.",
      tooMany: "Too many attempts. Please wait 15 minutes and try again.",
      failed: "We could not check your status right now. Please try again.",
      resultFor: (name: string) => `Status for ${name}`,
      condition: "Current condition",
      doctor: "Your doctor",
      noDoctor: "A doctor has not been assigned yet. The front desk will contact you.",
      viewProfile: "View doctor profile",
      registered: "Registered",
      updated: "Last updated",
      refresh: "Refresh",
      checkAnother: "Check another patient",
    },
    pagination: {
      showing: (from: string, to: string, total: string) => `Showing ${from}–${to} of ${total}`,
      previous: "Previous",
      next: "Next",
      page: (p: number, total: number) => `Page ${p} of ${total}`,
    },
  },
  bn: {
    languageName: "বাংলা",
    switchLanguage: "ভাষা",
    nav: { home: "হোম", findDoctor: "ডাক্তার খুঁজুন", status: "আমার অবস্থা", services: "সেবাসমূহ", about: "আমাদের সম্পর্কে", contact: "যোগাযোগ" },
    openMenu: "মেনু খুলুন",
    closeMenu: "মেনু বন্ধ করুন",
    staffSignIn: "স্টাফ লগইন",
    dashboard: "ড্যাশবোর্ড",
    emergency: "জরুরি",
    findDoctor: "ডাক্তার খুঁজুন",
    contactUs: "যোগাযোগ করুন",
    call: "কল করুন",
    trust: { specialists: "জন বিশেষজ্ঞ", hospitals: "টি সহযোগী হাসপাতাল", emergency: "২৪/৭ জরুরি সেবা", live: "আমাদের রেকর্ড থেকে সরাসরি তথ্য" },
    coordinatedCare: "সমন্বিত চিকিৎসা",
    coordinatedCareText: "একজন ডাক্তার, একটি চিকিৎসা রেকর্ড",
    stats: { title: "আজ আমাদের সেবা নেটওয়ার্ক", live: "সরাসরি", updated: "হালনাগাদ", doctors: "বিশেষজ্ঞ ডাক্তার", specialities: "বিশেষায়িত বিভাগ", hospitals: "সহযোগী হাসপাতাল" },
    services: { eyebrow: "সেবাসমূহ", title: "এক নেটওয়ার্কে বিশেষজ্ঞ চিকিৎসা" },
    doctors: { eyebrow: "আমাদের ডাক্তার", title: "আমাদের বিশেষজ্ঞদের সাথে পরিচিত হোন", viewAll: "সব ডাক্তার দেখুন", viewProfile: "প্রোফাইল দেখুন" },
    about: { eyebrow: "আমাদের সম্পর্কে" },
    steps: [
      { title: "আপনার বিশেষজ্ঞ খুঁজুন", text: "আমাদের নেটওয়ার্কে বিভাগ ও হাসপাতাল অনুযায়ী ডাক্তার দেখুন।" },
      { title: "একজন নির্দিষ্ট ডাক্তার পান", text: "ফ্রন্ট ডেস্ক আপনাকে নিবন্ধন করে উপযুক্ত বিশেষজ্ঞ নির্ধারণ করে।" },
      { title: "আপনার অগ্রগতি জানুন", text: "আপনার ডাক্তার প্রতিটি হালনাগাদ লিখে রাখেন, যাতে চিকিৎসক দল সমন্বিত থাকে।" },
    ],
    step: "ধাপ",
    contact: {
      title: "চিকিৎসা প্রয়োজন? আমরা সাহায্য করতে প্রস্তুত।",
      text: "নিবন্ধন বা সেবা সমন্বয়কের সাথে কথা বলতে ফ্রন্ট ডেস্কে কল করুন। জরুরি প্রয়োজনে আমাদের ২৪/৭ নম্বরে কল করুন।",
    },
    footer: { explore: "দেখুন", contact: "যোগাযোগ", aboutUs: "আমাদের সম্পর্কে", signIn: "স্টাফ ও ডাক্তার লগইন", powered: "ডকট্র্যাক দ্বারা পরিচালিত। ভিডিও: Mixkit (ফ্রি লাইসেন্স)।" },
    directory: {
      title: "ডাক্তার খুঁজুন",
      description: "বিভাগ ও হাসপাতাল অনুযায়ী আমাদের বিশেষজ্ঞদের দেখুন। ডাক্তারের কাছে নিবন্ধনের জন্য ফ্রন্ট ডেস্কে যোগাযোগ করুন।",
      searchLabel: "ডাক্তার খুঁজুন",
      searchPlaceholder: "নাম, বিভাগ বা হাসপাতাল দিয়ে খুঁজুন…",
      speciality: "বিভাগ",
      allSpecialities: "সব বিভাগ",
      found: (n: number) => `${toBnDigits(n)} জন ডাক্তার পাওয়া গেছে`,
      noMatch: "আপনার খোঁজের সাথে মেলে এমন কোনো ডাক্তার নেই",
      noMatchHint: "অন্য নাম বা বিভাগ দিয়ে চেষ্টা করুন।",
      errorTitle: "ডাক্তারের তালিকা লোড করা যায়নি",
      retry: "আবার চেষ্টা করুন",
    },
    profile: {
      allDoctors: "সব ডাক্তার",
      bio: (name: string, spec: string, hospital: string, network: string) =>
        `${name} ${network} নেটওয়ার্কের অংশ হিসেবে ${hospital}-এর ${spec} দলে কাজ করেন। ফ্রন্ট ডেস্ক রোগীদের ডাক্তারের কাছে নিবন্ধন করে এবং প্রতিটি ভিজিট ও অবস্থার হালনাগাদ চিকিৎসা রেকর্ডে সংরক্ষিত থাকে।`,
      see: (name: string) => `${name}-এর সাথে দেখা করুন`,
      seeText: "রোগী হিসেবে নিবন্ধন বা এই ডাক্তারের কাছে রেফারেলের জন্য ফ্রন্ট ডেস্কে কল করুন।",
      qualifications: "যোগ্যতা",
    },
    patientStatus: {
      eyebrow: "রোগীর অবস্থা",
      title: "আপনার বর্তমান অবস্থা দেখুন",
      description: "আপনার পূর্ণ নাম এবং হাসপাতালের ফ্রন্ট ডেস্ক থেকে পাওয়া অ্যাক্সেস টোকেন লিখুন।",
      nameLabel: "পূর্ণ নাম",
      namePlaceholder: "হাসপাতালে নিবন্ধিত নাম",
      tokenLabel: "অ্যাক্সেস টোকেন",
      tokenHint: "১২টি অক্ষর ও সংখ্যা, যেমন ABCD-EFGH-JKMN",
      nameRequired: "আপনার পূর্ণ নাম লিখুন",
      tokenRequired: "ফ্রন্ট ডেস্ক থেকে পাওয়া অ্যাক্সেস টোকেন লিখুন",
      submit: "অবস্থা দেখুন",
      checking: "যাচাই করা হচ্ছে…",
      privacy: "আপনার টোকেন গোপন রাখুন। হারিয়ে গেলে ফ্রন্ট ডেস্ক থেকে নতুন টোকেন নিন; তখন পুরোনো টোকেন আর কাজ করবে না।",
      notFound: "এই নাম ও টোকেনের সাথে কোনো রেকর্ড মেলেনি। দুটোই যাচাই করে আবার চেষ্টা করুন।",
      tooMany: "অনেকবার চেষ্টা করা হয়েছে। ১৫ মিনিট পর আবার চেষ্টা করুন।",
      failed: "এই মুহূর্তে আপনার অবস্থা যাচাই করা যাচ্ছে না। আবার চেষ্টা করুন।",
      resultFor: (name: string) => `${name}-এর অবস্থা`,
      condition: "বর্তমান অবস্থা",
      doctor: "আপনার ডাক্তার",
      noDoctor: "এখনো কোনো ডাক্তার নির্ধারণ করা হয়নি। ফ্রন্ট ডেস্ক আপনার সাথে যোগাযোগ করবে।",
      viewProfile: "ডাক্তারের প্রোফাইল দেখুন",
      registered: "নিবন্ধন",
      updated: "সর্বশেষ হালনাগাদ",
      refresh: "রিফ্রেশ",
      checkAnother: "অন্য রোগীর অবস্থা দেখুন",
    },
    pagination: {
      showing: (from: string, to: string, total: string) => `মোট ${total}-এর মধ্যে ${from}–${to} দেখানো হচ্ছে`,
      previous: "আগের",
      next: "পরের",
      page: (p: number, total: number) => `পৃষ্ঠা ${toBnDigits(p)} / ${toBnDigits(total)}`,
    },
  },
} as const;

export type Lang = keyof typeof dictionaries;
export type Dictionary = (typeof dictionaries)["en"];

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export function toBnDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]!);
}

/** Number formatting per language (Bangla digits for "bn"). */
export function formatNumberFor(lang: Lang, value: number): string {
  return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US").format(value);
}

/** Pick the Bangla variant of a content field when present, else English. */
export function localized(lang: Lang, en: string, bn?: string): string {
  return lang === "bn" && bn?.trim() ? bn : en;
}
