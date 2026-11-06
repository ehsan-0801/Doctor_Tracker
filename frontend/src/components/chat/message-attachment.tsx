import { FileText } from "lucide-react";
import { cloudinaryImage } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/types/tracking";

export const formatBytes = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/** Photo thumbnail (opens full size) or document card (opens in a new tab). */
export function MessageAttachment({ attachment, mine }: { attachment: ChatAttachment; mine: boolean }) {
  if (attachment.kind === "image") {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary-resized thumbnail */}
        <img
          src={cloudinaryImage(attachment.url, { width: 560 })}
          alt={attachment.name}
          width={attachment.width}
          height={attachment.height}
          loading="lazy"
          className="h-auto max-h-72 w-full max-w-[280px] object-cover"
        />
      </a>
    );
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        mine ? "border-primary-foreground/25 bg-primary-foreground/10 hover:bg-primary-foreground/15" : "bg-card hover:bg-accent",
      )}
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", mine ? "bg-primary-foreground/15" : "bg-accent text-accent-foreground")}>
        <FileText className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{attachment.name}</span>
        <span className={cn("block text-xs", mine ? "text-primary-foreground/75" : "text-muted-foreground")}>
          {attachment.name.split(".").pop()?.toUpperCase()} · {formatBytes(attachment.size)}
        </span>
      </span>
    </a>
  );
}
