import { describe, expect, it } from "vitest";
import {
  detectTinfoilAudioFormat,
  parseWavAudioInfo,
  prepareTinfoilAudioUpload,
  splitWavUpload,
} from "./audio-format";

describe("detectTinfoilAudioFormat", () => {
  it("accepts RIFF WAV files", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ]);

    expect(detectTinfoilAudioFormat(bytes)).toBe("wav");
  });

  it("accepts ID3-tagged MP3 files", () => {
    const bytes = new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00]);

    expect(detectTinfoilAudioFormat(bytes)).toBe("mp3");
  });

  it("rejects WebM bytes because Tinfoil Whisper only accepts mp3 and wav", () => {
    const bytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x9f]);

    expect(detectTinfoilAudioFormat(bytes)).toBeNull();
  });
});

describe("prepareTinfoilAudioUpload", () => {
  it("normalizes names and content types for upload", () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    ]);

    expect(prepareTinfoilAudioUpload(bytes, "Incident Recording.webm")).toEqual({
      bytes,
      filename: "incident-recording.wav",
      contentType: "audio/wav",
    });
  });
});

describe("splitWavUpload", () => {
  it("splits 16-bit PCM WAV uploads into duration-bounded chunks", () => {
    const bytes = makeWav({
      sampleRate: 4,
      seconds: 3,
      samples: [
        -0.8, -0.7, -0.6, -0.5,
        -0.4, -0.3, -0.2, -0.1,
        0.1, 0.2, 0.3, 0.4,
      ],
    });

    const chunks = splitWavUpload(
      {
        bytes,
        filename: "incident-audio.wav",
        contentType: "audio/wav",
      },
      1,
    );

    expect(chunks).toHaveLength(3);
    expect(chunks.map((chunk) => chunk.filename)).toEqual([
      "incident-audio-01.wav",
      "incident-audio-02.wav",
      "incident-audio-03.wav",
    ]);
    expect(chunks.every((chunk) => detectTinfoilAudioFormat(chunk.bytes) === "wav")).toBe(true);
    expect(chunks.map((chunk) => parseWavAudioInfo(chunk.bytes)?.dataSize)).toEqual([
      8,
      8,
      8,
    ]);
  });

  it("leaves short WAV uploads intact", () => {
    const bytes = makeWav({ sampleRate: 4, seconds: 1, samples: [0, 0, 0, 0] });
    const upload = {
      bytes,
      filename: "short.wav",
      contentType: "audio/wav" as const,
    };

    expect(splitWavUpload(upload, 10)).toEqual([upload]);
  });
});

function makeWav({
  sampleRate,
  seconds,
  samples,
}: {
  readonly sampleRate: number;
  readonly seconds: number;
  readonly samples: readonly number[];
}): Uint8Array {
  const bytesPerSample = 2;
  const dataSize = sampleRate * seconds * bytesPerSample;
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    const pcm = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(44 + index * bytesPerSample, pcm, true);
  });

  return bytes;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
