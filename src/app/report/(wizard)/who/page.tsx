"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { IncidentPerson } from "@/lib/incident-report";
import { Button } from "@/components/ui/button";
import { useIncidentReport } from "@/components/incident-report-provider";
import {
  ReportProgress,
  ReportStepHeading,
  ReportStepNav,
} from "@/components/incident-report-chrome";

export default function ReportWhoPage() {
  const {
    report,
    analysisState,
    runAnalysis,
    addPerson,
    updatePerson,
    removePerson,
  } = useIncidentReport();
  const people = report?.draft.people ?? [];
  const autoExtractedRef = useRef(false);
  const hasNarrative =
    (report?.draft.narrativeText ?? "").trim().length > 0;

  useEffect(() => {
    if (autoExtractedRef.current) {
      return;
    }
    if (!report) {
      return;
    }
    if (!hasNarrative) {
      return;
    }
    if (people.length > 0) {
      autoExtractedRef.current = true;
      return;
    }
    if (analysisState !== "idle") {
      return;
    }
    autoExtractedRef.current = true;
    void runAnalysis();
  }, [report, hasNarrative, people.length, analysisState, runAnalysis]);

  return (
    <section>
      <ReportProgress currentSlug="who" />
      <ReportStepHeading
        slug="who"
        helper="Polaris reads your written account and lists people automatically. Add anyone it missed."
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={addPerson}
          disabled={!report}
          iconBefore={<Plus className="h-4 w-4" />}
        >
          Add person
        </Button>
        {analysisState === "running" ? (
          <p className="text-[0.86rem] text-[var(--ink-3)]">
            Reviewing your account.
          </p>
        ) : null}
      </div>

      <PeopleEditor
        people={people}
        onUpdatePerson={updatePerson}
        onRemovePerson={removePerson}
      />

      <ReportStepNav currentSlug="who" />
    </section>
  );
}

function PeopleEditor({
  people,
  onUpdatePerson,
  onRemovePerson,
}: {
  readonly people: readonly IncidentPerson[];
  readonly onUpdatePerson: (index: number, person: IncidentPerson) => void;
  readonly onRemovePerson: (index: number) => void;
}) {
  if (people.length === 0) {
    return (
      <p className="mt-6 border-t border-[var(--rule)] pt-5 text-[0.95rem] leading-relaxed text-[var(--ink-3)] italic">
        No people listed yet.
      </p>
    );
  }

  return (
    <ol className="mt-6 border-t border-[var(--rule)]">
      {people.map((person, index) => (
        <li
          key={index}
          className="border-b border-[var(--rule)] py-5"
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <TextInput
              label="Name or identifier"
              value={person.displayName}
              onChange={(value) =>
                onUpdatePerson(index, {
                  ...person,
                  displayName: value,
                })
              }
            />
            <TextInput
              label="Role"
              value={person.role}
              onChange={(value) =>
                onUpdatePerson(index, { ...person, role: value })
              }
            />
            <button
              type="button"
              onClick={() => onRemovePerson(index)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 text-[0.9rem] text-[var(--ink-2)] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)] sm:mt-7 sm:w-12 sm:px-0"
              aria-label={`Remove ${person.displayName}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="sm:sr-only">Remove</span>
            </button>
          </div>
          <label className="mt-4 block">
            <span className="block text-[0.82rem] font-medium text-[var(--ink)]">
              Details
            </span>
            <p
              className="mt-1 text-[0.82rem] leading-relaxed text-[var(--ink-3)]"
              id={`person-details-hint-${index}`}
            >
              Provide any identifying information that may be helpful, such as
              distinguishing scars or tattoos, hair color, voice characteristics,
              clothing, body shape, posture, etc.
            </p>
            <textarea
              value={person.description}
              onChange={(event) =>
                onUpdatePerson(index, {
                  ...person,
                  description: event.target.value,
                })
              }
              rows={2}
              aria-describedby={`person-details-hint-${index}`}
              className="mt-2 w-full resize-y rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 py-2 text-[0.95rem] leading-relaxed transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
            />
          </label>
        </li>
      ))}
    </ol>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[0.82rem] font-medium text-[var(--ink)]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 text-[0.95rem] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
      />
    </label>
  );
}
