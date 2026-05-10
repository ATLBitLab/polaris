import { describe, expect, it } from "vitest";
import {
  evidenceMaxFileSizeBytes,
  isAllowedEvidenceMime,
  isAllowedEvidenceSize,
} from "./incident-evidence-validation";

describe("incident evidence validation", () => {
  it("accepts image and PDF mime types", () => {
    for (const mime of [
      "image/jpeg",
      "image/png",
      "image/heic",
      "image/webp",
      "application/pdf",
    ]) {
      expect(isAllowedEvidenceMime(mime)).toBe(true);
    }
  });

  it("rejects text and unknown mime types", () => {
    expect(isAllowedEvidenceMime("text/plain")).toBe(false);
    expect(isAllowedEvidenceMime("application/zip")).toBe(false);
    expect(isAllowedEvidenceMime("")).toBe(false);
  });

  it("accepts file sizes from 0 up to the cap", () => {
    expect(isAllowedEvidenceSize(0)).toBe(true);
    expect(isAllowedEvidenceSize(1024)).toBe(true);
    expect(isAllowedEvidenceSize(evidenceMaxFileSizeBytes)).toBe(true);
  });

  it("rejects negative or over-cap sizes", () => {
    expect(isAllowedEvidenceSize(-1)).toBe(false);
    expect(isAllowedEvidenceSize(evidenceMaxFileSizeBytes + 1)).toBe(false);
    expect(isAllowedEvidenceSize(Number.NaN)).toBe(false);
  });
});
