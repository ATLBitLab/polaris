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

export async function verifyTurnstileToken(
  token: string | null,
  remoteIp: string | null,
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
      body: JSON.stringify({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    });
  } catch (error) {
    console.error("Turnstile verification request failed", error);
    return {
      ok: false,
      status: 502,
      error: "Verification service unavailable",
    };
  }

  if (!response.ok) {
    console.error("Turnstile siteverify returned", response.status);
    return {
      ok: false,
      status: 502,
      error: "Verification service unavailable",
    };
  }

  const payload = (await response.json()) as SiteVerifyResponse;

  if (!payload.success) {
    console.warn("Turnstile token rejected", payload["error-codes"]);
    return { ok: false, status: 403, error: "Verification failed" };
  }

  return { ok: true };
}

export function getRequestIp(request: Request): string | null {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp;
  }
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return null;
}
