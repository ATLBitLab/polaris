import Link from "next/link";
import type { Metadata } from "next";

import {
  ActiveFiltersSummary,
  DashboardFilters,
} from "@/components/overview/dashboard-filters";
import { DangerBars } from "@/components/overview/danger-bars";
import { FilterDrawer } from "@/components/overview/filter-drawer";
import { IncidentMap } from "@/components/overview/incident-map";
import { RecentBars } from "@/components/overview/recent-bars";
import { RegionList } from "@/components/overview/region-list";
import { StatCard } from "@/components/overview/stat-card";
import { SiteFooter } from "@/components/site-footer";
import { shouldShowFakeIncidentReports } from "@/lib/fake-incident-reports";
import { loadOverviewData } from "@/lib/incident-overview";
import {
  activeFilterCount,
  parseOverviewFilters,
  type DatePreset,
  type OverviewFilters,
} from "@/lib/overview-filters";

export const metadata: Metadata = {
  title: "Overview · Polaris",
  description:
    "An aggregate view of transnational repression incidents reported across the United States.",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export default async function OverviewPage({
  searchParams,
}: {
  readonly searchParams: SearchParams;
}) {
  const demoEnvEnabled = shouldShowFakeIncidentReports();
  const sp = await searchParams;
  const filters = parseOverviewFilters(sp, { demoEnvEnabled });
  const data = await loadOverviewData(filters);

  const violencePct =
    data.physicalViolence.analyzed === 0
      ? null
      : Math.round(
          (data.physicalViolence.withViolence /
            data.physicalViolence.analyzed) *
            100,
        );

  const evidencePct =
    data.evidence.analyzed === 0
      ? null
      : Math.round((data.evidence.withEvidence / data.evidence.analyzed) * 100);

  const regionsForList =
    filters.regions.length > 0 ? data.allRegions : data.topRegions;
  const recentCopy = recentActivityCopy(filters.datePreset);
  const filtersActiveCount = activeFilterCount(filters, { demoEnvEnabled });

  return (
    <main className="mx-auto w-full max-w-[78rem] px-6 pt-10 pb-24 sm:px-10 sm:pt-14">
      <header className="flex items-center justify-between border-b border-[var(--rule)] pb-5">
        <Link
          href="/"
          className="flex items-center gap-3 text-[var(--ink)] no-underline"
          aria-label="Polaris home"
        >
          <StarMark className="h-3.5 w-3.5 text-[var(--clay)]" />
          <span className="wordmark text-[0.78rem]">Polaris</span>
        </Link>
        <span className="wordmark text-[0.7rem] text-[var(--ink-3)]">
          Public overview
        </span>
      </header>

      <section className="mt-12 grid gap-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div>
          <h1 className="display max-w-[20ch] text-[2.25rem] leading-[1.1] text-[var(--ink)] sm:text-[2.75rem]">
            Reports across the country.
          </h1>
          <p className="mt-6 max-w-[60ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
            A standing record of transnational repression incidents reported
            to Polaris from across the United States. This page exists to
            help the public, journalists, and policymakers see the pattern,
            not to identify any individual.
          </p>
        </div>
        <aside className="border-t border-[var(--rule-strong)] pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-8">
          <p className="text-[0.86rem] leading-[1.7] text-[var(--ink-3)]">
            <span className="numeral text-[var(--clay-deep)]">§</span>{" "}
            Locations are clustered by region; exact addresses are never
            displayed. Incident counts include reports the community has
            shared with Polaris.
            {data.demoDataIncluded ? (
              <>
                {" "}
                <span className="text-[var(--ink-2)]">
                  This view includes {data.demoCount} illustrative example
                  reports for demonstration.
                </span>
              </>
            ) : null}
          </p>
        </aside>
      </section>

      <section className="mt-10 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <FilterDrawer activeCount={filtersActiveCount}>
          <DashboardFilters
            filters={filters}
            demoEnvEnabled={demoEnvEnabled}
          />
        </FilterDrawer>
        <ActiveFiltersSummary
          filters={filters}
          totalShown={data.totalReports}
          totalAll={data.totalUnfiltered}
          demoEnvEnabled={demoEnvEnabled}
        />
      </section>

      <section className="mt-8">
        <div className="card overflow-hidden p-4 sm:p-6">
          <IncidentMap regions={data.allRegions} />
        </div>
        <MapLegend />
        {data.allRegions.length === 0 ? (
          <p className="mt-4 text-[0.86rem] text-[var(--ink-3)]">
            No regions match these filters. Adjust or{" "}
            <Link
              href="/overview"
              className="text-[var(--ink-2)] underline underline-offset-4"
            >
              clear all
            </Link>{" "}
            to see every report.
          </p>
        ) : null}
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          eyebrow="Total reports"
          footnote={totalReportsFootnote(data, filters)}
        >
          <p className="numeral text-[3.25rem] leading-[1] text-[var(--ink)]">
            {data.totalReports}
          </p>
        </StatCard>

        <StatCard
          eyebrow="Danger level"
          footnote={`${data.byDanger.untriaged} report${
            data.byDanger.untriaged === 1 ? "" : "s"
          } awaiting triage.`}
        >
          <DangerBars counts={data.byDanger} />
        </StatCard>

        <StatCard
          eyebrow="Physical confrontation"
          footnote={
            violencePct === null
              ? "Awaiting analyzed reports."
              : `${data.physicalViolence.withViolence} of ${data.physicalViolence.analyzed} analyzed reports involved direct physical contact.`
          }
        >
          <p className="numeral text-[3.25rem] leading-[1] text-[var(--ink)]">
            {violencePct === null ? "—" : `${violencePct}%`}
          </p>
        </StatCard>

        <StatCard
          eyebrow="Evidence captured"
          footnote={
            evidencePct === null
              ? "Awaiting analyzed reports."
              : `${data.evidence.withEvidence} of ${data.evidence.analyzed} analyzed reports include photos, audio, or files.`
          }
        >
          <p className="numeral text-[3.25rem] leading-[1] text-[var(--ink)]">
            {evidencePct === null ? "—" : `${evidencePct}%`}
          </p>
        </StatCard>
      </section>

      <section className="mt-20 border-t border-[var(--rule)] pt-8">
        <p className="numeral text-[0.86rem] text-[var(--clay-deep)]">I.</p>
        <h2 className="display mt-2 text-[1.5rem] leading-tight text-[var(--ink)]">
          Most active regions
        </h2>
        <p className="mt-3 max-w-[60ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
          {filters.regions.length > 0
            ? "The regions matching this view, ordered by report count, with a marker for the worst danger level any single report carried."
            : "The five regions with the most reports in this view, with a marker for the worst danger level any single report in that region carried."}
        </p>
        <div className="mt-6">
          <RegionList regions={regionsForList} />
        </div>
      </section>

      <section className="mt-16 border-t border-[var(--rule)] pt-8">
        <p className="numeral text-[0.86rem] text-[var(--clay-deep)]">II.</p>
        <h2 className="display mt-2 text-[1.5rem] leading-tight text-[var(--ink)]">
          Recent activity
        </h2>
        <p className="mt-3 max-w-[60ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
          {recentCopy.helper}
        </p>
        <div className="mt-6 max-w-[36rem]">
          <RecentBars
            weeks={data.recentByWeek}
            windowLabel={recentCopy.windowLabel}
          />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function totalReportsFootnote(
  data: { readonly totalLast30Days: number; readonly totalUnfiltered: number; readonly totalReports: number },
  filters: OverviewFilters,
): string {
  if (filters.datePreset !== "all") {
    return `Filtered from ${data.totalUnfiltered} report${
      data.totalUnfiltered === 1 ? "" : "s"
    } overall.`;
  }
  return `${data.totalLast30Days} in the last 30 days.`;
}

function recentActivityCopy(preset: DatePreset): {
  readonly helper: string;
  readonly windowLabel: string;
} {
  switch (preset) {
    case "7d":
      return {
        helper:
          "Reports per day over the last seven days. The dashboard updates as new reports are submitted.",
        windowLabel: "the last 7 days",
      };
    case "30d":
      return {
        helper:
          "Reports per week over the last 30 days. The dashboard updates as new reports are submitted.",
        windowLabel: "the last 30 days",
      };
    case "90d":
      return {
        helper:
          "Reports per week over the last 90 days. The dashboard updates as new reports are submitted.",
        windowLabel: "the last 90 days",
      };
    case "all":
      return {
        helper:
          "Reports per week over the last eight weeks. The dashboard updates as new reports are submitted.",
        windowLabel: "the last 8 weeks",
      };
  }
}

function MapLegend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.78rem] text-[var(--ink-3)]">
      <LegendSwatch color="var(--risk-high)" label="Immediate attention" />
      <LegendSwatch color="var(--risk-mid)" label="Danger within a week" />
      <LegendSwatch color="var(--risk-low)" label="Not immediate" />
      <LegendSwatch color="var(--risk-untriaged)" label="Untriaged" />
      <span className="ml-auto">
        Larger circles indicate more reports in that region.
      </span>
    </div>
  );
}

function LegendSwatch({
  color,
  label,
}: {
  readonly color: string;
  readonly label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function StarMark({ className = "" }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 1.6 L13.05 10.95 L22.4 12 L13.05 13.05 L12 22.4 L10.95 13.05 L1.6 12 L10.95 10.95 Z"
        fill="currentColor"
      />
    </svg>
  );
}
