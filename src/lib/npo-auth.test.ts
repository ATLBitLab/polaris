import { describe, expect, it } from "vitest";
import { buildNpoOtpRequest } from "./npo-auth";

describe("buildNpoOtpRequest", () => {
  it("disables implicit user creation for NPO magic links", () => {
    expect(
      buildNpoOtpRequest("partner@example.org", "https://example.org/auth/callback"),
    ).toEqual({
      email: "partner@example.org",
      options: {
        shouldCreateUser: false,
        emailRedirectTo: "https://example.org/auth/callback",
      },
    });
  });
});
