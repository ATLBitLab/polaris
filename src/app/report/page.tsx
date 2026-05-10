import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ReportIntroPage() {
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

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link href="/report/when" className="button button-primary">
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
