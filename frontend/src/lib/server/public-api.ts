import "server-only";
import { cacheLife } from "next/cache";
import type { PublicDoctor, PublicSite } from "@/types/site";

const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

/** Shown if the API is unreachable (e.g. during a build), so pages still render. */
export const FALLBACK_SITE: PublicSite = {
  hospitalName: "DocTrack Medical Center",
  tagline: "Specialist care, coordinated.",
  heroTitle: "The right doctor, at the right time.",
  heroSubtitle:
    "Find specialists across our hospitals, see who is on our care team, and stay connected with the doctors looking after you.",
  about: "DocTrack brings specialists from several hospitals into one coordinated care network.",
  services: [],
  announcements: [],
  contact: { phone: "", emergencyPhone: "", email: "", address: "", hours: "" },
  homepage: { showStats: false, showDoctors: false },
  stats: null,
  featuredDoctors: [],
  specializations: [],
};

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/api${path}`, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const body = (await res.json()) as { success: boolean; data: T };
    return body.success ? body.data : null;
  } catch {
    return null;
  }
}

/** Public site content, cached on the server for about a minute. */
export async function getPublicSite(): Promise<PublicSite> {
  "use cache";
  cacheLife("minutes");
  return (await getJson<PublicSite>("/public/site")) ?? FALLBACK_SITE;
}

export async function getPublicDoctor(id: string): Promise<PublicDoctor | null> {
  "use cache";
  cacheLife("minutes");
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  return getJson<PublicDoctor>(`/public/doctors/${id}`);
}
