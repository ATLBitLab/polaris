"use client";

import type { IncidentChecklistItem } from "@/lib/incident-report";
import { useIncidentReport } from "@/components/incident-report-provider";
import {
  ReportProgress,
  ReportStepHeading,
  ReportStepNav,
} from "@/components/incident-report-chrome";

export default function ReportNextPage() {
  const { report, updateChecklist } = useIncidentReport();
  const checklist = report?.draft.checklist ?? [];

  return (
    <section>
      <ReportProgress currentSlug="next" />
      <ReportStepHeading
        slug="next"
        helper="Tick what you have already handled. The list adapts as you add detail."
      />

      <ChecklistEditor checklist={checklist} onChange={updateChecklist} />

      <ReportStepNav currentSlug="next" />
    </section>
  );
}

function ChecklistEditor({
  checklist,
  onChange,
}: {
  readonly checklist: readonly IncidentChecklistItem[];
  readonly onChange: (checklist: readonly IncidentChecklistItem[]) => void;
}) {
  if (checklist.length === 0) {
    return (
      <p className="mt-6 border-t border-[var(--rule)] pt-5 text-[0.95rem] leading-relaxed text-[var(--ink-3)] italic">
        Add detail in the previous steps to see suggestions.
      </p>
    );
  }

  return (
    <ul className="mt-5 border-t border-[var(--rule)]">
      {checklist.map((item, index) => (
        <li key={item.id} className="border-b border-[var(--rule)]">
          <label
            className={`grid cursor-pointer grid-cols-[auto_1fr] gap-4 px-3 py-4 -mx-3 transition-colors duration-150 ease-out ${
              item.completed
                ? "bg-[var(--clay-soft)]"
                : "hover:bg-[var(--paper-deep)]"
            }`}
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(event) => {
                const next = checklist.map((current, itemIndex) =>
                  itemIndex === index
                    ? { ...current, completed: event.target.checked }
                    : current,
                );
                onChange(next);
              }}
              className="mt-1 h-5 w-5 accent-[var(--clay)]"
            />
            <span>
              <span className="block text-[1rem] font-medium text-[var(--ink)]">
                {item.label}
              </span>
              <span className="mt-1 block max-w-[58ch] text-[0.92rem] leading-relaxed text-[var(--ink-2)]">
                {item.rationale}
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
