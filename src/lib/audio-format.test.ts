import { describe, expect, it } from "vitest";
import {
  detectTinfoilAudioFormat,
  prepareTinfoilAudioUpload,
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
