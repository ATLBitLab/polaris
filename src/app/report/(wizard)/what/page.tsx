"use client";

import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIncidentReport } from "@/components/incident-report-provider";
import {
  ReportProgress,
  ReportStepHeading,
  ReportStepNav,
} from "@/components/incident-report-chrome";

export default function ReportWhatPage() {
  const {
    report,
    recordingState,
    startRecording,
    stopRecording,
    updateNarrative,
  } = useIncidentReport();
  const draft = report?.draft;

  return (
    <section>
      <ReportProgress currentSlug="what" />
      <ReportStepHeading
        slug="what"
        helper="Record a voice memo or type a plain-language account. Polaris keeps both."
      />

      {draft ? (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {recordingState === "recording" ? (
              <Button
                type="button"
                variant="strong"
                onClick={stopRecording}
                iconBefore={<Square className="h-4 w-4" />}
              >
                Stop
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  void startRecording();
                }}
                disabled={recordingState === "transcribing"}
                iconBefore={<Mic className="h-4 w-4" />}
              >
                {recordingState === "transcribing"
                  ? "Transcribing"
                  : "Record voice"}
              </Button>
            )}
            {recordingState === "unsupported" ? (
              <p className="text-[0.86rem] text-[var(--ink-3)]">
                Voice recording is not available in this browser.
              </p>
            ) : null}
          </div>
          {draft.transcriptText ? (
            <div className="mt-5 border-t border-[var(--rule)] pt-4">
              <p className="text-[0.82rem] font-medium tracking-[0.12em] text-[var(--ink-3)] uppercase">
                Transcript
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
                {draft.transcriptText}
              </p>
            </div>
          ) : null}
          <label className="mt-5 block">
            <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
              Written account
            </span>
            <textarea
              value={draft.narrativeText}
              onChange={(event) => updateNarrative(event.target.value)}
              rows={8}
              className="mt-2 w-full resize-y rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 py-3 text-[1rem] leading-relaxed transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
            />
          </label>
        </>
      ) : (
        <p className="mt-6 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
          Starting a report.
        </p>
      )}

      <ReportStepNav currentSlug="what" />
    </section>
  );
}
