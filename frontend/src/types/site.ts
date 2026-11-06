export const SERVICE_ICONS = ["heart", "brain", "lungs", "bone", "baby", "stethoscope", "pill", "microscope", "ambulance", "eye", "shield", "activity"] as const;
export type ServiceIcon = (typeof SERVICE_ICONS)[number];

export interface SiteService {
  title: string;
  description: string;
  titleBn?: string;
  descriptionBn?: string;
  icon: ServiceIcon;
}

export interface SiteAnnouncement {
  title: string;
  body: string;
  titleBn?: string;
  bodyBn?: string;
  active: boolean;
}

export interface SiteContact {
  phone: string;
  emergencyPhone: string;
  email: string;
  address: string;
  hours: string;
  addressBn?: string;
  hoursBn?: string;
}

/** Optional Bangla versions of the top-level content fields. */
export interface SiteContentBn {
  hospitalNameBn?: string;
  taglineBn?: string;
  heroTitleBn?: string;
  heroSubtitleBn?: string;
  aboutBn?: string;
}

export interface PublicDoctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  qualifications?: string;
  photoUrl?: string;
}

export interface PublicSite extends SiteContentBn {
  hospitalName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  about: string;
  services: SiteService[];
  announcements: SiteAnnouncement[];
  contact: SiteContact;
  homepage: { showStats: boolean; showDoctors: boolean };
  stats: { doctors: number; specializations: number; hospitals: number } | null;
  featuredDoctors: PublicDoctor[];
  specializations: string[];
  updatedAt?: string;
}

/** Admin-editable settings (GET/PUT /api/settings). */
export interface SiteSettings extends SiteContentBn {
  hospitalName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  about: string;
  services: SiteService[];
  announcements: SiteAnnouncement[];
  contact: SiteContact;
  homepage: { showStats: boolean; showDoctors: boolean; featuredDoctorIds: string[] };
  /** Returned by GET only: names for the featured doctor ids. */
  featuredDoctors?: { _id: string; name: string; specialization: string }[];
  updatedAt?: string;
}
