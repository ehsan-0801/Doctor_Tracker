/** Chat attachment rules shared by the upload signature, validation and the client. */
export const ATTACHMENT_KINDS = ["image", "file"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export const ATTACHMENT_FORMATS: Record<AttachmentKind, readonly string[]> = {
  image: ["jpg", "jpeg", "png", "webp", "gif"],
  file: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "zip"],
};

/** Cloudinary resource type per kind: photos are images, documents are stored as raw files. */
export const ATTACHMENT_RESOURCE: Record<AttachmentKind, "image" | "raw"> = { image: "image", file: "raw" };

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Every attachment lives under its conversation's folder, so a signature cannot be reused elsewhere. */
export const chatFolder = (conversationId: string) => `DocTrack/chat/${conversationId}`;
