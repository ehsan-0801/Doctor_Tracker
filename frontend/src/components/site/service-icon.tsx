import {
  Activity,
  Ambulance,
  Baby,
  Bone,
  Brain,
  Eye,
  HeartPulse,
  Microscope,
  Pill,
  ShieldPlus,
  Stethoscope,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { ServiceIcon } from "@/types/site";

export const SERVICE_ICON_MAP: Record<ServiceIcon, LucideIcon> = {
  heart: HeartPulse,
  brain: Brain,
  lungs: Wind,
  bone: Bone,
  baby: Baby,
  stethoscope: Stethoscope,
  pill: Pill,
  microscope: Microscope,
  ambulance: Ambulance,
  eye: Eye,
  shield: ShieldPlus,
  activity: Activity,
};

export function ServiceIconView({ icon, className }: { icon: ServiceIcon; className?: string }) {
  const Icon = SERVICE_ICON_MAP[icon] ?? Stethoscope;
  return <Icon className={className} aria-hidden />;
}
