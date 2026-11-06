import type { Metadata } from "next";
import { HomeContent } from "@/components/site/home-content";
import { getPublicSite } from "@/lib/server/public-api";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSite();
  return { title: { absolute: `${site.hospitalName} · DocTrack` }, description: site.heroSubtitle };
}

export default async function HomePage() {
  const site = await getPublicSite();
  return <HomeContent site={site} />;
}
