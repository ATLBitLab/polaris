import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  dangerBuckets,
  datePresets,
  evidenceOptions,
  filterHref,
  hasActiveFilters,
  violenceOptions,
  type DangerBucket,
  type DatePreset,
  type EvidenceFilter,
  type OverviewFilters,
  type ViolenceFilter,
} from "@/lib/overview-filters";
import { regionCentroids, regionKeys } from "@/lib/region-centroids";

type DashboardFiltersProps = {
  readonly filters: OverviewFilters;
  readonly demoEnvEnabled: boolean;
};

const dangerLabels: Record<DangerBucket, string> = {
  high: "Immediate attention",
  mid: "Danger within a week",
  low: "Not immediate",
  untriaged: "Untriaged",
};

const datePresetLabels: Record<DatePreset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

const violenceLabels: Record<ViolenceFilter, string> = {
  any: "Any",
  yes: "Involved physical contact",
  no: "No physical contact",
};

const evidenceLabels: Record<EvidenceFilter, string> = {
  any: "Any",
  with: "With evidence",
  without: "Without evidence",
};

export function DashboardFilters({
  filters,
  demoEnvEnabled,
}: DashboardFiltersProps) {
  const regionsSelected = new Set(filters.regions);
  const dangerSelected = new Set(filters.danger);

  return (
    <form
      method="GET"
      action="/overview"
      className="flex h-full flex-col"
      aria-label="Dashboard filters"
    >
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 sm:px-6">
        <div className="flex flex-col gap-7">
          <Fieldset legend="Regions">
            <ul className="border-t border-[var(--rule)]">
              {regionKeys.map((key) => (
                <CheckRow
                  key={key}
                  name="regions"
                  value={key}
                  label={regionCentroids[key].label}
                  defaultChecked={regionsSelected.has(key)}
                />
              ))}
            </ul>
          </Fieldset>

          <Fieldset legend="Danger level">
            <ul className="border-t border-[var(--rule)]">
              {dangerBuckets.map((bucket) => (
                <CheckRow
                  key={bucket}
                  name="danger"
                  value={bucket}
                  label={dangerLabels[bucket]}
                  defaultChecked={dangerSelected.has(bucket)}
                />
              ))}
            </ul>
          </Fieldset>

          <Fieldset legend="Date range">
            <ul className="border-t border-[var(--rule)]">
              {datePresets.map((preset) => (
                <RadioRow
                  key={preset}
                  name="date"
                  value={preset}
                  label={datePresetLabels[preset]}
                  defaultChecked={filters.datePreset === preset}
                />
              ))}
            </ul>
          </Fieldset>

          <Fieldset legend="Physical violence">
            <ul className="border-t border-[var(--rule)]">
              {violenceOptions.map((option) => (
                <RadioRow
                  key={option}
                  name="violence"
                  value={option}
                  label={violenceLabels[option]}
                  defaultChecked={filters.violence === option}
                />
              ))}
            </ul>
          </Fieldset>

          <Fieldset legend="Evidence">
            <ul className="border-t border-[var(--rule)]">
              {evidenceOptions.map((option) => (
                <RadioRow
                  key={option}
                  name="evidence"
                  value={option}
                  label={evidenceLabels[option]}
                  defaultChecked={filters.evidence === option}
                />
              ))}
            </ul>
          </Fieldset>

          {demoEnvEnabled ? (
            <Fieldset legend="Demo data">
              <ul className="border-t border-[var(--rule)]">
                <RadioRow
                  name="demo"
                  value="show"
                  label="Show illustrative reports"
                  defaultChecked={filters.includeDemo}
                />
                <RadioRow
                  name="demo"
                  value="hide"
                  label="Hide illustrative reports"
                  defaultChecked={!filters.includeDemo}
                />
              </ul>
            </Fieldset>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--rule)] bg-[var(--paper)] px-5 py-4 sm:px-6">
        <Link href="/overview" className="button button-link">
          Clear all
        </Link>
        <Button type="submit">Apply filters</Button>
      </div>
    </form>
  );
}

type ActiveFiltersSummaryProps = {
  readonly filters: OverviewFilters;
  readonly totalShown: number;
  readonly totalAll: number;
  readonly demoEnvEnabled: boolean;
};

export function ActiveFiltersSummary({
  filters,
  totalShown,
  totalAll,
  demoEnvEnabled,
}: ActiveFiltersSummaryProps) {
  if (!hasActiveFilters(filters, { demoEnvEnabled })) {
    return null;
  }

  const chips: { readonly key: string; readonly label: string; readonly href: string }[] =
    [];

  for (const region of filters.regions) {
    chips.push({
      key: `region:${region}`,
      label: regionCentroids[region].label,
      href: filterHref(filters, {
        regions: filters.regions.filter((r) => r !== region),
      }),
    });
  }

  for (const bucket of filters.danger) {
    chips.push({
      key: `danger:${bucket}`,
      label: dangerLabels[bucket],
      href: filterHref(filters, {
        danger: filters.danger.filter((b) => b !== bucket),
      }),
    });
  }

  if (filters.datePreset !== "all") {
    chips.push({
      key: "date",
      label: datePresetLabels[filters.datePreset],
      href: filterHref(filters, { datePreset: "all" }),
    });
  }

  if (filters.violence !== "any") {
    chips.push({
      key: "violence",
      label: violenceLabels[filters.violence],
      href: filterHref(filters, { violence: "any" }),
    });
  }

  if (filters.evidence !== "any") {
    chips.push({
      key: "evidence",
      label: evidenceLabels[filters.evidence],
      href: filterHref(filters, { evidence: "any" }),
    });
  }

  if (demoEnvEnabled && !filters.includeDemo) {
    chips.push({
      key: "demo",
      label: "Demo data hidden",
      href: filterHref(filters, { includeDemo: true }),
    });
  }

  const reportWord = totalShown === 1 ? "report" : "reports";

  return (
    <div className="min-w-0 max-w-full">
      <p className="text-[0.86rem] leading-[1.6] text-[var(--ink-3)]">
        Showing{" "}
        <span className="numeral text-[var(--ink-2)]">{totalShown}</span> of{" "}
        <span className="numeral text-[var(--ink-2)]">{totalAll}</span>{" "}
        {reportWord}.
      </p>
      <ul className="mt-2 flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <Link
              href={chip.href}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--paper-inset)] px-3 py-1 text-[0.82rem] text-[var(--ink-2)] no-underline transition-colors duration-150 ease-out hover:border-[var(--rule-strong)] hover:bg-[var(--paper-deep)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
            >
              <span>{chip.label}</span>
              <span aria-hidden="true" className="text-[var(--ink-3)]">
                ×
              </span>
              <span className="sr-only">Remove filter</span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/overview"
            className="text-[0.82rem] text-[var(--ink-2)] underline underline-offset-4 hover:text-[var(--ink)]"
          >
            Clear all
          </Link>
        </li>
      </ul>
    </div>
  );
}

function Fieldset({
  legend,
  children,
}: {
  readonly legend: string;
  readonly children: ReactNode;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="wordmark text-[0.7rem] text-[var(--ink-3)]">
        {legend}
      </legend>
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

function CheckRow({
  name,
  value,
  label,
  defaultChecked,
}: {
  readonly name: string;
  readonly value: string;
  readonly label: string;
  readonly defaultChecked: boolean;
}) {
  return (
    <li className="border-b border-[var(--rule)]">
      <label className="-mx-2 flex cursor-pointer items-center gap-3 px-2 py-2.5 transition-colors duration-150 ease-out hover:bg-[var(--paper-deep)] has-[:checked]:bg-[var(--clay-soft)]">
        <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            name={name}
            value={value}
            defaultChecked={defaultChecked}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-sm border border-[var(--rule-strong)] bg-[var(--paper-inset)] peer-checked:border-[var(--clay)] peer-checked:bg-[var(--clay)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]"
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            className="relative h-3 w-3 text-[var(--paper)] opacity-0 peer-checked:opacity-100"
          >
            <path
              d="M2 6.5 L5 9.25 L10 3"
              stroke="currentColor"
              strokeWidth="1.75"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="min-w-0 text-[0.95rem] leading-snug text-[var(--ink)]">
          {label}
        </span>
      </label>
    </li>
  );
}

function RadioRow({
  name,
  value,
  label,
  defaultChecked,
}: {
  readonly name: string;
  readonly value: string;
  readonly label: string;
  readonly defaultChecked: boolean;
}) {
  return (
    <li className="border-b border-[var(--rule)]">
      <label className="-mx-2 flex cursor-pointer items-center gap-3 px-2 py-2.5 transition-colors duration-150 ease-out hover:bg-[var(--paper-deep)] has-[:checked]:bg-[var(--clay-soft)]">
        <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            type="radio"
            name={name}
            value={value}
            defaultChecked={defaultChecked}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-[var(--rule-strong)] bg-[var(--paper-inset)] peer-checked:border-[var(--clay)] peer-checked:bg-[var(--clay)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]"
          />
          <span
            aria-hidden="true"
            className="relative h-2 w-2 rounded-full bg-[var(--paper)] opacity-0 peer-checked:opacity-100"
          />
        </span>
        <span className="min-w-0 text-[0.95rem] leading-snug text-[var(--ink)]">
          {label}
        </span>
      </label>
    </li>
  );
}

