import { describe, expect, it } from "vitest";
import { buildResearchOtpRequest } from "./research-auth";

describe("buildResearchOtpRequest", () => {
  it("disables implicit user creation for researcher magic links", () => {
    expect(
      buildResearchOtpRequest("partner@example.org", "https://example.org/auth/callback"),
    ).toEqual({
      email: "partner@example.org",
      options: {
        shouldCreateUser: false,
        emailRedirectTo: "https://example.org/auth/callback",
      },
    });
  });
});
