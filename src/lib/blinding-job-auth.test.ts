import { describe, expect, it } from "vitest";
import { isAuthorizedBlindingJobRequest } from "./blinding-job-auth";

describe("isAuthorizedBlindingJobRequest", () => {
  it("rejects missing or invalid bearer secrets", () => {
    expect(isAuthorizedBlindingJobRequest(null, "secret")).toBe(false);
    expect(isAuthorizedBlindingJobRequest("Bearer wrong", "secret")).toBe(false);
    expect(isAuthorizedBlindingJobRequest("Basic secret", "secret")).toBe(false);
    expect(isAuthorizedBlindingJobRequest("Bearer secret", undefined)).toBe(false);
  });

  it("accepts the configured bearer secret", () => {
    expect(isAuthorizedBlindingJobRequest("Bearer secret", "secret")).toBe(true);
  });
});
