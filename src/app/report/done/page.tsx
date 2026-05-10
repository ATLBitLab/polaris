"use client";

import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useIncidentReport } from "@/components/incident-report-provider";
import { StarMark } from "@/components/incident-report-chrome";

export default function ReportDonePage() {
  const router = useRouter();
  const { report, resetReport } = useIncidentReport();

  function startAnother() {
    resetReport();
    router.push("/report/when");
  }

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <StarMark className="h-3 w-3 text-[var(--clay)]" />
        <p className="numeral text-[0.78rem] tracking-[0.18em] text-[var(--clay-deep)] uppercase">
          Filed
        </p>
      </div>

      <h1 className="display mt-4 max-w-[20ch] text-[2.5rem] leading-[1.05] text-[var(--ink)] sm:text-[3rem]">
        Your incident has been reported.
      </h1>

      <p className="mt-7 max-w-[58ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
        Polaris has saved what you shared. The record is held in this browser
        with continuity, and on the server under the report ID below. Take
        breath. You did good work putting words to a hard moment.
      </p>

      {report ? (
        <div className="mt-12 border-t-2 border-[var(--ink)] pt-7">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <p className="display text-[1.5rem] leading-tight text-[var(--ink)]">
              Quality score
            </p>
            <p className="display text-[2rem] leading-none text-[var(--ink)]">
              {report.quality.score}
              <span className="text-[1rem] text-[var(--ink-3)]">/100</span>
            </p>
          </div>
          <div
            className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[var(--paper-deep)]"
            aria-hidden="true"
          >
            <div
              className="h-full bg-[var(--clay)] transition-[width] duration-150 ease-out"
              style={{ width: `${report.quality.score}%` }}
            />
          </div>
          {report.quality.feedback.length > 0 ? (
            <>
              <p className="mt-7 text-[0.82rem] tracking-[0.16em] text-[var(--ink-3)] uppercase">
                Things you could still add
              </p>
              <ul className="mt-4 grid gap-3">
                {report.quality.feedback.map((item) => (
                  <li
                    key={item}
                    className="grid grid-cols-[1.5rem_1fr] gap-3 text-[0.95rem] leading-relaxed text-[var(--ink-2)]"
                  >
                    <Check
                      className="mt-1 h-4 w-4 text-[var(--clay)]"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-6 max-w-[58ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
              No suggested additions. The record reads as a solid first draft.
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-14 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={startAnother}>
          File another report
        </Button>
        <Link href="/assess" className="button button-secondary">
          <span className="button-icon" aria-hidden="true">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span>Assess your risk</span>
        </Link>
        <Link href="/" className="button button-link">
          <span>Return home</span>
        </Link>
      </div>

      {report ? (
        <p className="mt-12 border-t border-[var(--rule)] pt-6 text-[0.78rem] leading-relaxed text-[var(--ink-3)]">
          Report ID: {report.id}
        </p>
      ) : null}
    </section>
  );
}
