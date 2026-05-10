"use server";

import { headers } from "next/headers";
import { buildResearchOtpRequest } from "@/lib/research-auth";
import { createClient } from "@/lib/supabase/server";
import type { ResearchLoginState } from "./state";

export async function requestResearchMagicLink(
  _state: ResearchLoginState,
  formData: FormData,
): Promise<ResearchLoginState> {
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
      message: "Researcher access is not configured.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp(
      buildResearchOtpRequest(email, await buildResearchEmailRedirectTo()),
    );

    if (error) {
      console.warn("Unable to request researcher magic link", error);
    }

    return {
      status: "sent",
      message:
        "If that address has researcher access, a sign-in link will arrive shortly.",
    };
  } catch (error) {
    console.error("Researcher magic link request failed", error);
    return {
      status: "error",
      message: "Unable to request a sign-in link right now.",
    };
  }
}

async function buildResearchEmailRedirectTo(): Promise<string> {
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    `${headerStore.get("x-forwarded-proto") ?? "http"}://${
      headerStore.get("x-forwarded-host") ?? headerStore.get("host")
    }`;

  return new URL("/auth/callback?next=/research", origin).toString();
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
