// Identify uploads by their magic bytes, not by the client-supplied MIME type.

export const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export type AllowedType = (typeof ALLOWED_DOCUMENT_TYPES)[number];

export function sniffMimeType(bytes: Uint8Array): AllowedType | null {
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);

  if (startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}
