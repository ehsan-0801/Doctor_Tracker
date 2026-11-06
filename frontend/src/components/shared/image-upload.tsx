"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { uploadsApi } from "@/lib/api/endpoints";
import { cloudinaryImage } from "@/lib/cloudinary";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Uploads an image straight to Cloudinary using a short-lived signature from
 * the API (the secret stays on the server), then reports the https URL.
 */
export function ImageUpload({
  id,
  value,
  onChange,
  purpose,
  label,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  purpose: "doctors" | "site";
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (!ACCEPT.split(",").includes(file.type)) return setError("Choose a JPG, PNG or WebP image.");
    if (file.size > MAX_BYTES) return setError("Image must be 5 MB or smaller.");

    try {
      setProgress(0);
      const sig = await uploadsApi.signature(purpose);
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      form.append("allowed_formats", sig.allowed_formats);

      // XHR (not fetch) for upload progress.
      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", sig.uploadUrl);
        xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => {
          const body = JSON.parse(xhr.responseText || "{}") as { secure_url?: string; error?: { message?: string } };
          if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) resolve(body.secure_url);
          else reject(new Error(body.error?.message ?? "Upload failed"));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(form);
      });
      onChange(url);
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Upload failed");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const uploading = progress !== null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- CDN thumbnail
          <img src={cloudinaryImage(value, { width: 160, height: 160 })} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="min-w-0 space-y-1.5">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading} aria-describedby={`${id}-hint`}>
            {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
            {uploading ? `Uploading ${progress}%` : value ? `Replace ${label.toLowerCase()}` : `Upload ${label.toLowerCase()}`}
          </Button>
          {value && !uploading && (
            <Button type="button" variant="ghost" onClick={() => onChange("")} aria-label={`Remove ${label.toLowerCase()}`}>
              <Trash2 aria-hidden /> Remove
            </Button>
          )}
        </div>
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 5 MB.</p>
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
