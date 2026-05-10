"use client";

import { ClipboardPenLine } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StarMark } from "@/components/safety-quiz-chrome";
import {
  useSafetyQuiz,
  type QuizSaveState,
} from "@/components/safety-quiz-provider";
import type { QuizResult } from "@/lib/quiz-engine";

export default function AssessPlanPage() {
  const router = useRouter();
  const { result, saveState, resetQuiz } = useSafetyQuiz();

  useEffect(() => {
    if (!result) {
      router.replace("/assess/1");
    }
  }, [result, router]);

  if (!result) {
    return (
      <p className="mt-12 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
        Loading the plan.
      </p>
    );
  }

  function startOver() {
    resetQuiz();
    router.push("/assess/1");
  }

  return (
    <ResultPanel result={result} saveState={saveState} onStartOver={startOver} />
  );
}

function ResultPanel({
  result,
  saveState,
  onStartOver,
}: {
  readonly result: QuizResult;
  readonly saveState: QuizSaveState;
  readonly onStartOver: () => void;
}) {
  return (
    <section className="mt-12" aria-live="polite">
      <p className="numeral text-[0.78rem] tracking-[0.18em] text-[var(--clay-deep)] uppercase">
        Your plan
      </p>

      <h1 className="display mt-3 max-w-[20ch] text-[2.25rem] leading-[1.1] text-[var(--ink)] sm:text-[2.75rem]">
        {result.riskLabel} planning band.
      </h1>

      <p className="mt-7 max-w-[60ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
        {result.rationale}
      </p>

      <div className="mt-12 grid gap-12 border-t-2 border-[var(--ink)] pt-10">
        {result.guidanceGroups.map((group) => (
          <div key={group.key}>
            <div className="flex items-baseline gap-3">
              <StarMark className="h-2.5 w-2.5 text-[var(--clay)]" />
              <h2 className="display text-[1.25rem] leading-tight text-[var(--ink)]">
                {group.title}
              </h2>
            </div>
            <p className="mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
              {group.description}
            </p>
            <ol className="mt-6 grid gap-7">
              {group.items.map((item, index) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[2.25rem_1fr] gap-x-4"
                >
                  <span className="numeral pt-[2px] text-[0.95rem] tabular-nums text-[var(--clay-deep)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[1rem] font-medium text-[var(--ink)]">
                      {item.title}
                    </p>
                    <p className="mt-1.5 max-w-[58ch] text-[0.95rem] leading-[1.65] text-[var(--ink-2)]">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-3 border-t border-[var(--rule)] pt-6">
        <Button type="button" onClick={onStartOver}>
          Start over
        </Button>
        <Link href="/report" className="button button-secondary">
          <span className="button-icon" aria-hidden="true">
            <ClipboardPenLine className="h-4 w-4" />
          </span>
          <span>Report an incident</span>
        </Link>
        <Link href="/" className="button button-link">
          <span>Return home</span>
        </Link>
      </div>

      <p className="mt-8 text-[0.78rem] leading-relaxed text-[var(--ink-3)]">
        {saveStateCopy(saveState)}
      </p>
    </section>
  );
}

function saveStateCopy(state: QuizSaveState): string {
  switch (state) {
    case "saving":
      return "Saving anonymous answer letters and this result.";
    case "saved":
      return "Anonymous answer letters saved. No identifying details left this page.";
    case "skipped":
      return "Plan ready. Nothing was saved.";
    default:
      return "Plan ready.";
  }
}
