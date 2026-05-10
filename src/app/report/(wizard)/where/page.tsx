"use client";

import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIncidentReport } from "@/components/incident-report-provider";
import {
  ReportProgress,
  ReportStepHeading,
  ReportStepNav,
} from "@/components/incident-report-chrome";

export default function ReportWherePage() {
  const {
    report,
    manualLatitude,
    manualLongitude,
    requestBrowserLocation,
    updateManualLocation,
  } = useIncidentReport();
  const draft = report?.draft;

  return (
    <section>
      <ReportProgress currentSlug="where" />
      <ReportStepHeading
        slug="where"
        helper="Use your browser location, or describe the place in your own words."
      />

      {draft ? (
        <>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={requestBrowserLocation}
              iconBefore={<LocateFixed className="h-4 w-4" />}
            >
              Use browser location
            </Button>
          </div>
          <div className="mt-5 grid gap-4">
            <label>
              <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
                Address, venue, or description
              </span>
              <input
                value={draft.locationLabel}
                onChange={(event) =>
                  updateManualLocation({ label: event.target.value })
                }
                className="mt-2 h-12 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 text-[1rem] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
                  Latitude
                </span>
                <input
                  inputMode="decimal"
                  value={manualLatitude}
                  onChange={(event) =>
                    updateManualLocation({ latitude: event.target.value })
                  }
                  className="mt-2 h-12 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 text-[1rem] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
                />
              </label>
              <label>
                <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
                  Longitude
                </span>
                <input
                  inputMode="decimal"
                  value={manualLongitude}
                  onChange={(event) =>
                    updateManualLocation({ longitude: event.target.value })
                  }
                  className="mt-2 h-12 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 text-[1rem] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
                />
              </label>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-6 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
          Starting a report.
        </p>
      )}

      <ReportStepNav currentSlug="where" />
    </section>
  );
}
