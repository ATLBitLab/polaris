import "server-only";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type VerifyResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly status: number; readonly error: string };

type SiteVerifyResponse = {
  readonly success: boolean;
  readonly "error-codes"?: readonly string[];
};

const retryableErrorCodes = new Set([
  "timeout-or-duplicate",
  "challenge-expired",
  "internal-error",
]);

export async function verifyTurnstileToken(
  token: string | null,
): Promise<VerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "TURNSTILE_SECRET_KEY is not configured. Rejecting incident submission.",
      );
      return {
        ok: false,
        status: 503,
        error: "Bot verification is not configured",
      };
    }
    console.warn(
      "TURNSTILE_SECRET_KEY is not set; bypassing Turnstile verification in non-production.",
    );
    return { ok: true };
  }

  if (!token) {
    return { ok: false, status: 400, error: "Missing verification token" };
  }

  let response: Response;
  try {
    response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
    });
  } catch (error) {
    console.error("Turnstile verification fetch threw", error);
    return {
      ok: false,
      status: 502,
      error: "Verification could not reach Cloudflare. Please try again.",
    };
  }

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    console.error(
      "Turnstile siteverify returned non-OK status",
      response.status,
      responseText.slice(0, 500),
    );
    return {
      ok: false,
      status: 502,
      error: "Verification service is temporarily unavailable. Please try again.",
    };
  }

  let payload: SiteVerifyResponse;
  try {
    payload = (await response.json()) as SiteVerifyResponse;
  } catch (error) {
    console.error("Turnstile siteverify returned non-JSON body", error);
    return {
      ok: false,
      status: 502,
      error: "Verification service returned an unexpected response. Please try again.",
    };
  }

  if (!payload.success) {
    const codes = payload["error-codes"] ?? [];
    console.warn("Turnstile token rejected", codes);
    const isRetryable = codes.some((code) => retryableErrorCodes.has(code));
    return {
      ok: false,
      status: 403,
      error: isRetryable
        ? "Verification expired. Please try again."
        : "Verification failed. Please refresh and try again.",
    };
  }

  return { ok: true };
}
