export interface CloudinaryUploadResult {
  secure_url: string;
  bytes: number;
  width?: number;
  height?: number;
}

/**
 * Posts a file straight to Cloudinary with server-signed fields (the API secret
 * never reaches the browser). XHR rather than fetch for upload progress.
 */
export function uploadToCloudinary(
  uploadUrl: string,
  file: File,
  fields: Record<string, string | number>,
  onProgress?: (percent: number) => void,
): Promise<CloudinaryUploadResult> {
  const form = new FormData();
  form.append("file", file);
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body: Partial<CloudinaryUploadResult> & { error?: { message?: string } } = {};
      try {
        body = JSON.parse(xhr.responseText || "{}");
      } catch {
        // Non-JSON error page: fall through to the generic message.
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.secure_url) resolve(body as CloudinaryUploadResult);
      else reject(new Error(body.error?.message ?? "Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });
}
