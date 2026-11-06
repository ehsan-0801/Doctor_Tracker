/**
 * Adds a Cloudinary delivery transformation (resize, subject-aware crop, automatic
 * format and quality) to Cloudinary URLs. Other URLs are returned unchanged.
 */
export function cloudinaryImage(url: string, { width, height }: { width: number; height?: number }): string {
  const marker = "/image/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(marker)) return url;
  const size = height ? `w_${width},h_${height},c_fill,g_auto` : `w_${width},c_limit`;
  return url.replace(marker, `${marker}${size},q_auto,f_auto/`);
}
