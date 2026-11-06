import { cloudinaryImage } from "@/lib/cloudinary";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PublicDoctor } from "@/types/site";

/** Doctor photograph when one is on file, otherwise a calm initials tile. */
export function DoctorPhoto({ doctor, className }: { doctor: PublicDoctor; className?: string }) {
  if (doctor.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote CDN image (already resized by the CDN)
      <img src={cloudinaryImage(doctor.photoUrl, { width: 480, height: 600 })} alt={doctor.name} loading="lazy" className={cn("bg-muted object-cover", className)} />
    );
  }
  return (
    <div aria-hidden className={cn("relative flex items-center justify-center overflow-hidden bg-peach", className)}>
      <span className="absolute -right-8 -bottom-8 size-32 rounded-full bg-coral/40" />
      <span className="absolute -top-6 -left-6 size-20 rounded-full bg-ice" />
      <span className="relative flex aspect-square w-2/5 max-w-28 items-center justify-center rounded-full bg-white text-[clamp(1.25rem,2.5vw,2rem)] font-semibold tracking-tight text-slate-deep shadow-sm">
        {initials(doctor.name)}
      </span>
    </div>
  );
}
