"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  getOrCreateDeviceSource,
  useIncidentReport,
} from "@/components/incident-report-provider";
import { StarMark } from "@/components/incident-report-chrome";

export default function ReportDonePage() {
  const router = useRouter();
  const {
    report,
    markReportSubmitted,
    requestReportBlinding,
    resetReport,
  } = useIncidentReport();
  const blindingRequestedRef = useRef<string | null>(null);
  const submitNotifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (report) {
      markReportSubmitted();
    }

    if (report && submitNotifiedRef.current !== report.id) {
      submitNotifiedRef.current = report.id;
      void fetch(`/api/incident-reports/${report.id}/submit`, {
        method: "POST",
        headers: { "x-polaris-device-source": getOrCreateDeviceSource() },
        keepalive: true,
      }).catch((nextError) => {
        console.warn("Unable to mark incident report submitted", nextError);
      });
    }

    if (report && blindingRequestedRef.current !== report.id) {
      blindingRequestedRef.current = report.id;
      void requestReportBlinding();
    }
  }, [markReportSubmitted, report, requestReportBlinding]);

  function startAnother() {
    resetReport();
    router.push("/report");
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

      {report?.draft.contactConsent === true ? (
        <p className="mt-5 max-w-[58ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
          One of our representatives will reach out to you soon to discuss
          next steps for your case.
        </p>
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
