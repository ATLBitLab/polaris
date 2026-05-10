"use client";

import type { IncidentTimeKind } from "@/lib/incident-report";
import { useIncidentReport } from "@/components/incident-report-provider";
import {
  ReportProgress,
  ReportStepHeading,
  ReportStepNav,
} from "@/components/incident-report-chrome";

const timeChoices: {
  readonly kind: IncidentTimeKind;
  readonly label: string;
}[] = [
  { kind: "just_now", label: "Just now" },
  { kind: "an_hour_ago", label: "An hour ago" },
  { kind: "yesterday", label: "Yesterday" },
  { kind: "manual", label: "Manual" },
];

export default function ReportWhenPage() {
  const { report, manualDateTime, chooseTime, updateManualDateTime } =
    useIncidentReport();
  const draft = report?.draft;

  return (
    <section>
      <ReportProgress currentSlug="when" />
      <ReportStepHeading
        slug="when"
        helper="Pick the closest match. Manual lets you set the date and time exactly."
      />
      {draft ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {timeChoices.map((choice) => (
              <button
                key={choice.kind}
                type="button"
                onClick={() => chooseTime(choice.kind)}
                className={`h-11 rounded-md border px-3 text-[0.9rem] transition-colors duration-150 ease-out ${
                  draft.incidentTimeKind === choice.kind
                    ? "border-[var(--clay)] bg-[var(--clay-soft)] text-[var(--clay-deep)]"
                    : "border-[var(--rule)] bg-[var(--paper-inset)] text-[var(--ink-2)] hover:border-[var(--rule-strong)]"
                }`}
              >
                {choice.label}
              </button>
            ))}
          </div>
          {draft.incidentTimeKind === "manual" ? (
            <label className="mt-5 block">
              <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
                Date and time
              </span>
              <input
                type="datetime-local"
                value={manualDateTime}
                onChange={(event) => updateManualDateTime(event.target.value)}
                className="mt-2 h-12 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 text-[1rem] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
              />
            </label>
          ) : null}
        </>
      ) : (
        <p className="mt-6 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
          Starting a report.
        </p>
      )}

      <ReportStepNav currentSlug="when" />
    </section>
  );
}
