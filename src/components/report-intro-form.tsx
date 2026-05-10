"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import {
  getOrCreateDeviceSource,
  useIncidentReport,
} from "@/components/incident-report-provider";
import type { IncidentClientReport } from "@/lib/incident-report";

type ApiPayload = {
  readonly report?: IncidentClientReport;
  readonly error?: string;
};

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function ReportIntroForm() {
  const router = useRouter();
  const { report, seedReport } = useIncidentReport();
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasExistingDraft = report !== null && report.submittedAt === null;

  const handleStart = useCallback(async () => {
    if (hasExistingDraft) {
      router.push("/report/when");
      return;
    }
    if (!token || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/incident-reports", {
        method: "POST",
        headers: {
          "x-polaris-device-source": getOrCreateDeviceSource(),
          "x-turnstile-token": token,
        },
      });
      const payload = (await response.json()) as ApiPayload;

      if (!response.ok || !payload.report) {
        throw new Error(payload.error ?? "Unable to start report");
      }

      seedReport(payload.report);
      router.push("/report/when");
    } catch (nextError) {
      setSubmitting(false);
      setToken(null);
      turnstileRef.current?.reset();
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to start report",
      );
    }
  }, [hasExistingDraft, router, seedReport, submitting, token]);

  const canStart = hasExistingDraft || (Boolean(token) && !submitting);

  return (
    <section className="mt-12">
      <p className="numeral text-[0.78rem] tracking-[0.18em] text-[var(--clay-deep)] uppercase">
        Incident report
      </p>
      <h1 className="display mt-3 max-w-[18ch] text-[2.25rem] leading-[1.1] text-[var(--ink)] sm:text-[2.75rem]">
        Record what happened while details are fresh.
      </h1>
      <p className="mt-7 max-w-[62ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
        Have you or someone you know ever felt threatened or intimidated by the
        Chinese government? Transnational repression (TNR) can take many forms,
        including, but not limited to: physical assault at a protest, being
        photographed/followed by suspicious people, social media harassment,
        deepfakes, and having family members detained or questioned.
      </p>
      <p className="mt-4 max-w-[62ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
        Report your TNR incident here. Your progress is saved as you continue
        through the report. Your information is kept entirely confidential.
      </p>

      {hasExistingDraft ? (
        <p className="mt-8 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
          You have a report in progress. Continue where you left off.
        </p>
      ) : null}

      {!hasExistingDraft && turnstileSiteKey ? (
        <div className="mt-8">
          <Turnstile
            ref={turnstileRef}
            siteKey={turnstileSiteKey}
            options={{
              theme: "light",
              appearance: "always",
              size: "normal",
            }}
            onSuccess={(nextToken) => {
              setToken(nextToken);
              setError(null);
            }}
            onError={() => {
              setToken(null);
              setError("Verification failed. Please try again.");
            }}
            onExpire={() => {
              setToken(null);
            }}
          />
        </div>
      ) : null}

      {!hasExistingDraft && !turnstileSiteKey ? (
        <p className="mt-8 text-[0.85rem] text-[var(--ink-3)]">
          Bot verification is not configured.
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 text-[0.9rem] text-[var(--clay-deep)]"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="button button-primary"
          onClick={handleStart}
          disabled={!canStart}
          aria-disabled={!canStart}
        >
          <span>
            {submitting
              ? "Starting…"
              : hasExistingDraft
                ? "Continue report"
                : "Get started"}
          </span>
          <span className="button-icon" aria-hidden="true">
            <ChevronRight strokeWidth={1.75} className="h-4 w-4" />
          </span>
        </button>
        <Link href="/" className="button button-link">
          <span>Return home</span>
        </Link>
      </div>
    </section>
  );
}
