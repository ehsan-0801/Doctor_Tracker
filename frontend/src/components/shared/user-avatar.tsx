import { cloudinaryImage } from "@/lib/cloudinary";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Photo when available (Cloudinary-resized), otherwise initials. */
export function UserAvatar({ name, photoUrl, className }: { name: string; photoUrl?: string; className?: string }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- CDN thumbnail
      <img src={cloudinaryImage(photoUrl, { width: 96, height: 96 })} alt="" className={cn("size-8 shrink-0 rounded-full object-cover", className)} />
    );
  }
  return (
    <span aria-hidden className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground", className)}>
      {initials(name)}
    </span>
  );
}
