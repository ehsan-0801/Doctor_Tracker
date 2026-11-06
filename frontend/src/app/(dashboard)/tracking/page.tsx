import type { Metadata } from "next";
import { TrackingView } from "@/components/tracking/tracking-view";

export const metadata: Metadata = { title: "Live tracking" };

export default function TrackingPage() {
  return <TrackingView />;
}
