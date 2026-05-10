"use server";

import { headers } from "next/headers";
import { buildNpoOtpRequest } from "@/lib/npo-auth";
import { createClient } from "@/lib/supabase/server";

export type NpoLoginState = {
  readonly status: "idle" | "sent" | "error";
  readonly message: string;
};

export const initialNpoLoginState: NpoLoginState = {
  status: "idle",
  message: "",
};

export async function requestNpoMagicLink(
  _state: NpoLoginState,
  formData: FormData,
): Promise<NpoLoginState> {
  const email = normalizeEmail(formData.get("email"));

  if (!email) {
    return {
      status: "error",
      message: "Enter a valid email address.",
    };
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return {
      status: "error",
      message: "NPO access is not configured.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp(
      buildNpoOtpRequest(email, await buildNpoEmailRedirectTo()),
    );

    if (error) {
      console.warn("Unable to request NPO magic link", error);
    }

    return {
      status: "sent",
      message:
        "If that address has NPO access, a sign-in link will arrive shortly.",
    };
  } catch (error) {
    console.error("NPO magic link request failed", error);
    return {
      status: "error",
      message: "Unable to request a sign-in link right now.",
    };
  }
}

export async function buildNpoEmailRedirectTo(): Promise<string> {
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    `${headerStore.get("x-forwarded-proto") ?? "http"}://${
      headerStore.get("x-forwarded-host") ?? headerStore.get("host")
    }`;

  return new URL("/auth/callback?next=/npo", origin).toString();
}

function normalizeEmail(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    return null;
  }

  return email;
}
