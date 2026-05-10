"use client";

import { ClipboardPenLine, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { IncidentReportFlow } from "./incident-report-flow";
import { SafetyQuiz } from "./safety-quiz";
import { Button } from "./ui/button";

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
      <header className="flex items-center border-b border-[var(--rule)] pb-5">
        <div className="flex items-center gap-3">
          <StarMark className="h-3.5 w-3.5 text-[var(--clay)]" />
          <span className="wordmark text-[0.78rem] text-[var(--ink)]">
            Polaris
          </span>
        </div>
      </header>

      <section className="mt-12">
        <h1 className="display max-w-[22ch] text-[2.25rem] leading-[1.1] text-[var(--ink)] sm:text-[2.75rem]">
          Transnational repression, on the record.
        </h1>

        <p className="mt-8 max-w-[62ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
          Polaris is for people living in the United States who are
          surveilled, harassed, or threatened by the Chinese government. That
          can mean intimidation at a protest, online harassment, or pressure
          put on family members back home. Built for members of the Hong
          Kong, Tibetan, Uyghur, and mainland Chinese communities, and for
          allies of pro-democracy advocates from China.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => setMode("incident")}
            iconBefore={<ClipboardPenLine className="h-4 w-4" />}
          >
            Report an incident
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setMode("quiz")}
            iconBefore={<ShieldCheck className="h-4 w-4" />}
          >
            Assess your risk
          </Button>
        </div>
      </section>

      <section className="mt-20 grid gap-10 border-t border-[var(--rule)] pt-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="numeral text-[0.86rem] text-[var(--clay-deep)]">
            I.
          </p>
          <h2 className="display mt-2 text-[1.35rem] leading-tight text-[var(--ink)]">
            Report an incident
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            A place to put down what happened: when, where, and what you
            remember. You decide whether to share contact details for follow-up.
          </p>
        </div>
        <div>
          <p className="numeral text-[0.86rem] text-[var(--clay-deep)]">
            II.
          </p>
          <h2 className="display mt-2 text-[1.35rem] leading-tight text-[var(--ink)]">
            Assess your risk
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            Ten short questions about your situation, with a calm read of your
            exposure and a few practical steps to consider next.
          </p>
        </div>
        <div>
          <p className="numeral text-[0.86rem] text-[var(--clay-deep)]">
            III.
          </p>
          <h2 className="display mt-2 text-[1.35rem] leading-tight text-[var(--ink)]">
            See the public overview
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            An aggregate map and a few summary statistics drawn from
            community reports. No individual report or location is shown.
          </p>
          <Link
            href="/overview"
            className="mt-4 inline-block text-[0.92rem] text-[var(--clay-deep)] underline decoration-[var(--rule-strong)] underline-offset-[6px] hover:text-[var(--clay)]"
          >
            Open the overview &rarr;
          </Link>
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
          Polaris does not require an account. The risk assessment collects no
          names, addresses, or coordinates. An incident report contains only
          what you choose to share.
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
