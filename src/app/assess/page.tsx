import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function AssessIntroPage() {
  return (
    <section className="mt-12">
      <p className="numeral text-[0.78rem] tracking-[0.18em] text-[var(--clay-deep)] uppercase">
        Assess your risk
      </p>
      <h1 className="display mt-3 max-w-[18ch] text-[2.25rem] leading-[1.1] text-[var(--ink)] sm:text-[2.75rem]">
        Plan ahead with a steady hand.
      </h1>
      <p className="mt-7 max-w-[60ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
        One question at a time. Answer ten short prompts; receive a short,
        considered list of practical steps. Only anonymous answer letters and
        the planning band may be saved for aggregate analytics.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link href="/assess/1" className="button button-primary">
          <span>Get started</span>
          <span className="button-icon" aria-hidden="true">
            <ChevronRight strokeWidth={1.75} className="h-4 w-4" />
          </span>
        </Link>
        <Link href="/" className="button button-link">
          <span>Return home</span>
        </Link>
      </div>
    </section>
  );
}
