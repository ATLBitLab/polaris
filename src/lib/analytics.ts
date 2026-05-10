import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { RiskBand } from "./quiz-config";
import type { QuizInput } from "./quiz-engine";

type AnalyticsResult =
  | { readonly saved: true }
  | {
      readonly saved: false;
      readonly reason: "not_configured" | "write_failed";
    };

export async function recordQuizCompletion(
  input: QuizInput,
  riskBand: RiskBand,
  score: number,
): Promise<AnalyticsResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const writeKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !writeKey) {
    return { saved: false, reason: "not_configured" };
  }

  const supabase = createClient(supabaseUrl, writeKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { error } = await supabase.from("quiz_events").insert({
    answers: input.answers,
    score,
    risk_band: riskBand,
  });

  if (error) {
    console.error("Unable to record anonymous quiz analytics", {
      message: error.message,
      code: error.code,
    });

    return { saved: false, reason: "write_failed" };
  }

  return { saved: true };
}
