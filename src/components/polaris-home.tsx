"use client";

import { ClipboardPenLine, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { IncidentReportFlow } from "./incident-report-flow";
import { SafetyQuiz } from "./safety-quiz";

type Mode = "home" | "incident" | "quiz";

export function PolarisHome() {
  const [mode, setMode] = useState<Mode>("home");

  if (mode === "incident") {
    return (
      <IncidentReportFlow
        onBack={() => setMode("home")}
        onAssessRisk={() => setMode("quiz")}
      />
    );
  }

  if (mode === "quiz") {
    return <SafetyQuiz onBack={() => setMode("home")} />;
  }

  return (
    <main className="mx-auto w-full max-w-[46rem] px-6 pt-10 pb-24 sm:px-10 sm:pt-14">
      <header className="flex items-center justify-between border-b border-[var(--rule)] pb-5">
        <div className="flex items-center gap-3">
          <StarMark className="h-3.5 w-3.5 text-[var(--clay)]" />
          <span className="wordmark text-[0.78rem] text-[var(--ink)]">
            Polaris
          </span>
        </div>
        <span className="text-[0.72rem] tracking-[0.18em] text-[var(--ink-3)] uppercase">
          Public tools
        </span>
      </header>

      <section className="mt-12">
        <h1 className="display max-w-[18ch] text-[2.25rem] leading-[1.1] text-[var(--ink)] sm:text-[2.75rem]">
          Report an incident, or plan before one.
        </h1>

        <div className="mt-8 grid gap-x-12 gap-y-7 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
          <p className="max-w-[62ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
            Polaris now starts with incident documentation. You can begin
            without an account, autosave partial details from this browser, and
            choose whether follow-up contact is allowed.
          </p>

          <aside className="display border-t border-[var(--rule-strong)] pt-4 text-[0.95rem] leading-[1.6] text-[var(--ink-2)] sm:mt-2">
            <p className="italic">
              <span className="not-italic numeral mr-2 text-[var(--clay)]">
                §
              </span>
              The safety quiz is still available when you want broad planning
              guidance without names, addresses, or coordinates.
            </p>
          </aside>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMode("incident")}
            className="inline-flex h-12 items-center gap-3 rounded-md bg-[var(--clay)] px-5 text-[0.94rem] font-medium tracking-wide text-[var(--paper)] transition-colors duration-150 ease-out hover:bg-[var(--clay-deep)] focus:bg-[var(--clay-deep)]"
          >
            <ClipboardPenLine className="h-4 w-4" aria-hidden="true" />
            Report incident
          </button>
          <button
            type="button"
            onClick={() => setMode("quiz")}
            className="inline-flex h-12 items-center gap-3 rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-5 text-[0.94rem] font-medium text-[var(--ink)] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)] hover:bg-[var(--paper-deep)]"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Assess your risk
          </button>
        </div>
      </section>

      <div
        className="mt-16 flex items-center justify-center gap-5 text-[var(--clay)]"
        aria-hidden="true"
      >
        <span className="h-px w-12 bg-[var(--rule-strong)]" />
        <StarMark className="h-2.5 w-2.5" />
        <span className="h-px w-12 bg-[var(--rule-strong)]" />
      </div>

      <section className="mt-14 grid gap-10 border-t border-[var(--rule)] pt-8 sm:grid-cols-2">
        <div>
          <p className="numeral text-[0.86rem] text-[var(--clay-deep)]">
            I.
          </p>
          <h2 className="display mt-2 text-[1.35rem] leading-tight text-[var(--ink)]">
            Incident reporting
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            Capture time, place, narrative, involved people, evidence prompts,
            documentation quality, and explicit follow-up consent.
          </p>
        </div>
        <div>
          <p className="numeral text-[0.86rem] text-[var(--clay-deep)]">
            II.
          </p>
          <h2 className="display mt-2 text-[1.35rem] leading-tight text-[var(--ink)]">
            Safety quiz
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            Answer ten exposure questions and receive practical planning steps.
            The quiz stores no identifying details.
          </p>
        </div>
      </section>

      <footer className="mt-24 border-t border-[var(--rule)] pt-10">
        <div className="flex items-center gap-3">
          <StarMark className="h-3 w-3 text-[var(--clay)]" />
          <span className="wordmark text-[0.7rem] text-[var(--ink-2)]">
            Polaris
          </span>
        </div>
        <p className="mt-4 max-w-[60ch] text-[0.875rem] leading-[1.7] text-[var(--ink-3)]">
          Incident reports and safety planning have different privacy shapes.
          Reports can contain details you choose to provide; the quiz remains a
          broad, no-identifying-detail planning aid.
        </p>
      </footer>
    </main>
  );
}

function StarMark({ className = "" }: { readonly className?: string }) {
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
