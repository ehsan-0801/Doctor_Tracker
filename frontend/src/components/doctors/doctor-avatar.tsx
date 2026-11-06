import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

/** Doctor photo (Cloudinary-resized) when available, otherwise initials. */
export function DoctorAvatar({ name, photoUrl, className }: { name: string; photoUrl?: string; className?: string }) {
  return <UserAvatar name={name} photoUrl={photoUrl} className={cn("size-9", className)} />;
}
