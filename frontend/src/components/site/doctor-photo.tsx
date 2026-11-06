import { cloudinaryImage } from "@/lib/cloudinary";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PublicDoctor } from "@/types/site";

/** Doctor photograph when one is on file, otherwise a calm initials tile. */
export function DoctorPhoto({ doctor, className }: { doctor: PublicDoctor; className?: string }) {
  if (doctor.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote CDN image (already resized by the CDN)
      <img src={cloudinaryImage(doctor.photoUrl, { width: 600, height: 450 })} alt={doctor.name} loading="lazy" className={cn("bg-muted object-cover", className)} />
    );
  }
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center bg-[linear-gradient(135deg,var(--accent),var(--info-soft))] text-2xl font-semibold text-accent-foreground",
        className,
      )}
    >
      {initials(doctor.name)}
    </div>
  );
}
