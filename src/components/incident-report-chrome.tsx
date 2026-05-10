"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  useIncidentReport,
  type SaveState,
} from "@/components/incident-report-provider";

export const reportSteps = [
  { slug: "when", index: "I.", heading: "When did the incident occur?" },
  { slug: "where", index: "II.", heading: "Where did this occur?" },
  { slug: "what", index: "III.", heading: "What happened?" },
  { slug: "who", index: "IV.", heading: "Who was involved?" },
  { slug: "next", index: "V.", heading: "What next" },
  { slug: "contact", index: "VI.", heading: "Contact opt-in" },
] as const;

export type ReportStepSlug = (typeof reportSteps)[number]["slug"];

export function ReportMasthead() {
  return (
    <header className="flex items-center border-b border-[var(--rule)] pb-5">
      <Link
        href="/"
        className="flex items-center gap-3 rounded-sm transition-opacity duration-150 ease-out hover:opacity-80"
      >
        <StarMark className="h-3.5 w-3.5 text-[var(--clay)]" />
        <span className="wordmark text-[0.78rem] text-[var(--ink)]">
          Polaris
        </span>
      </Link>
    </header>
  );
}

export function ReportStatusBar() {
  const { saveState, error, report } = useIncidentReport();
  return (
    <section className="mt-8 border-b border-[var(--rule)] py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.84rem] font-medium text-[var(--ink)]">
          {statusCopy(saveState)}
        </p>
        {report?.lastAutosavedAt ? (
          <p className="text-[0.78rem] text-[var(--ink-3)]">
            Last saved {formatTime(report.lastAutosavedAt)}
          </p>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 text-[0.86rem] leading-relaxed text-[var(--clay-deep)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}

export function ReportProgress({
  currentSlug,
}: {
  readonly currentSlug: ReportStepSlug;
}) {
  const total = reportSteps.length;
  const currentIndex = reportSteps.findIndex(
    (step) => step.slug === currentSlug,
  );
  const position = currentIndex >= 0 ? currentIndex + 1 : 1;
  return (
    <p className="mt-8 text-[0.78rem] tracking-[0.16em] text-[var(--ink-3)] uppercase">
      Step {position} of {total}
    </p>
  );
}

export function ReportStepHeading({
  slug,
  helper,
}: {
  readonly slug: ReportStepSlug;
  readonly helper?: string;
}) {
  const step = reportSteps.find((item) => item.slug === slug);
  if (!step) {
    return null;
  }
  return (
    <div className="mt-5">
      <div className="flex items-baseline gap-4 border-t border-[var(--rule)] pt-7">
        <span className="numeral text-[0.95rem] text-[var(--clay-deep)]">
          {step.index}
        </span>
        <h2 className="display text-[1.5rem] leading-tight text-[var(--ink)]">
          {step.heading}
        </h2>
      </div>
      {helper ? (
        <p className="mt-3 max-w-[60ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export function ReportStepNav({
  currentSlug,
  continueDisabled,
  continueLabel,
}: {
  readonly currentSlug: ReportStepSlug;
  readonly continueDisabled?: boolean;
  readonly continueLabel?: string;
}) {
  const router = useRouter();
  const { flushPendingPatches } = useIncidentReport();
  const currentIndex = reportSteps.findIndex(
    (item) => item.slug === currentSlug,
  );
  const previous = currentIndex > 0 ? reportSteps[currentIndex - 1] : null;
  const next = reportSteps[currentIndex + 1];

  async function handleContinue() {
    await flushPendingPatches();
    router.push(next ? `/report/${next.slug}` : "/report/done");
  }

  return (
    <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--rule)] pt-6">
      {previous ? (
        <Link href={`/report/${previous.slug}`} className="button button-link">
          <span className="button-icon" aria-hidden="true">
            <ChevronLeft className="h-4 w-4" />
          </span>
          <span>Back</span>
        </Link>
      ) : (
        <Link href="/" className="button button-link">
          <span className="button-icon" aria-hidden="true">
            <ChevronLeft className="h-4 w-4" />
          </span>
          <span>Home</span>
        </Link>
      )}
      <Button
        type="button"
        onClick={handleContinue}
        disabled={continueDisabled}
        iconAfter={<ChevronRight strokeWidth={1.75} className="h-4 w-4" />}
      >
        {continueLabel ?? (next ? "Continue" : "Finish")}
      </Button>
    </div>
  );
}

export function StarMark({ className = "" }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 1.6 L13.05 10.95 L22.4 12 L13.05 13.05 L12 22.4 L10.95 13.05 L1.6 12 L10.95 10.95 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function statusCopy(state: SaveState): string {
  switch (state) {
    case "starting":
      return "Starting report.";
    case "saving":
      return "Autosaving.";
    case "saved":
      return "Autosaved.";
    case "error":
      return "Autosave needs attention.";
    default:
      return "Ready.";
  }
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
