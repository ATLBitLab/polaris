export const evidenceAllowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/webp",
  "application/pdf",
] as const;

export const evidenceMaxFileSizeBytes = 26_214_400; // 25 MiB

export const evidenceExtensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

const allowedSet: ReadonlySet<string> = new Set(evidenceAllowedMimeTypes);

export function isAllowedEvidenceMime(mime: string): boolean {
  return allowedSet.has(mime);
}

export function isAllowedEvidenceSize(sizeBytes: number): boolean {
  return (
    Number.isFinite(sizeBytes) &&
    sizeBytes >= 0 &&
    sizeBytes <= evidenceMaxFileSizeBytes
  );
}
