export type TinfoilAudioUpload = {
  readonly bytes: Uint8Array;
  readonly filename: string;
  readonly contentType: "audio/mpeg" | "audio/wav";
};

export function prepareTinfoilAudioUpload(
  bytes: Uint8Array,
  originalName: string,
): TinfoilAudioUpload | null {
  const format = detectTinfoilAudioFormat(bytes);

  if (!format) {
    return null;
  }

  const baseName = sanitizeBaseName(originalName) || "incident-audio";

  return {
    bytes,
    filename: `${baseName}.${format === "mp3" ? "mp3" : "wav"}`,
    contentType: format === "mp3" ? "audio/mpeg" : "audio/wav",
  };
}

export function detectTinfoilAudioFormat(
  bytes: Uint8Array,
): "mp3" | "wav" | null {
  if (isWav(bytes)) {
    return "wav";
  }

  if (isMp3(bytes)) {
    return "mp3";
  }

  return null;
}

function isWav(bytes: Uint8Array): boolean {
  return startsWithAscii(bytes, "RIFF", 0) && startsWithAscii(bytes, "WAVE", 8);
}

function isMp3(bytes: Uint8Array): boolean {
  return (
    startsWithAscii(bytes, "ID3", 0) ||
    (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  );
}

function startsWithAscii(
  bytes: Uint8Array,
  value: string,
  offset: number,
): boolean {
  if (bytes.length < offset + value.length) {
    return false;
  }

  for (let index = 0; index < value.length; index += 1) {
    if (bytes[offset + index] !== value.charCodeAt(index)) {
      return false;
    }
  }

  return true;
}

function sanitizeBaseName(value: string): string {
  const fileName = value.split(/[\\/]/).at(-1) ?? "";
  const withoutExtension = fileName.replace(/\.[a-z0-9]+$/i, "");

  return withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
