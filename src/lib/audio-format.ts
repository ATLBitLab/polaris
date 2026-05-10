export type TinfoilAudioUpload = {
  readonly bytes: Uint8Array;
  readonly filename: string;
  readonly contentType: "audio/mpeg" | "audio/wav";
};

export type WavAudioInfo = {
  readonly audioFormat: number;
  readonly channelCount: number;
  readonly sampleRate: number;
  readonly bitsPerSample: number;
  readonly blockAlign: number;
  readonly dataOffset: number;
  readonly dataSize: number;
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

export function splitWavUpload(
  upload: TinfoilAudioUpload,
  maxChunkSeconds: number,
): readonly TinfoilAudioUpload[] {
  if (upload.contentType !== "audio/wav") {
    return [upload];
  }

  const info = parseWavAudioInfo(upload.bytes);

  if (!info || maxChunkSeconds <= 0) {
    return [upload];
  }

  const bytesPerSecond = info.sampleRate * info.blockAlign;
  const maxChunkBytes = alignToBlock(
    Math.floor(bytesPerSecond * maxChunkSeconds),
    info.blockAlign,
  );

  if (maxChunkBytes <= 0 || info.dataSize <= maxChunkBytes) {
    return [upload];
  }

  const chunks: TinfoilAudioUpload[] = [];
  const dataEnd = info.dataOffset + info.dataSize;
  let dataStart = info.dataOffset;
  let index = 1;

  while (dataStart < dataEnd) {
    const nextEnd = Math.min(dataStart + maxChunkBytes, dataEnd);
    const chunkEnd = alignToBlock(nextEnd - dataStart, info.blockAlign) + dataStart;
    const safeEnd = chunkEnd > dataStart ? chunkEnd : nextEnd;
    const data = upload.bytes.slice(dataStart, safeEnd);

    chunks.push({
      bytes: encodeWavPcm(data, info),
      filename: suffixFileName(upload.filename, index),
      contentType: "audio/wav",
    });

    dataStart = safeEnd;
    index += 1;
  }

  return chunks;
}

export function parseWavAudioInfo(bytes: Uint8Array): WavAudioInfo | null {
  if (!isWav(bytes) || bytes.length < 44) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 12;
  let format:
    | {
        readonly audioFormat: number;
        readonly channelCount: number;
        readonly sampleRate: number;
        readonly bitsPerSample: number;
        readonly blockAlign: number;
      }
    | null = null;
  let dataOffset: number | null = null;
  let dataSize: number | null = null;

  while (offset + 8 <= bytes.length) {
    const id = readAscii(bytes, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;

    if (chunkDataOffset + size > bytes.length) {
      return null;
    }

    if (id === "fmt " && size >= 16) {
      const audioFormat = view.getUint16(chunkDataOffset, true);
      const channelCount = view.getUint16(chunkDataOffset + 2, true);
      const sampleRate = view.getUint32(chunkDataOffset + 4, true);
      const blockAlign = view.getUint16(chunkDataOffset + 12, true);
      const bitsPerSample = view.getUint16(chunkDataOffset + 14, true);

      format = {
        audioFormat,
        channelCount,
        sampleRate,
        bitsPerSample,
        blockAlign,
      };
    }

    if (id === "data") {
      dataOffset = chunkDataOffset;
      dataSize = size;
    }

    offset = chunkDataOffset + size + (size % 2);
  }

  if (!format || dataOffset === null || dataSize === null) {
    return null;
  }

  if (
    format.audioFormat !== 1 ||
    format.channelCount < 1 ||
    format.sampleRate <= 0 ||
    format.bitsPerSample !== 16 ||
    format.blockAlign <= 0
  ) {
    return null;
  }

  return {
    ...format,
    dataOffset,
    dataSize: alignToBlock(dataSize, format.blockAlign),
  };
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

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  let value = "";

  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(bytes[offset + index]);
  }

  return value;
}

function encodeWavPcm(data: Uint8Array, info: WavAudioInfo): Uint8Array {
  const headerSize = 44;
  const bytes = new Uint8Array(headerSize + data.length);
  const view = new DataView(bytes.buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + data.length, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, info.audioFormat, true);
  view.setUint16(22, info.channelCount, true);
  view.setUint32(24, info.sampleRate, true);
  view.setUint32(28, info.sampleRate * info.blockAlign, true);
  view.setUint16(32, info.blockAlign, true);
  view.setUint16(34, info.bitsPerSample, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, data.length, true);
  bytes.set(data, headerSize);

  return bytes;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function alignToBlock(value: number, blockAlign: number): number {
  return value - (value % blockAlign);
}

function suffixFileName(fileName: string, index: number): string {
  const suffix = `-${String(index).padStart(2, "0")}`;
  return fileName.replace(/(\.[a-z0-9]+)$/i, `${suffix}$1`);
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
